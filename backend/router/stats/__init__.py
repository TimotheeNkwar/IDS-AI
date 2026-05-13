from database import traffic as traffic_repo, alerts as alert_repo
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from bson import json_util
import json

# ── Stats ──────────────────────────────────────────────────────────────────────

stats_router = APIRouter()
@stats_router.get("/stats")
async def get_stats(hours: int = Query(default=24, ge=1, le=720)) -> JSONResponse:
    data = {
        "attacks_by_type":     await alert_repo.count_by_attack_type(hours=hours),
        "attacks_by_severity": await alert_repo.count_by_severity(hours=hours),
        "attacks_by_status":   await alert_repo.count_by_status(),
        "alerts_over_time":    await alert_repo.alerts_over_time(hours=hours),
        "top_attacker_ips":    await alert_repo.top_source_ips(limit=10),
        "traffic_by_protocol": await traffic_repo.count_by_protocol(),
        "traffic_by_service":  await traffic_repo.count_by_service(),
        "traffic_over_time":   await traffic_repo.traffic_over_time(hours=hours),
        "top_talker_ips":      await traffic_repo.top_talkers(limit=10),
    }
    return JSONResponse(content=json.loads(json_util.dumps(data))) 


@stats_router.get("/stats/alerts")
async def get_alert_stats(hours: int = Query(default=24, ge=1, le=720)) -> JSONResponse:
    data = {
        "by_type":     await alert_repo.count_by_attack_type(hours=hours),
        "by_severity": await alert_repo.count_by_severity(hours=hours),
        "by_status":   await alert_repo.count_by_status(),
        "over_time":   await alert_repo.alerts_over_time(hours=hours),
        "top_ips":     await alert_repo.top_source_ips(limit=10),
    }
    return JSONResponse(content=json.loads(json_util.dumps(data))) 


@stats_router.get("/stats/traffic")
async def get_traffic_stats(hours: int = Query(default=24, ge=1, le=720)) -> JSONResponse:
    data = {
        "by_protocol": await traffic_repo.count_by_protocol(),
        "by_service":  await traffic_repo.count_by_service(),
        "over_time":   await traffic_repo.traffic_over_time(hours=hours),
        "top_ips":     await traffic_repo.top_talkers(limit=10),
    }
    return JSONResponse(content=json.loads(json_util.dumps(data))) 


@stats_router.get("/stats/traffic/summary")
async def get_traffic_summary(
    hours: int = Query(default=24, ge=1, le=720)
) -> JSONResponse:
    normal    = await traffic_repo.count_by_label(hours=hours)
    anomalies = await traffic_repo.count_suspicious_malicious(hours=hours)

    total_normal = normal[0]["total_normal"] if normal else 0
    data = {
        "period_hours": hours,
        "normal":       total_normal,
        "anomalies":    anomalies,
        "total":        total_normal + sum(a["count"] for a in anomalies),
    }
    return JSONResponse(content=json.loads(json_util.dumps(data)))