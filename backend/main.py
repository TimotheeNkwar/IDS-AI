from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

app = FastAPI(title="IDS-AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)


@app.get("/api/status")
def get_status():
    """Return the current system status."""
    return {"status": "operational", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/alerts")
def get_alerts():
    """Return a list of recent intrusion alerts."""
    # TODO: replace with real database queries and ML inference
    sample_alerts = [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "Port Scan",
            "message": "Suspicious port scan detected from 192.168.1.100",
        }
    ]
    return {"alerts": sample_alerts}
