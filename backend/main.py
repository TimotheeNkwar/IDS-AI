#type: ignore

import os
import pickle
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import DESCENDING, MongoClient
from pymongo.collection import Collection
from sklearn.ensemble import IsolationForest

app = FastAPI(title="IDS-AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)

FEATURE_KEYS = (
    "duration",
    "src_bytes",
    "dst_bytes",
    "wrong_fragment",
    "urgent",
    "count",
    "srv_count",
)


@lru_cache(maxsize=1)
def _get_events_collection() -> Collection | None:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database_name = os.getenv("MONGODB_DB", "ids_ai")
    collection_name = os.getenv("MONGODB_EVENTS_COLLECTION", "network_events")

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1500, connectTimeoutMS=1500)
        client.admin.command("ping")
        return client[database_name][collection_name]
    except Exception:
        return None


@lru_cache(maxsize=1)
def _get_model() -> IsolationForest | None:
    model_path = os.getenv("IDS_MODEL_PATH", "backend/model.pkl")

    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                loaded_model = pickle.load(f)
            if isinstance(loaded_model, IsolationForest):
                return loaded_model
        except Exception:
            pass

    collection = _get_events_collection()
    if collection is None:
        return None

    training_limit = int(os.getenv("IDS_TRAINING_LIMIT", "2000"))
    cursor = collection.find(
        {"is_attack": False},
        {key: 1 for key in FEATURE_KEYS},
    ).limit(training_limit)

    rows = [
        [float(doc.get(key, 0.0) or 0.0) for key in FEATURE_KEYS]
        for doc in cursor
    ]

    if len(rows) < 50:
        return None

    model = IsolationForest(
        contamination=float(os.getenv("IDS_CONTAMINATION", "0.05")),
        n_estimators=120,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(np.asarray(rows, dtype=np.float32))
    return model


def _to_alert(doc: dict[str, Any], score: float) -> dict[str, str]:
    src_ip = doc.get("src_ip", "unknown")
    proto = doc.get("protocol", "unknown")
    ts = doc.get("timestamp")

    if isinstance(ts, datetime):
        timestamp = ts.astimezone(timezone.utc).isoformat()
    else:
        timestamp = datetime.now(timezone.utc).isoformat()

    return {
        "timestamp": timestamp,
        "type": "Anomaly",
        "message": f"Anomalous {proto} traffic from {src_ip} (score={score:.3f})",
    }


@app.get("/api/status")
def get_status():
    """Return the current system status."""
    return {"status": "operational", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/alerts")
def get_alerts():
    """Return a list of recent intrusion alerts."""
    collection = _get_events_collection()
    if collection is None:
        return {"alerts": []}

    scan_limit = int(os.getenv("IDS_SCAN_LIMIT", "300"))
    alert_limit = int(os.getenv("IDS_ALERT_LIMIT", "25"))

    docs = list(
        collection.find(
            {},
            {
                "timestamp": 1,
                "src_ip": 1,
                "protocol": 1,
                **{key: 1 for key in FEATURE_KEYS},
            },
        )
        .sort("timestamp", DESCENDING)
        .limit(scan_limit)
    )

    if not docs:
        return {"alerts": []}

    model = _get_model()
    if model is None:
        return {"alerts": []}

    features = np.asarray(
        [[float(doc.get(key, 0.0) or 0.0) for key in FEATURE_KEYS] for doc in docs],
        dtype=np.float32,
    )

    predictions = model.predict(features)
    scores = model.decision_function(features)

    alerts = [
        _to_alert(doc, float(score))
        for doc, pred, score in zip(docs, predictions, scores)
        if pred == -1
    ]

    return {"alerts": alerts[:alert_limit]}
