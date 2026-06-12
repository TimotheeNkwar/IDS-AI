"""
abuseipdb.py
------------
Module d'intégration AbuseIPDB pour IDS-AI.
Enrichit chaque IP avec un score d'abus avant l'analyse ML/LLM.

Dépendances :
    pip install httpx

Usage :
    from abuseipdb import AbuseIPDB, AbuseResult

    checker = AbuseIPDB(api_key="TA_CLE_API")
    result  = await checker.check("37.120.137.214")
    print(result.abuse_score)  # 14
"""

import time
import logging
import httpx
from dataclasses import dataclass, field
from typing import Optional

log = logging.getLogger("abuseipdb")

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
ABUSEIPDB_API_URL = "https://api.abuseipdb.com/api/v2/check"
CACHE_TTL = 3600  # 1h en secondes
MAX_AGE_DAYS = 90  # historique des reports
REQUEST_TIMEOUT = 5  # secondes

# Seuils de décision
THRESHOLD_FORCE_LLM = 30  # score > 30% → force analyse LLM
THRESHOLD_MALICIOUS = 80  # score > 80% → malicious direct, skip ML

# IPs privées/locales → jamais vérifiées
PRIVATE_PREFIXES = (
    "127.",
    "10.",
    "192.168.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
    "::1",
    "fe80:",
)


# ---------------------------------------------------------------------------
# DATACLASS RÉSULTAT
# ---------------------------------------------------------------------------
@dataclass
class AbuseResult:
    ip: str
    abuse_score: int = 0  # 0-100
    total_reports: int = 0
    usage_type: str = "Unknown"
    isp: str = "Unknown"
    country: str = "XX"
    is_tor: bool = False
    is_whitelisted: bool = False
    from_cache: bool = False
    api_available: bool = True

    @property
    def is_malicious(self) -> bool:
        return self.abuse_score >= THRESHOLD_MALICIOUS

    @property
    def should_force_llm(self) -> bool:
        return self.abuse_score >= THRESHOLD_FORCE_LLM

    @property
    def risk_label(self) -> str:
        if self.abuse_score >= 80:
            return "Malicious"
        if self.abuse_score >= 50:
            return "Suspicious"
        if self.abuse_score >= 30:
            return "Low Risk"
        return "Clean"

    def to_dict(self) -> dict:
        return {
            "abuse_score": self.abuse_score,
            "total_reports": self.total_reports,
            "usage_type": self.usage_type,
            "isp": self.isp,
            "country": self.country,
            "is_tor": self.is_tor,
            "risk_label": self.risk_label,
        }


# ---------------------------------------------------------------------------
# CACHE
# ---------------------------------------------------------------------------
@dataclass
class _CacheEntry:
    result: AbuseResult
    cached_at: float = field(default_factory=time.time)

    def is_expired(self) -> bool:
        return time.time() - self.cached_at > CACHE_TTL


class _Cache:
    def __init__(self):
        self._store: dict[str, _CacheEntry] = {}

    def get(self, ip: str) -> Optional[AbuseResult]:
        entry = self._store.get(ip)
        if entry and not entry.is_expired():
            result = entry.result
            result.from_cache = True
            return result
        return None

    def set(self, ip: str, result: AbuseResult):
        self._store[ip] = _CacheEntry(result=result)

    def size(self) -> int:
        return len(self._store)

    def clear_expired(self):
        expired = [k for k, v in self._store.items() if v.is_expired()]
        for k in expired:
            del self._store[k]


# ---------------------------------------------------------------------------
# CLIENT PRINCIPAL
# ---------------------------------------------------------------------------
class AbuseIPDB:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("AbuseIPDB API key is required")
        self._api_key = api_key
        self._cache = _Cache()
        self._checks_today = 0

    @staticmethod
    def _is_private(ip: str) -> bool:
        return ip.startswith(PRIVATE_PREFIXES)

    async def check(self, ip: str) -> AbuseResult:
        """
        Vérifie une IP contre AbuseIPDB.
        Retourne un AbuseResult avec score, ISP, pays, etc.
        Les IPs privées et les erreurs retournent un résultat clean.
        """
        # IPs privées → skip
        if self._is_private(ip):
            return AbuseResult(ip=ip, usage_type="Private", isp="Local", country="--")

        # Cache hit
        cached = self._cache.get(ip)
        if cached:
            log.debug(f"[cache] {ip} → score={cached.abuse_score}%")
            return cached

        # API call
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    ABUSEIPDB_API_URL,
                    headers={
                        "Key": self._api_key,
                        "Accept": "application/json",
                    },
                    params={
                        "ipAddress": ip,
                        "maxAgeInDays": MAX_AGE_DAYS,
                        "verbose": "",
                    },
                    timeout=REQUEST_TIMEOUT,
                )
                self._checks_today += 1

                if r.status_code == 429:
                    log.warning("AbuseIPDB rate limit atteint (1000/jour)")
                    return AbuseResult(ip=ip, api_available=False)

                if r.status_code != 200:
                    log.warning(f"AbuseIPDB HTTP {r.status_code} pour {ip}")
                    return AbuseResult(ip=ip, api_available=False)

                data = r.json().get("data", {})
                result = AbuseResult(
                    ip=ip,
                    abuse_score=data.get("abuseConfidenceScore", 0),
                    total_reports=data.get("totalReports", 0),
                    usage_type=data.get("usageType") or "Unknown",
                    isp=data.get("isp") or "Unknown",
                    country=data.get("countryCode") or "XX",
                    is_tor=data.get("isTor", False),
                    is_whitelisted=data.get("isWhitelisted", False),
                    api_available=True,
                )

                self._cache.set(ip, result)

                log.info(
                    f"[AbuseIPDB] {ip} → {result.risk_label} "
                    f"({result.abuse_score}%) | {result.isp} ({result.country}) "
                    f"| reports={result.total_reports}"
                )
                return result

        except httpx.TimeoutException:
            log.warning(f"AbuseIPDB timeout pour {ip}")
            return AbuseResult(ip=ip, api_available=False)
        except Exception as e:
            log.error(f"AbuseIPDB erreur pour {ip}: {e}")
            return AbuseResult(ip=ip, api_available=False)

    def stats(self) -> dict:
        return {
            "checks_today": self._checks_today,
            "cache_size": self._cache.size(),
        }


async def get_blacklist(self, limit: int = 100, min_score: int = 90) -> list[str]:
    """Retourne les IPs blacklistées avec score >= min_score."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.abuseipdb.com/api/v2/blacklist",
                headers={
                    "Key": self._api_key,
                    "Accept": "application/json",
                },
                params={
                    "limit": limit,
                    "minimumConfidenceScore": min_score,
                },
                timeout=30,
            )
            if r.status_code == 402:
                log.warning("AbuseIPDB blacklist nécessite un plan payant")
                return []
            data = r.json().get("data", [])
            return [entry["ipAddress"] for entry in data]
    except Exception as e:
        log.error(f"AbuseIPDB blacklist erreur: {e}")
        return []
