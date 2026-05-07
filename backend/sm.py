"""
Network Traffic Simulator
Envoie 10 types de trafic réseau différents vers un endpoint.
Usage: python traffic_simulator.py --url http://your-endpoint/api/analyze
"""

import requests
import argparse
import random
import time
from datetime import datetime, timezone

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
ENDPOINT_URL = "http://localhost:8000/api/analyze"  # Modifier ici ou via --url

# ──────────────────────────────────────────────
# 10 types de trafic
# ──────────────────────────────────────────────

TRAFFIC_TYPES = {

    # 1. HTTP normal (navigation web)
    "http_normal": {
        "proto": "tcp",
        "service": "http",
        "conn_state": "SF",
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 80,
        "duration": lambda: round(random.uniform(0.1, 2.5), 4),
        "src_bytes": lambda: random.randint(300, 1500),
        "dst_bytes": lambda: random.randint(5000, 80000),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(5, 20),
        "dst_pkts": lambda: random.randint(10, 50),
        "http_trans_depth": 1,
        "http_request_body_len": lambda: random.randint(0, 500),
        "http_response_body_len": lambda: random.randint(4000, 75000),
        "http_status_code": 200,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 2. HTTPS (TLS)
    "https_tls": {
        "proto": "tcp",
        "service": "ssl",
        "conn_state": "SF",
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 443,
        "duration": lambda: round(random.uniform(0.2, 5.0), 4),
        "src_bytes": lambda: random.randint(500, 3000),
        "dst_bytes": lambda: random.randint(10000, 200000),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(8, 30),
        "dst_pkts": lambda: random.randint(15, 80),
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 3. DNS query
    "dns_query": {
        "proto": "udp",
        "service": "dns",
        "conn_state": "SF",
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 53,
        "duration": lambda: round(random.uniform(0.001, 0.1), 6),
        "src_bytes": lambda: random.randint(40, 100),
        "dst_bytes": lambda: random.randint(60, 300),
        "missed_bytes": 0,
        "src_pkts": 1,
        "dst_pkts": 1,
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 1,       # IN (Internet)
        "dns_qtype": lambda: random.choice([1, 28, 15, 16]),  # A, AAAA, MX, TXT
        "dns_rcode": 0,        # NOERROR
    },

    # 4. Scan de ports (attaque)
    "port_scan": {
        "proto": "tcp",
        "service": "-",
        "conn_state": "REJ",  # Connexion rejetée
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": lambda: random.randint(1, 1024),
        "duration": 0,
        "src_bytes": 0,
        "dst_bytes": 0,
        "missed_bytes": 0,
        "src_pkts": 1,
        "dst_pkts": 0,
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 5. FTP transfert de fichier
    "ftp_transfer": {
        "proto": "tcp",
        "service": "ftp-data",
        "conn_state": "SF",
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 21,
        "duration": lambda: round(random.uniform(5.0, 120.0), 2),
        "src_bytes": lambda: random.randint(0, 1000),
        "dst_bytes": lambda: random.randint(100000, 50000000),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(10, 50),
        "dst_pkts": lambda: random.randint(100, 5000),
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 6. SSH (connexion shell distante)
    "ssh_session": {
        "proto": "tcp",
        "service": "ssh",
        "conn_state": "SF",
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 22,
        "duration": lambda: round(random.uniform(10.0, 3600.0), 2),
        "src_bytes": lambda: random.randint(2000, 50000),
        "dst_bytes": lambda: random.randint(2000, 50000),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(50, 500),
        "dst_pkts": lambda: random.randint(50, 500),
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 7. Brute-force SSH (attaque)
    "ssh_bruteforce": {
        "proto": "tcp",
        "service": "ssh",
        "conn_state": "RSTO",  # Reset par l'origine
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 22,
        "duration": lambda: round(random.uniform(0.01, 0.5), 4),
        "src_bytes": lambda: random.randint(100, 500),
        "dst_bytes": lambda: random.randint(100, 300),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(3, 8),
        "dst_pkts": lambda: random.randint(2, 6),
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 8. ICMP (ping)
    "icmp_ping": {
        "proto": "icmp",
        "service": "-",
        "conn_state": "OTH",
        "src_port": 0,
        "dst_port": 0,
        "duration": lambda: round(random.uniform(0.0, 0.01), 6),
        "src_bytes": lambda: random.randint(64, 128),
        "dst_bytes": lambda: random.randint(64, 128),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(1, 4),
        "dst_pkts": lambda: random.randint(1, 4),
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },

    # 9. Exfiltration DNS (attaque C2)
    "dns_exfiltration": {
        "proto": "udp",
        "service": "dns",
        "conn_state": "SF",
        "src_port": lambda: random.randint(49152, 65535),
        "dst_port": 53,
        "duration": lambda: round(random.uniform(0.001, 0.05), 6),
        "src_bytes": lambda: random.randint(200, 500),  # Requêtes anormalement grandes
        "dst_bytes": lambda: random.randint(50, 200),
        "missed_bytes": 0,
        "src_pkts": lambda: random.randint(3, 10),
        "dst_pkts": lambda: random.randint(3, 10),
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 1,
        "dns_qtype": 16,   # TXT — souvent utilisé pour l'exfiltration
        "dns_rcode": 0,
    },

    # 10. Connexion partielle / SYN flood (attaque DDoS)
    "syn_flood": {
        "proto": "tcp",
        "service": "-",
        "conn_state": "S0",   # SYN envoyé, jamais acquitté
        "src_port": lambda: random.randint(1024, 65535),
        "dst_port": lambda: random.choice([80, 443, 8080]),
        "duration": 0,
        "src_bytes": 0,
        "dst_bytes": 0,
        "missed_bytes": lambda: random.randint(0, 100),
        "src_pkts": 1,
        "dst_pkts": 0,
        "http_trans_depth": 0,
        "http_request_body_len": 0,
        "http_response_body_len": 0,
        "http_status_code": 0,
        "dns_qclass": 0, "dns_qtype": 0, "dns_rcode": 0,
    },
}

# ──────────────────────────────────────────────
# Pools d'adresses IP
# ──────────────────────────────────────────────

INTERNAL_IPS = [f"192.168.{r}.{h}" for r in range(1, 5) for h in range(1, 20)]
EXTERNAL_IPS = [
    "8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1",
    "104.21.14.2", "172.217.20.46", "151.101.1.69",
    "185.199.108.153", "140.82.121.4", "13.32.99.190",
]
ATTACKER_IPS = [f"10.{r}.{h}.{x}" for r in range(0, 3) for h in range(0, 5) for x in range(1, 5)]

IP_POOLS = {
    "http_normal":      (INTERNAL_IPS, EXTERNAL_IPS),
    "https_tls":        (INTERNAL_IPS, EXTERNAL_IPS),
    "dns_query":        (INTERNAL_IPS, ["8.8.8.8", "1.1.1.1", "9.9.9.9"]),
    "port_scan":        (ATTACKER_IPS, INTERNAL_IPS),
    "ftp_transfer":     (INTERNAL_IPS, EXTERNAL_IPS),
    "ssh_session":      (INTERNAL_IPS, EXTERNAL_IPS),
    "ssh_bruteforce":   (ATTACKER_IPS, INTERNAL_IPS),
    "icmp_ping":        (INTERNAL_IPS, INTERNAL_IPS),
    "dns_exfiltration": (ATTACKER_IPS, ["198.51.100.1", "203.0.113.5"]),
    "syn_flood":        (ATTACKER_IPS, INTERNAL_IPS),
}

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def resolve(val):
    """Évalue un callable ou retourne la valeur directement."""
    return val() if callable(val) else val


def build_payload(traffic_type: str) -> dict:
    """Construit un payload JSON pour le type de trafic donné."""
    template = TRAFFIC_TYPES[traffic_type]
    src_pool, dst_pool = IP_POOLS[traffic_type]

    src_bytes = resolve(template["src_bytes"])
    dst_bytes = resolve(template["dst_bytes"])
    src_pkts  = resolve(template["src_pkts"])
    dst_pkts  = resolve(template["dst_pkts"])

    # Approximation IP bytes (header 20 bytes par paquet)
    src_ip_bytes = src_bytes + src_pkts * 20
    dst_ip_bytes = dst_bytes + dst_pkts * 20

    return {
        "_id": f"{traffic_type}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
        "src_ip":   "127.0.0.1",            # forcé pour passer ALLOWED_IPS côté serveur
        "dst_ip":   random.choice(dst_pool),
        "src_port": resolve(template["src_port"]),
        "dst_port": resolve(template["dst_port"]),
        "proto":    template["proto"],
        "service":  template["service"],
        "conn_state": template["conn_state"],
        "duration": resolve(template["duration"]),
        "src_bytes":  src_bytes,
        "dst_bytes":  dst_bytes,
        "missed_bytes": resolve(template["missed_bytes"]),
        "src_pkts":   src_pkts,
        "src_ip_bytes": src_ip_bytes,
        "dst_pkts":   dst_pkts,
        "dst_ip_bytes": dst_ip_bytes,
        "dns_qclass": resolve(template["dns_qclass"]),
        "dns_qtype":  resolve(template["dns_qtype"]),
        "dns_rcode":  resolve(template["dns_rcode"]),
        "http_trans_depth":         resolve(template["http_trans_depth"]),
        "http_request_body_len":    resolve(template["http_request_body_len"]),
        "http_response_body_len":   resolve(template["http_response_body_len"]),
        "http_status_code":         resolve(template["http_status_code"]),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "raw_log": f"[{traffic_type.upper()}] simulated log entry",
    }


def send_payload(url: str, payload: dict, verbose: bool = True) -> bool:
    """Envoie un payload à l'endpoint et retourne True si succès."""
    try:
        resp = requests.post(url, json=payload, timeout=25)
        if verbose:
            status = "✅" if resp.status_code < 400 else "❌"
            print(f"  {status} [{resp.status_code}] {payload['_id']}")
        return resp.status_code < 400
    except requests.exceptions.RequestException as e:
        if verbose:
            print(f"  ⚠️  Erreur réseau: {e}")
        return False

# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Simulateur de trafic réseau — 10 types")
    parser.add_argument("--url",     default=ENDPOINT_URL, help="URL de l'endpoint destination")
    parser.add_argument("--count",   type=int, default=1,  help="Nombre d'envois par type (défaut: 1)")
    parser.add_argument("--delay",   type=float, default=0.2, help="Délai en secondes entre envois (défaut: 0.2)")
    parser.add_argument("--dry-run", action="store_true", help="Affiche les payloads sans les envoyer")
    parser.add_argument("--type",    choices=list(TRAFFIC_TYPES.keys()), help="Envoyer un seul type de trafic")
    args = parser.parse_args()

    types_to_send = [args.type] if args.type else list(TRAFFIC_TYPES.keys())

    print(f"\n{'═'*55}")
    print(f"  🌐  Network Traffic Simulator")
    print(f"  Endpoint : {args.url}")
    print(f"  Types    : {len(types_to_send)} | Envois/type : {args.count}")
    print(f"{'═'*55}\n")

    total_ok = 0
    total_ko = 0

    for traffic_type in types_to_send:
        print(f"▶  {traffic_type.upper().replace('_', ' ')}")

        for i in range(args.count):
            payload = build_payload(traffic_type)

            if args.dry_run:
                import json
                print(f"  [DRY-RUN] {json.dumps(payload, indent=2)}")
                total_ok += 1
            else:
                ok = send_payload(args.url, payload)
                if ok:
                    total_ok += 1
                else:
                    total_ko += 1

            if i < args.count - 1:
                time.sleep(args.delay)

        time.sleep(args.delay)

    print(f"\n{'─'*55}")
    print(f"  Résultat : {total_ok} succès / {total_ko} échecs")
    print(f"{'─'*55}\n")


if __name__ == "__main__":
    main()
