import re
import urllib.parse
from schemas.schemas import LogEvent, AnalysisResult
import logging

log = logging.getLogger(__name__)

# ── Security helpers ───────────────────────────────────────────────────────────

_PROMPT_INJECTION_PATTERNS: list[str] = [
    r"ignore\s+(previous|above|all)\s+instructions?",
    r"you\s+are\s+now",
    r"act\s+as\s+",
    r"system\s*:",
    r"<\s*/?\s*system\s*>",
    r"forget\s+(everything|all)",
    r"new\s+instructions?\s*:",
    r"disregard\s+(all|previous)",
    r"override\s+(previous|all)",
    r"your\s+new\s+role",
]
_MAX_RAW_LOG_LEN = 2048
def _sanitize_raw_log(raw_log: str | None) -> str:
    if not raw_log:
        return ""
    text = raw_log[:_MAX_RAW_LOG_LEN]
    text = urllib.parse.unquote(text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text


def _contains_prompt_injection(text: str) -> bool:
    return any(
        re.search(pattern, text, re.IGNORECASE)
        for pattern in _PROMPT_INJECTION_PATTERNS
    )


def _prepare_for_llm(raw_log: str | None, build_fallback: str) -> str:
    sanitized = _sanitize_raw_log(raw_log)
    if not sanitized:
        return build_fallback
    if _contains_prompt_injection(sanitized):
        log.warning(
            "Prompt injection attempt detected in raw_log — redacting before LLM call. "
            "Original (truncated): %.120s",
            sanitized,
        )
        return "[RAW LOG REDACTED — prompt injection attempt detected]"
    return sanitized


def _should_force_llm(event: LogEvent, ml_conf: float = 0.0) -> bool:
    is_web    = event.service in {"http", "ssl"} or event.dst_port in {80, 443, 8080, 8443}
    has_body  = event.http_request_body_len > 500
    status_ok = event.http_status_code == 200
    low_conf  = ml_conf < 0.80
    return is_web and has_body and status_ok and low_conf
