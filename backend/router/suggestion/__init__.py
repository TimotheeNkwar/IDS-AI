from collections import defaultdict

from fastapi import APIRouter, Query
from database import alerts as alert_repo

suggestions_router = APIRouter()


# ──────────────────────────────SUGGESTIONS───────────────────────────────────
@suggestions_router.get("/suggestions")
async def get_suggestions(hours: int = Query(ge=1, le=720)) -> dict:
    if not alert_repo.is_available():
        return {"suggestions": []}

    alerts = await alert_repo.list_alerts_filtered(
        limit=200, status="open", hours=hours
    )

    # Grouper par type + source_ip
    groups: dict = defaultdict(list)
    for alert in alerts:
        key = (alert.get("type"), alert.get("source_ip"))
        groups[key].append(alert)

    suggestions = []
    for (attack_type, source_ip), group in groups.items():
        first = group[0]  # prend le plus récent
        count = len(group)

        suggestions.append(
            {
                "id": first.get("id"),
                "type": attack_type,
                "priority": first.get("severity"),
                "title": f"{attack_type} — {source_ip}",
                "description": first.get("explanation") or first.get("message"),
                "recommended_action": first.get("recommended_action"),
                "evidence": first.get("evidence", []),
                "knowledge_matches": first.get("knowledge_matches", []),
                "source_ip": source_ip,
                "timestamp": first.get("timestamp"),
                "needs_manual_review": first.get("needs_manual_review"),
                "count": count,  #  nombre d'occurrences
            }
        )

    return {"suggestions": suggestions}
