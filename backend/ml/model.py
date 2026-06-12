# type: ignore
"""
IDS-AI — LLM analysis module
Wraps an Ollama or HuggingFace text-generation model
and exposes analyze_with_llm(log) → dict.

Set LLM_PROVIDER to "ollama" (default) or "huggingface".
Set LLM_MODEL_NAME env var to override the model.
Set OLLAMA_BASE_URL to override the Ollama server URL.
Set LLM_DEVICE to "cpu", "cuda", or "auto" (default: auto).
Set LLM_ENABLED=false to disable LLM entirely (useful for low-RAM environments).
"""

from __future__ import annotations

import logging
import os
import re
import json
from urllib import request, error
from functools import lru_cache
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

_KB_PATH = Path(__file__).parent / "knowledge_base.txt"


@lru_cache(maxsize=1)
def _load_knowledge_base() -> str:
    try:
        return _KB_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        log.warning("knowledge_base.txt not found — skipping")
        return ""


LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
LLM_MODEL_NAME = os.getenv(
    "LLM_MODEL_NAME",
    "phi3" if LLM_PROVIDER == "ollama" else "mistralai/Mistral-7B-Instruct-v0.2",
)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
LLM_DEVICE = os.getenv("LLM_DEVICE", "auto")
LLM_ENABLED = os.getenv("LLM_ENABLED", "true").lower() not in ("false", "0", "no")

_PROMPT_TEMPLATE = """\
[INST] You are an intrusion detection system assistant with expertise in network security analysis.

Use ONLY the provided knowledge-base excerpts to guide your reasoning; do NOT invent facts.

Task: classify the provided network log entry into exactly one of: Normal, Suspicious, Malicious.
Use the ML context as supporting evidence but correct it when the log contradicts the ML signal.

Output requirements (STRICT):
- Reply with a single, valid JSON object and nothing else (no commentary, no markdown).
- JSON MUST match the schema below. Fields not applicable may be null or empty, but keep keys present.

Schema:
{{
    "classification": "Normal|Suspicious|Malicious",
    "attack_type": "string or null",
    "severity": "low|medium|high|critical",
    "confidence": 0.0,                # number between 0.0 and 1.0
    "evidence": ["short evidence items (max 120 chars)"],
    "explanation": "Concise 1-3 sentence justification (use specific log details)",
    "recommended_action": "Short, actionable next step for an analyst",
    "needs_manual_review": true|false
}}

Guidelines:
- Prefer precise observations from the log or ML context for `evidence` (max 5 items).
- Keep `explanation` concise and grounded; mention which fields in the log support your decision.
- If uncertain, choose `"Suspicious"` with `confidence`: 0.5 and an empty `evidence` list.
- Confidence should reflect the model's certainty (0-1); if you output percent values (0-100), convert to 0-1.
- Do NOT hallucinate additional data (IPs, history, or external facts not in the prompt).
- Do NOT output any other text, only the JSON object.

Examples (JSON only):
{{
    "classification": "Normal",
    "attack_type": null,
    "severity": "low",
    "confidence": 0.95,
    "evidence": ["expected HTTP status 200", "small packet sizes"],
    "explanation": "Traffic shows normal HTTP responses and low packet sizes consistent with benign browsing.",
    "recommended_action": "No action required.",
    "needs_manual_review": false
}}

{{
    "classification": "Malicious",
    "attack_type": "xss",
    "severity": "high",
    "confidence": 0.88,
    "evidence": ["http_request_body contains '<script>'", "dst_port=80 and suspicious payload"],
    "explanation": "Request body contains script tags and payload patterns indicative of XSS, correlated with abnormal feature values.",
    "recommended_action": "Block source IP and investigate web application logs.",
    "needs_manual_review": true
}}

ML context:
{ml_context}

Log (truncate to relevant fields if long):
{log}
[/INST]"""

_ATTACK_KEYWORDS = {
    "backdoor": {"backdoor", "rat", "remote access"},
    "backdoor_ports": {4444, 1337, 31337},  # séparé, type int
    "ddos": {"ddos", "flood", "amplification", "syn flood"},
    "dos": {"denial of service", "slowloris"},
    "scan": {"scanning", "reconnaissance", "nmap", "s0", "rej"},
    "injection": {"sqli", "xss", "<script>", "union select", "cmd=", "../"},
    "bruteforce": {"brute force", "credential stuffing", "ssh login"},
    "malware": {"malware", "payload", "obfuscated"},
}
# _ATTACK_KEYWORDS = {
#     "backdoor": {"backdoor", "rat", "remote", "4444", "1337", "31337", "5555", "6666", "8888", "9999", "12345"},
#     "ddos": {"ddos", "distributed", "flood", "amplification", "udp", "syn", "volumetric"},
#     "dos": {"dos", "denial", "flood", "slowloris", "icmp", "resource"},
#     "scan": {"scan", "scanning", "reconnaissance", "nmap", "s0", "rej", "probe"},
#     "injection": {"injection", "sqli", "sql", "command", "shell", "xss", "script", "traversal", "xxe", "ssrf"},
#     "bruteforce": {"brute", "credential", "password", "ssh", "rdp", "ftp", "401", "403"},
#     "malware": {"malware", "obfuscation", "encoded", "payload", "binary"},
# }


@lru_cache(maxsize=1)
def _load_pipeline() -> Any | None:
    if not LLM_ENABLED:
        log.info("LLM disabled via LLM_ENABLED=false")
        return None

    if LLM_PROVIDER == "ollama":
        log.info("Using Ollama LLM: %s (%s)", LLM_MODEL_NAME, OLLAMA_BASE_URL)
        return {"provider": "ollama"}

    if LLM_PROVIDER != "huggingface":
        log.error(
            "Unknown LLM_PROVIDER=%s; expected 'ollama' or 'huggingface'", LLM_PROVIDER
        )
        return None

    try:
        import torch
        from transformers import pipeline

        device_map = LLM_DEVICE if LLM_DEVICE != "auto" else "auto"
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        log.info("Loading LLM: %s  (device=%s)", LLM_MODEL_NAME, device_map)
        pipe = pipeline(
            "text-generation",
            model=LLM_MODEL_NAME,
            dtype=dtype,
            device_map=device_map,
        )
        log.info("LLM loaded successfully")
        return pipe
    except ImportError:
        log.warning("transformers/torch not installed — LLM disabled")
        return None
    except Exception as exc:
        log.error("Failed to load LLM (%s): %s", LLM_MODEL_NAME, exc)
        return None


@lru_cache(maxsize=1)
def _knowledge_sections() -> tuple[dict[str, str], ...]:
    kb = _load_knowledge_base()
    if not kb:
        return ()

    matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s+(.+?)\s*$", kb))
    if not matches:
        return ({"title": "Knowledge Base", "text": kb[:4000]},)

    sections: list[dict[str, str]] = []
    intro = kb[: matches[0].start()].strip()
    if intro:
        sections.append(
            {"title": "Log format and severity reference", "text": intro[:1600]}
        )

    for idx, match in enumerate(matches):
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(kb)
        title = match.group(2).strip()
        sections.append({"title": title, "text": kb[start:end].strip()[:2200]})
    return tuple(sections)


def _tokenize(text: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[a-zA-Z0-9_./:-]+", text)
        if len(token) >= 2
    }


def _select_relevant_knowledge(
    log_entry: str, ml_context: dict[str, Any] | None
) -> tuple[str, list[str]]:
    context_text = json.dumps(ml_context or {}, ensure_ascii=False)
    query_text = f"{log_entry} {context_text}".lower()
    query_tokens = _tokenize(query_text)

    attack_type = str(
        (ml_context or {}).get("attack_type")
        or (ml_context or {}).get("ml_label")
        or ""
    ).lower()
    expanded_tokens = set(query_tokens)
    for name, keywords in _ATTACK_KEYWORDS.items():
        if name in attack_type or any(keyword in query_tokens for keyword in keywords):
            expanded_tokens.update(keywords)

    ranked: list[tuple[int, dict[str, str]]] = []
    for section in _knowledge_sections():
        title = section["title"].lower()
        text = section["text"].lower()
        section_tokens = _tokenize(f"{title} {text}")
        score = len(expanded_tokens & section_tokens)
        if attack_type and attack_type in title:
            score += 20
        ranked.append((score, section))

    selected = [
        section
        for score, section in sorted(ranked, key=lambda item: item[0], reverse=True)
        if score > 0
    ][:4]
    if not selected:
        selected = [section for _, section in ranked[:3]]

    titles = [section["title"] for section in selected]
    text = "\n\n".join(
        f"## {section['title']}\n{section['text']}" for section in selected
    )
    return text[:7000], titles


def _generate_with_ollama(prompt: str) -> str:
    payload = json.dumps(
        {
            "model": LLM_MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0},
        }
    ).encode("utf-8")
    req = request.Request(
        f"{OLLAMA_BASE_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("response", "")
    except error.URLError as exc:
        raise RuntimeError(
            f"Ollama is not reachable at {OLLAMA_BASE_URL}. "
            f"Start it with `ollama serve` and ensure `{LLM_MODEL_NAME}` is pulled."
        ) from exc


def _extract_json_object(text: str) -> dict[str, Any] | None:
    """Best-effort extraction for models that wrap JSON in extra text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


def _parse_llm_output(text: str) -> dict[str, Any]:
    """Extract classification, confidence, and explanation from raw LLM text."""
    # Strip the prompt echo that some models return
    if "[/INST]" in text:
        text = text.split("[/INST]", 1)[-1]

    data = _extract_json_object(text.strip())
    if data:
        classification = str(data.get("classification", "Suspicious")).capitalize()
        if classification not in {"Normal", "Suspicious", "Malicious"}:
            classification = "Suspicious"

        confidence = data.get("confidence", data.get("llm_confidence", 0.5))
        try:
            confidence = float(confidence)
        except (TypeError, ValueError):
            confidence = 0.5
        if confidence > 1:
            confidence = confidence / 100.0

        return {
            "classification": classification,
            "attack_type": data.get("attack_type"),
            "severity": str(data.get("severity", "")).lower() or None,
            "llm_confidence": round(min(max(confidence, 0.0), 1.0), 2),
            "evidence": _normalize_string_list(data.get("evidence", []), limit=5),
            "explanation": str(data.get("explanation", "")).strip()[:500],
            "recommended_action": str(
                data.get(
                    "recommended_action",
                    "Review the event and correlate with recent traffic.",
                )
            ).strip()[:300],
            "needs_manual_review": _normalize_bool(
                data.get("needs_manual_review"), classification != "Normal"
            ),
        }

    classification = "Suspicious"
    confidence = 50.0
    explanation = text.strip()
    recommended_action = "Review the event and correlate with recent traffic."

    m = re.search(
        r"Classification:\s*(Normal|Suspicious|Malicious)", text, re.IGNORECASE
    )
    if m:
        classification = m.group(1).capitalize()

    m = re.search(r"Confidence:\s*(\d+)", text)
    if m:
        confidence = float(m.group(1))

    m = re.search(r"Explanation:\s*(.+)", text, re.DOTALL)
    if m:
        explanation = m.group(1).strip()[:500]

    return {
        "classification": classification,
        "attack_type": None,
        "severity": None,
        "llm_confidence": round(confidence / 100.0, 2),
        "evidence": [],
        "explanation": explanation,
        "recommended_action": recommended_action,
        "needs_manual_review": classification != "Normal",
    }


def _normalize_string_list(value: Any, limit: int = 5) -> list[str]:
    if isinstance(value, str):
        return [value.strip()[:200]] if value.strip() else []
    if not isinstance(value, list):
        return []
    return [str(item).strip()[:200] for item in value if str(item).strip()][:limit]


def _normalize_bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "1"}:
            return True
        if normalized in {"false", "no", "0"}:
            return False
    return default


def analyze_with_llm(
    log_entry: str, ml_context: dict[str, Any] | None = None
) -> dict[str, Any]:
    """
    Classify a log entry with the LLM.

    Returns:
        {
            "classification": "Normal" | "Suspicious" | "Malicious",
            "llm_confidence": float,   # 0-1
            "explanation": str,
            "recommended_action": str,
            "needs_manual_review": bool,
            "llm_available": bool,
        }
    """
    pipe = _load_pipeline()

    if pipe is None:
        # Graceful fallback when LLM is not available
        return {
            "classification": "Suspicious",
            "attack_type": (ml_context or {}).get("attack_type"),
            "severity": "medium",
            "llm_confidence": 0.5,
            "evidence": _normalize_string_list(
                [
                    signal.get("evidence", "")
                    for signal in (ml_context or {}).get("risk_signals", [])
                ]
            ),
            "knowledge_matches": [],
            "explanation": (
                "LLM analysis unavailable. The ML model flagged this traffic as anomalous. "
                "Manual review is recommended."
            ),
            "recommended_action": "Review the event manually and correlate with source IP history.",
            "needs_manual_review": True,
            "llm_available": False,
        }

    kb, knowledge_matches = _select_relevant_knowledge(log_entry, ml_context)
    prompt = _PROMPT_TEMPLATE.format(
        knowledge_base=kb,
        ml_context=json.dumps(ml_context or {}, ensure_ascii=False),
        log=log_entry[:1024],
    )

    try:
        if LLM_PROVIDER == "ollama":
            generated = _generate_with_ollama(prompt)
        else:
            outputs = pipe(prompt, max_new_tokens=256, do_sample=False)
            generated = outputs[0]["generated_text"]
        result = _parse_llm_output(generated)
        result["knowledge_matches"] = knowledge_matches
        result["llm_available"] = True
        return result
    except Exception as exc:
        log.error("LLM inference error: %s", exc)
        return {
            "classification": "Suspicious",
            "attack_type": (ml_context or {}).get("attack_type"),
            "severity": "medium",
            "llm_confidence": 0.5,
            "evidence": _normalize_string_list(
                [
                    signal.get("evidence", "")
                    for signal in (ml_context or {}).get("risk_signals", [])
                ]
            ),
            "knowledge_matches": (
                knowledge_matches if "knowledge_matches" in locals() else []
            ),
            "explanation": f"LLM inference failed: {exc}. Manual review recommended.",
            "recommended_action": "Review the event manually and check that the LLM service is healthy.",
            "needs_manual_review": True,
            "llm_available": False,
        }
