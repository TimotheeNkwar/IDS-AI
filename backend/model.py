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


def _load_knowledge_base() -> str:
    try:
        return _KB_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        log.warning("knowledge_base.txt not found — skipping")
        return ""

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
LLM_MODEL_NAME = os.getenv(
    "LLM_MODEL_NAME",
    "mistral" if LLM_PROVIDER == "ollama" else "mistralai/Mistral-7B-Instruct-v0.2",
)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
LLM_DEVICE = os.getenv("LLM_DEVICE", "auto")
LLM_ENABLED = os.getenv("LLM_ENABLED", "true").lower() not in ("false", "0", "no")

_PROMPT_TEMPLATE = """\
[INST] You are an intrusion detection system.

Use the following knowledge base to guide your analysis:
---
{knowledge_base}
---

Classify the following network log entry into exactly one of:
- Normal
- Suspicious
- Malicious

Then explain your reasoning clearly in 2-3 sentences.
Respond in this exact format:
Classification: <Normal|Suspicious|Malicious>
Confidence: <0-100>%
Explanation: <your reasoning>

Log:
{log}
[/INST]"""


@lru_cache(maxsize=1)
def _load_pipeline() -> Any | None:
    if not LLM_ENABLED:
        log.info("LLM disabled via LLM_ENABLED=false")
        return None

    if LLM_PROVIDER == "ollama":
        log.info("Using Ollama LLM: %s (%s)", LLM_MODEL_NAME, OLLAMA_BASE_URL)
        return {"provider": "ollama"}

    if LLM_PROVIDER != "huggingface":
        log.error("Unknown LLM_PROVIDER=%s; expected 'ollama' or 'huggingface'", LLM_PROVIDER)
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


def _generate_with_ollama(prompt: str) -> str:
    payload = json.dumps({
        "model": LLM_MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0},
    }).encode("utf-8")
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


def _parse_llm_output(text: str) -> dict[str, Any]:
    """Extract classification, confidence, and explanation from raw LLM text."""
    # Strip the prompt echo that some models return
    if "[/INST]" in text:
        text = text.split("[/INST]", 1)[-1]

    classification = "Suspicious"
    confidence = 50.0
    explanation = text.strip()

    m = re.search(r"Classification:\s*(Normal|Suspicious|Malicious)", text, re.IGNORECASE)
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
        "llm_confidence": round(confidence / 100.0, 2),
        "explanation": explanation,
    }


def analyze_with_llm(log_entry: str) -> dict[str, Any]:
    """
    Classify a log entry with the LLM.

    Returns:
        {
            "classification": "Normal" | "Suspicious" | "Malicious",
            "llm_confidence": float,   # 0-1
            "explanation": str,
            "llm_available": bool,
        }
    """
    pipe = _load_pipeline()

    if pipe is None:
        # Graceful fallback when LLM is not available
        return {
            "classification": "Suspicious",
            "llm_confidence": 0.5,
            "explanation": (
                "LLM analysis unavailable. The ML model flagged this traffic as anomalous. "
                "Manual review is recommended."
            ),
            "llm_available": False,
        }

    kb = _load_knowledge_base()
    prompt = _PROMPT_TEMPLATE.format(knowledge_base=kb, log=log_entry[:1024])

    try:
        if LLM_PROVIDER == "ollama":
            generated = _generate_with_ollama(prompt)
        else:
            outputs = pipe(prompt, max_new_tokens=256, do_sample=False)
            generated = outputs[0]["generated_text"]
        result = _parse_llm_output(generated)
        result["llm_available"] = True
        return result
    except Exception as exc:
        log.error("LLM inference error: %s", exc)
        return {
            "classification": "Suspicious",
            "llm_confidence": 0.5,
            "explanation": f"LLM inference failed: {exc}. Manual review recommended.",
            "llm_available": False,
        }
