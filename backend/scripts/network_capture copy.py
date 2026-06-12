"""
network_capture.py
------------------
Capture network traffic in real-time, extract flow features, and send them to a FastAPI
analysis endpoint.

Dependencies:
    pip install scapy httpx

On Windows, install Npcap (https://npcap.com/#download) and enable "WinPcap API-compatible mode"
for Scapy compatibility. Run the script as Administrator for raw packet capture.
"""

import os
import re
import sys
import time
import asyncio
import platform
import threading
import httpx
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
ENDPOINT_URL = "http://127.0.0.1:8000/api/analyze"
FLUSH_INTERVAL = 30  # seconds between each flush to FastAPI
INTERFACE = r"Specify your capture interface, e.g. \Device\NPF_{...}"
MAX_CONCURRENT = 5  # maximum parallel requests to FastAPI
TIMEOUT = 60  # per-request timeout (LLM may be slow)
LOG_LEVEL = logging.INFO

# ---------------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("capture")
 

# ---------------------------------------------------------------------------
# OS DETECTION
# ---------------------------------------------------------------------------
def check_permissions():
    if platform.system() == "Windows":
        import ctypes

        if not ctypes.windll.shell32.IsUserAnAdmin():
            log.error("Run as Administrator on Windows")
            sys.exit(1)
    else:
        if os.getuid() != 0:
            log.error("Run with sudo on Linux")
            sys.exit(1)


def get_default_interface() -> str:
    if platform.system() == "Windows":
        # Replace with your Npcap interface
        return r"\Device\NPF_{431854E4-BC42-45F1-98F7-2F98D5531472}"

    # Linux — automatically detect the active interface
    try:
        import subprocess

        result = subprocess.run(
            ["ip", "route", "get", "8.8.8.8"], capture_output=True, text=True
        )
        match = re.search(r"dev\s+(\S+)", result.stdout)
        if match:
            return match.group(1)
    except Exception:
        pass

    return "eth0"  # fallback


INTERFACE = get_default_interface()

# ---------------------------------------------------------------------------
# FLOW ACCUMULATOR
# ---------------------------------------------------------------------------
FlowKey = tuple  # (src_ip, dst_ip, src_port, dst_port, protocol)


@dataclass
class FlowStats:
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    service: str = "-"
    src_bytes: int = 0
    dst_bytes: int = 0
    src_pkts: int = 0
    dst_pkts: int = 0
    src_ip_bytes: int = 0
    dst_ip_bytes: int = 0
    missed_bytes: int = 0
    conn_state: str = "SF"
    started_at: float = field(default_factory=time.time)
    dns_qclass: int = 0
    dns_qtype: int = 0
    dns_rcode: int = 0
    http_trans_depth: int = 0
    http_request_body_len: int = 0
    http_response_body_len: int = 0
    http_status_code: int = 0


flows: dict[FlowKey, FlowStats] = {}
flows_lock = threading.Lock()


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------
def guess_service(port: int, _proto: str) -> str:
    table = {
        80: "http",
        443: "https",
        53: "dns",
        22: "ssh",
        21: "ftp",
        25: "smtp",
        110: "pop3",
        143: "imap",
        3306: "mysql",
        5432: "postgresql",
        6379: "redis",
    }
    return table.get(port, "-")


def proto_name(pkt) -> str:
    from scapy.layers.inet import TCP, UDP, ICMP

    if TCP in pkt:
        return "tcp"
    if UDP in pkt:
        return "udp"
    if ICMP in pkt:
        return "icmp"
    return "other"


def tcp_conn_state(flags: str) -> str:
    if "S" in flags and "A" not in flags:
        return "S0"
    if "F" in flags:
        return "SF"
    if "R" in flags:
        return "RSTO"
    return "OTH"


# ---------------------------------------------------------------------------
# PACKET CALLBACK
# ---------------------------------------------------------------------------
def on_packet(pkt):
    from scapy.layers.inet import IP, TCP, UDP
    from scapy.layers.dns import DNS, DNSQR

    if IP not in pkt:
        return

    ip = pkt[IP]
    proto = proto_name(pkt)
    src_ip, dst_ip = ip.src, ip.dst
    src_port = dst_port = 0

    if TCP in pkt:
        src_port = pkt[TCP].sport
        dst_port = pkt[TCP].dport
    elif UDP in pkt:
        src_port = pkt[UDP].sport
        dst_port = pkt[UDP].dport

    key: FlowKey = (src_ip, dst_ip, src_port, dst_port, proto)
    pkt_len = len(pkt)

    with flows_lock:
        if key not in flows:
            flows[key] = FlowStats(
                src_ip=src_ip,
                dst_ip=dst_ip,
                src_port=src_port,
                dst_port=dst_port,
                protocol=proto,
                service=guess_service(dst_port, proto),
            )
        f = flows[key]
        f.src_pkts += 1
        f.src_bytes += pkt_len
        f.src_ip_bytes += pkt_len

        if TCP in pkt:
            f.conn_state = tcp_conn_state(str(pkt[TCP].flags))

        if DNS in pkt:
            dns = pkt[DNS]
            if dns.qr == 0 and DNSQR in pkt:
                f.dns_qclass = int(pkt[DNSQR].qclass)
                f.dns_qtype = int(pkt[DNSQR].qtype)
                f.service = "dns"
            elif dns.qr == 1:
                f.dns_rcode = int(dns.rcode)

        try:
            from scapy.layers.http import HTTPRequest, HTTPResponse

            if HTTPRequest in pkt:
                f.http_trans_depth += 1
                f.http_request_body_len += len(bytes(pkt[HTTPRequest]))
                f.service = "http"
            if HTTPResponse in pkt:
                resp = pkt[HTTPResponse]
                f.http_response_body_len += len(bytes(resp))
                try:
                    f.http_status_code = int(resp.Status_Code)
                except Exception:
                    pass
        except Exception:
            pass


# ---------------------------------------------------------------------------
# BUILD PAYLOAD
# ---------------------------------------------------------------------------
def build_payload(f: FlowStats) -> dict:
    return {
        "src_ip": f.src_ip,
        "dst_ip": f.dst_ip,
        "src_port": f.src_port,
        "dst_port": f.dst_port,
        "proto": f.protocol or "other",
        "service": f.service or "-",
        "conn_state": f.conn_state,
        "duration": round(time.time() - f.started_at, 4),
        "src_bytes": f.src_bytes,
        "dst_bytes": f.dst_bytes,
        "missed_bytes": f.missed_bytes,
        "src_pkts": f.src_pkts,
        "src_ip_bytes": f.src_ip_bytes,
        "dst_pkts": f.dst_pkts,
        "dst_ip_bytes": f.dst_ip_bytes,
        "dns_qclass": f.dns_qclass,
        "dns_qtype": f.dns_qtype,
        "dns_rcode": f.dns_rcode,
        "http_trans_depth": f.http_trans_depth,
        "http_request_body_len": f.http_request_body_len,
        "http_response_body_len": f.http_response_body_len,
        "http_status_code": f.http_status_code,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# ASYNC FLUSH
# ---------------------------------------------------------------------------
async def send_one(client: httpx.AsyncClient, payload: dict, sem: asyncio.Semaphore):
    async with sem:
        try:
            r = await client.post(ENDPOINT_URL, json=payload, timeout=TIMEOUT)
            if r.status_code == 200:
                log.debug(
                    f"  ✓ {payload['dst_ip']}:{payload['dst_port']} [{payload['proto']}]"
                )
            else:
                log.warning(f"  ✗ HTTP {r.status_code} — {r.text[:80]}")
        except httpx.TimeoutException:
            log.warning(f"  ✗ Timeout for {payload['dst_ip']}:{payload['dst_port']}")
        except httpx.RequestError as e:
            log.error(f"  ✗ Network error: {e}")


async def flush_async(payloads: list[dict]):
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    async with httpx.AsyncClient() as client:
        tasks = [send_one(client, p, sem) for p in payloads]
        await asyncio.gather(*tasks)


# ---------------------------------------------------------------------------
# FLUSH THREAD
# ---------------------------------------------------------------------------
def flush_loop():
    while True:
        time.sleep(FLUSH_INTERVAL)

        with flows_lock:
            snapshot = dict(flows)
            flows.clear()

        if not snapshot:
            log.debug("No flows captured.")
            continue

        payloads = [build_payload(f) for f in snapshot.values()]
        log.info(f"Sending {len(payloads)} flows to FastAPI...")
        asyncio.run(flush_async(payloads))
        log.info("Batch sent.")


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------
def main():
    check_permissions()

    from scapy.all import sniff
    import logging as _l

    _l.getLogger("scapy.runtime").setLevel(_l.ERROR)

    log.info("=" * 60)
    log.info("  Network Capture → FastAPI Analyzer")
    log.info(f"  OS            : {platform.system()}")
    log.info(f"  Endpoint      : {ENDPOINT_URL}")
    log.info(f"  Flush         : every {FLUSH_INTERVAL}s")
    log.info(f"  Max concurrent: {MAX_CONCURRENT}")
    log.info(f"  Interface     : {INTERFACE}")
    log.info("=" * 60)

    t = threading.Thread(target=flush_loop, daemon=True)
    t.start()

    try:
        sniff(iface=INTERFACE, prn=on_packet, store=False, filter="ip")
    except KeyboardInterrupt:
        log.info("Stop requested.")
    except PermissionError:
        log.error(
            "Permission denied — rerun as Administrator (Windows) or sudo (Linux)."
        )


if __name__ == "__main__":
    main()
