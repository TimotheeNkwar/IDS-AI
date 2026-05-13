from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from schemas.schemas import AnalysisResult, LogEvent

socket_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []  # ✅ pas besoin de List

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@socket_router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def _broadcast_dashboard_update(result: AnalysisResult, event: LogEvent) -> None:
    payload = {
        "alert": {
            # ── Classification details ──────────────────────
            "src_ip": result.src_ip,
            "dst_ip": result.dst_ip,
            "classification": result.classification,
            "severity": result.severity,
            "attack_type": result.attack_type or result.llm_attack_type,
            "confidence": result.final_confidence,
            "explanation": result.explanation,
            "recommended_action": result.recommended_action,
            "needs_review": result.needs_manual_review,
            # ── Add ML/LLM details for drill-down ───────────────
            "ml_label": result.ml_label,  # "injection"
            "ml_confidence": result.ml_confidence,  # 0.8
            "ml_model": result.ml_model,  # "XGBoost"
            "llm_severity": result.llm_severity,  # "critical"
            "llm_confidence": result.llm_confidence,  # 0.9
            "risk_signals": result.risk_signals,  # liste complète
            "top_features": result.top_features,  # bar chart
            "evidence": result.evidence,  # payload SQL
            "knowledge_matches": result.knowledge_matches,
            "protocol": result.protocol,
            "service": result.service,
        }
        if result.is_anomaly
        else None,
    }
    await manager.broadcast(payload)
