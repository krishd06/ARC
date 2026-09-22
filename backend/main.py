from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.data_loader import data_store
from backend.conflict_checker import check_segment_conflicts
from backend.block_recommender import recommend_block_windows
from backend.risk_predictor import risk_predictor

app = FastAPI(
    title="Rail Sentinel API",
    description="Automatic Track Maintenance Block-Planning Decision Support System for Indian Railways (Maharashtra Pilot - Simulated Dataset)",
    version="1.0.0"
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Models -----------------
class ConflictCheckRequest(BaseModel):
    track_id: str = Field(..., example="T001")
    target_date: str = Field(..., example="2026-08-05")
    start_time: str = Field(..., example="07:10")
    end_time: str = Field(..., example="07:40")
    buffer_minutes: int = Field(default=0, ge=0, le=60)

class BlockRecommenderRequest(BaseModel):
    track_id: str = Field(..., example="T003")
    target_date: str = Field(..., example="2026-08-05")
    min_duration_min: int = Field(default=60, ge=30, le=360)
    window_scope: str = Field(default="night", example="night")

class RiskPredictionRequest(BaseModel):
    issue_type: str = Field(..., example="Rail fracture")
    severity: str = Field(..., example="High")
    machine_resource: str = Field(..., example="Welding Crew")
    track_id: str = Field(..., example="T003")
    planned_duration_min: int = Field(..., ge=15, le=480, example=120)
    block_start_time: str = Field(default="02:00", example="02:00")

# ----------------- Endpoints -----------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "system": "Rail Sentinel API",
        "pilot_region": "Maharashtra Central Railway",
        "dataset_mode": "Simulated Demo Dataset",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/stations")
def get_stations():
    return list(data_store.stations.values())

@app.get("/api/corridors")
def get_corridors():
    """Grouped corridor overview for visualization and filtering."""
    corridors: Dict[str, Dict[str, Any]] = {}
    for tid, seg in data_store.segments.items():
        corr = seg["corridor"]
        if corr not in corridors:
            corridors[corr] = {
                "name": corr,
                "segments": [],
                "total_km": 0.0,
                "stations": set(),
                "high_congestion_count": 0,
                "ghat_segments_count": 0
            }
        traffic = data_store.segment_traffic.get(tid, {})
        is_high = traffic.get("congestion_level") == "High"
        is_ghat = seg["terrain"] == "ghat/hilly"
        
        corridors[corr]["segments"].append({**seg, "traffic": traffic})
        corridors[corr]["total_km"] += seg["length_km"]
        corridors[corr]["stations"].add(seg["from_station"])
        corridors[corr]["stations"].add(seg["to_station"])
        if is_high:
            corridors[corr]["high_congestion_count"] += 1
        if is_ghat:
            corridors[corr]["ghat_segments_count"] += 1
            
    result = []
    for cname, cdata in corridors.items():
        result.append({
            "name": cname,
            "segment_count": len(cdata["segments"]),
            "total_km": round(cdata["total_km"], 1),
            "station_count": len(cdata["stations"]),
            "high_congestion_count": cdata["high_congestion_count"],
            "ghat_segments_count": cdata["ghat_segments_count"],
            "segments": cdata["segments"]
        })
    return result

@app.get("/api/segments")
def get_segments():
    """Returns all 23 track segments enriched with station coordinates and traffic summary."""
    enriched = []
    for tid, seg in data_store.segments.items():
        traffic = data_store.segment_traffic.get(tid, {})
        from_stn = data_store.stations.get(seg["from_station"], {})
        to_stn = data_store.stations.get(seg["to_station"], {})
        enriched.append({
            **seg,
            "trains_per_week": traffic.get("trains_per_week", 0),
            "congestion_level": traffic.get("congestion_level", "Medium"),
            "from_coords": [from_stn.get("latitude"), from_stn.get("longitude")] if from_stn else None,
            "to_coords": [to_stn.get("latitude"), to_stn.get("longitude")] if to_stn else None,
            "from_station_name": from_stn.get("station_name", seg["from_station"]),
            "to_station_name": to_stn.get("station_name", seg["to_station"])
        })
    return enriched

@app.get("/api/trains")
def get_trains():
    return list(data_store.trains.values())

@app.get("/api/train-routes/{train_number}")
def get_train_route(train_number: str):
    routes = data_store.train_routes.get(train_number)
    if not routes:
        raise HTTPException(status_code=404, detail="Train not found")
    return routes

@app.post("/api/conflict-check")
def conflict_check(req: ConflictCheckRequest):
    result = check_segment_conflicts(
        track_id=req.track_id,
        target_date_str=req.target_date,
        start_time_str=req.start_time,
        end_time_str=req.end_time,
        buffer_minutes=req.buffer_minutes
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/block-recommendations")
def block_recommendations(req: BlockRecommenderRequest):
    result = recommend_block_windows(
        track_id=req.track_id,
        target_date_str=req.target_date,
        min_duration_min=req.min_duration_min,
        window_scope=req.window_scope
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.get("/api/maintenance-logs")
def get_maintenance_logs(
    corridor: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    issue_type: Optional[str] = None,
    track_id: Optional[str] = None
):
    """Returns filtered maintenance logs and comprehensive aggregate KPIs."""
    all_logs = data_store.maintenance_logs
    filtered = []

    for l in all_logs:
        if corridor and corridor.lower() not in l["corridor"].lower():
            continue
        if severity and severity.lower() != l["severity"].lower():
            continue
        if status and status.lower() != l["status"].lower():
            continue
        if issue_type and issue_type.lower() != l["issue_type"].lower():
            continue
        if track_id and track_id.lower() != l["track_id"].lower():
            continue
        filtered.append(l)

    # Compute KPIs
    total_count = len(filtered)
    status_counts = {"Completed": 0, "Planned": 0, "Overrun": 0, "Cancelled-Rescheduled": 0}
    severity_counts = {"High": 0, "Medium": 0, "Low": 0}
    total_planned_min = 0
    total_actual_min = 0
    trains_affected_sum = 0
    overruns_count = 0

    for l in filtered:
        st = l["status"]
        if st in status_counts:
            status_counts[st] += 1
        sev = l["severity"]
        if sev in severity_counts:
            severity_counts[sev] += 1
        total_planned_min += l["planned_duration_min"]
        if l["actual_duration_min"] > 0:
            total_actual_min += l["actual_duration_min"]
        trains_affected_sum += l["trains_affected"]
        if st == "Overrun":
            overruns_count += 1

    completed_or_overrun = status_counts["Completed"] + status_counts["Overrun"]
    on_time_rate = round((status_counts["Completed"] / max(1, completed_or_overrun)) * 100, 1)
    overrun_rate = round((overruns_count / max(1, total_count)) * 100, 1)

    return {
        "kpis": {
            "total_blocks": total_count,
            "completed_count": status_counts["Completed"],
            "planned_count": status_counts["Planned"],
            "overrun_count": status_counts["Overrun"],
            "cancelled_count": status_counts["Cancelled-Rescheduled"],
            "on_time_rate_pct": on_time_rate,
            "overrun_rate_pct": overrun_rate,
            "total_trains_affected": trains_affected_sum,
            "total_planned_hours": round(total_planned_min / 60, 1),
            "total_actual_hours": round(total_actual_min / 60, 1)
        },
        "severity_breakdown": severity_counts,
        "status_breakdown": status_counts,
        "logs": filtered
    }

@app.post("/api/predict-overrun")
def predict_overrun(req: RiskPredictionRequest):
    return risk_predictor.predict(
        issue_type=req.issue_type,
        severity=req.severity,
        machine_resource=req.machine_resource,
        track_id=req.track_id,
        planned_duration_min=req.planned_duration_min,
        block_start_time=req.block_start_time
    )

@app.get("/api/meta-options")
def get_meta_options():
    """Metadata helper for UI dropdown filters and selectors."""
    issue_types = sorted(list(set(l["issue_type"] for l in data_store.maintenance_logs)))
    severities = ["Low", "Medium", "High"]
    statuses = ["Planned", "Completed", "Overrun", "Cancelled-Rescheduled"]
    resources = sorted(list(set(l["machine_resource"] for l in data_store.maintenance_logs)))
    corridors = sorted(list(set(s["corridor"] for s in data_store.segments.values())))
    
    return {
        "issue_types": issue_types,
        "severities": severities,
        "statuses": statuses,
        "machine_resources": resources,
        "corridors": corridors
    }
