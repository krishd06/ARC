from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.data_loader import data_store, get_department_for_resource
from backend.conflict_checker import check_segment_conflicts
from backend.block_recommender import recommend_block_windows
from backend.risk_predictor import risk_predictor
from backend.plan_aggregator import (
    enrich_logs_with_coordination,
    get_weekly_corridor_plan,
    get_monthly_corridor_rollup,
    check_multi_dept_coordination_for_slot
)

app = FastAPI(
    title="ARC API (Adaptive Railway Coordination)",
    description="Adaptive Railway Coordination - AI-Powered Track Maintenance Block Planning System for Indian Railways (Maharashtra Pilot)",
    version="2.0.0"
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

class CoordinationCheckRequest(BaseModel):
    track_id: str = Field(..., example="T003")
    target_date: str = Field(..., example="2026-08-05")
    start_time: str = Field(..., example="02:00")
    end_time: str = Field(..., example="04:00")
    machine_resource: Optional[str] = Field(default="Welding Crew")
    department: Optional[str] = Field(default=None)
    exclude_event_id: Optional[str] = Field(default=None)

# ----------------- Endpoints -----------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "system": "ARC API v2.0 (Adaptive Railway Coordination)",
        "pilot_region": "Maharashtra Central Railway",
        "dataset_mode": "Simulated Demo Dataset",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/data-sources")
def get_data_sources():
    """
    Explicitly labels which file simulates which real Indian Railways enterprise system.
    Per section 1 of design specification.
    """
    return {
        "title": "ARC Simulated Enterprise Systems Integration Map",
        "description": "Cross-reference mapping demonstrating how local simulated files mirror real-world Indian Railways IT & Operations architectures.",
        "sources": [
            {
                "file": "trains.csv & train_routes.csv",
                "real_system": "COA / FOIS",
                "system_name": "Control Office Application & Freight Operating Information System",
                "domain": "Train Operations & Section Dispatching",
                "simulated_data": "Scheduled passenger, express & EMU train movements, stop sequences, arrival/departure timings, day-of-run rules.",
                "badge_color": "emerald",
                "status": "Active Feed"
            },
            {
                "file": "track_segments.csv & stations.csv",
                "real_system": "TMS / RBS",
                "system_name": "Track Management System & Rates Branch System (GIS Topology)",
                "domain": "Civil Infrastructure & Physical Track Network",
                "simulated_data": "23 double-line track sections, chainage (km), electrification, speed restrictions, ghat gradient topography (1:37).",
                "badge_color": "cyan",
                "status": "Master GIS"
            },
            {
                "file": "maintenance_log.csv",
                "real_system": "TMS / e-Drishti",
                "system_name": "Track Maintenance Logbook & Railway Board Monitoring Portal",
                "domain": "Asset Maintenance & Block Execution",
                "simulated_data": "82 historical & scheduled maintenance events across 30 days, machine resources, issue severities, actual vs planned durations, overruns.",
                "badge_color": "amber",
                "status": "Telemetry Log"
            },
            {
                "file": "segment_traffic_summary.csv",
                "real_system": "COA Analytical Engine",
                "system_name": "Section Capacity Utilization & Congestion Analyzer",
                "domain": "Corridor Capacity & Headway Planning",
                "simulated_data": "Derived weekly traffic density (trains/week), section occupancy pressure, congestion index classification (Low/Medium/High).",
                "badge_color": "purple",
                "status": "Computed Metrics"
            },
            {
                "file": "goods_train_forecast.csv",
                "real_system": "FOIS / Control Office Forecast",
                "system_name": "Freight Demand Forecasting & Rake Movement Pipeline",
                "domain": "Forward Freight Loading & Capacity Allocation",
                "simulated_data": "Weekly projected freight train paths, dominant commodity mixes (Coal, Containers, POL, Steel, Autos, Foodgrains), forecast confidence.",
                "badge_color": "rose",
                "status": "Forecast Stream"
            }
        ]
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
            "to_station_name": to_stn.get("station_name", seg["to_station"]),
            "adjacent_segments": data_store.adjacent_segments.get(tid, [])
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
    track_id: Optional[str] = None,
    department: Optional[str] = None
):
    """Returns filtered maintenance logs enriched with department tags and multi-department coordination flags."""
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
        if department and department.lower() != l.get("department", "").lower():
            continue
        filtered.append(l)

    enriched_logs = enrich_logs_with_coordination(filtered)

    # Compute KPIs
    total_count = len(enriched_logs)
    status_counts = {"Completed": 0, "Planned": 0, "Overrun": 0, "Cancelled-Rescheduled": 0}
    severity_counts = {"High": 0, "Medium": 0, "Low": 0}
    dept_counts = {"Civil Engineering": 0, "Electrical (TRD)": 0, "Signal & Telecom (S&T)": 0, "Mechanical (C&W)": 0}
    total_planned_min = 0
    total_actual_min = 0
    trains_affected_sum = 0
    overruns_count = 0
    coordination_count = 0

    for l in enriched_logs:
        st = l["status"]
        if st in status_counts:
            status_counts[st] += 1
        sev = l["severity"]
        if sev in severity_counts:
            severity_counts[sev] += 1
        dept = l.get("department", "Civil Engineering")
        if dept in dept_counts:
            dept_counts[dept] += 1
        else:
            dept_counts[dept] = 1

        total_planned_min += l["planned_duration_min"]
        if l["actual_duration_min"] > 0:
            total_actual_min += l["actual_duration_min"]
        trains_affected_sum += l["trains_affected"]
        if st == "Overrun":
            overruns_count += 1
        if l.get("coordination_needed"):
            coordination_count += 1

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
            "coordination_count": coordination_count,
            "on_time_rate_pct": on_time_rate,
            "overrun_rate_pct": overrun_rate,
            "total_trains_affected": trains_affected_sum,
            "total_planned_hours": round(total_planned_min / 60, 1),
            "total_actual_hours": round(total_actual_min / 60, 1)
        },
        "severity_breakdown": severity_counts,
        "status_breakdown": status_counts,
        "department_breakdown": dept_counts,
        "logs": enriched_logs
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

@app.get("/api/prioritized-maintenance")
def get_prioritized_maintenance(limit: int = 40):
    """
    Computes Priority Score (0-100) per maintenance item based on:
    - Severity Weight (0-35)
    - Urgency / Days overdue vs Target SLA Window (0-30)
    - Segment Congestion Pressure (0-20)
    - Scheduled Trains Affected / Line Density (0-15)
    Ranked descending for 'Top priority maintenance this week'.
    """
    items = risk_predictor.get_prioritized_maintenance_list(limit=limit)
    return {
        "title": "Top Priority Maintenance Queue",
        "description": "Multi-factorial ranking prioritizing safety-critical track possession based on defect severity, SLA deadlines, corridor congestion, and traffic impact.",
        "total_items": len(items),
        "items": items
    }

@app.get("/api/weekly-plan")
def get_weekly_plan(start_date: str = "2026-08-01"):
    """Returns 7-day corridor maintenance plan with multi-department coordination tags and top unscheduled priority items."""
    return get_weekly_corridor_plan(start_date_str=start_date)

@app.get("/api/monthly-plan")
def get_monthly_plan():
    """Returns 4-5 week rollup by corridor cross-referencing goods_train_forecast.csv for heavy freight pipeline alerts."""
    return get_monthly_corridor_rollup()

@app.post("/api/check-coordination")
def check_coordination(req: CoordinationCheckRequest):
    dept = req.department or get_department_for_resource(req.machine_resource or "")
    coord = check_multi_dept_coordination_for_slot(
        track_id=req.track_id,
        target_date=req.target_date,
        start_time=req.start_time,
        end_time=req.end_time,
        department=dept,
        exclude_event_id=req.exclude_event_id
    )
    return {
        "coordination_needed": coord is not None,
        "coordination_info": coord
    }

from backend.ai_optimizer import ai_block_optimizer

class AIOptimizeRequest(BaseModel):
    start_date: str = Field(default="2026-08-01", example="2026-08-01")
    horizon_days: int = Field(default=7, ge=1, le=30, example=7)
    corridor_filter: Optional[str] = Field(default=None, example="all")
    minimize_train_delays: float = Field(default=0.35, ge=0.0, le=1.0)
    maximize_throughput: float = Field(default=0.30, ge=0.0, le=1.0)
    maximize_joint_blocks: float = Field(default=0.25, ge=0.0, le=1.0)
    nocturnal_preference: float = Field(default=0.10, ge=0.0, le=1.0)

class ApplyScheduleRequest(BaseModel):
    blocks: List[Dict[str, Any]]

@app.post("/api/ai-optimize-schedule")
def optimize_schedule(req: AIOptimizeRequest):
    """
    Executes AI Constraint-Satisfaction Schedule Optimizer across corridors.
    Packs open defect backlog into zero-conflict master block schedule with multi-department joint blocks.
    """
    weights = {
        "minimize_train_delays": req.minimize_train_delays,
        "maximize_throughput": req.maximize_throughput,
        "maximize_joint_blocks": req.maximize_joint_blocks,
        "nocturnal_preference": req.nocturnal_preference
    }
    result = ai_block_optimizer.run_optimization(
        start_date_str=req.start_date,
        horizon_days=req.horizon_days,
        corridor_filter=req.corridor_filter,
        weights=weights
    )
    return result

@app.post("/api/apply-optimized-schedule")
def apply_optimized_schedule(req: ApplyScheduleRequest):
    """
    Applies the AI-generated schedule into the active maintenance logs database.
    """
    applied_count = 0
    for block in req.blocks:
        ev_id = block.get("event_id") or f"OPT-{len(data_store.maintenance_logs)+1:03d}"
        # Check if already exists, otherwise append
        existing = next((l for l in data_store.maintenance_logs if l["event_id"] == ev_id), None)
        if existing:
            existing["date"] = block["date"]
            existing["block_start"] = block["block_start"]
            existing["block_end"] = block["block_end"]
            existing["status"] = "Planned"
            existing["planned_duration_min"] = block["planned_duration_min"]
        else:
            data_store.maintenance_logs.append({
                "event_id": ev_id,
                "date": block["date"],
                "track_id": block["track_id"],
                "corridor": block["corridor"],
                "section": block.get("section") or block.get("section_name", ""),
                "track_position_km": float(block.get("track_position_km", 10.0)),
                "issue_type": block["issue_type"],
                "severity": block["severity"],
                "machine_resource": block["machine_resource"],
                "department": block.get("department") or get_department_for_resource(block["machine_resource"]),
                "block_start": block["block_start"],
                "planned_duration_min": block["planned_duration_min"],
                "actual_duration_min": 0,
                "block_end": block["block_end"],
                "status": "Planned",
                "trains_affected": 0
            })
        applied_count += 1

    return {
        "status": "SUCCESS",
        "message": f"Successfully integrated {applied_count} AI-optimized maintenance blocks into the active Master Calendar.",
        "applied_count": applied_count
    }

class CreateCustomBlockReq(BaseModel):
    track_id: str = Field(..., example="T003")
    date: str = Field(..., example="2026-08-05")
    start_time: str = Field(..., example="01:30")
    end_time: str = Field(..., example="03:30")
    issue_type: str = Field(..., example="Track geometry defect")
    severity: str = Field(default="Medium")
    machine_resource: str = Field(default="CSM (Continuous Tamping Machine)")
    department: Optional[str] = Field(default=None)
    track_position_km: float = Field(default=12.5)
    planned_duration_min: Optional[int] = None

class RemoveBlockReq(BaseModel):
    event_id: str

@app.post("/api/create-custom-block")
def create_custom_block(req: CreateCustomBlockReq):
    seg = data_store.segments.get(req.track_id, {})
    sh, sm = map(int, req.start_time.split(":"))
    eh, em = map(int, req.end_time.split(":"))
    dur = (eh * 60 + em) - (sh * 60 + sm)
    if dur <= 0:
        dur += 1440
    
    dept = req.department or get_department_for_resource(req.machine_resource)
    ev_id = f"MAN-{len(data_store.maintenance_logs)+1:03d}"
    new_block = {
        "event_id": ev_id,
        "date": req.date,
        "track_id": req.track_id,
        "corridor": seg.get("corridor", "Central Railway Trunk"),
        "section": f"{seg.get('from_station', '')}-{seg.get('to_station', '')}",
        "track_position_km": float(req.track_position_km),
        "issue_type": req.issue_type,
        "severity": req.severity,
        "machine_resource": req.machine_resource,
        "department": dept,
        "block_start": f"{req.date} {req.start_time}",
        "block_end": f"{req.date} {req.end_time}",
        "planned_duration_min": req.planned_duration_min or dur,
        "actual_duration_min": 0,
        "status": "Planned",
        "trains_affected": 0
    }
    data_store.maintenance_logs.append(new_block)
    return {
        "status": "SUCCESS",
        "message": f"Successfully created block {ev_id} for {req.track_id}.",
        "block": new_block
    }

@app.post("/api/remove-block")
def remove_single_block(req: RemoveBlockReq):
    initial_len = len(data_store.maintenance_logs)
    data_store.maintenance_logs = [l for l in data_store.maintenance_logs if l.get("event_id") != req.event_id]
    removed = initial_len - len(data_store.maintenance_logs)
    return {
        "status": "SUCCESS",
        "message": f"Removed block {req.event_id}.",
        "removed_count": removed
    }

@app.post("/api/clear-all-blocks")
def clear_all_blocks():
    # Retain historical completed logs, remove all planned / active blocks
    initial_len = len(data_store.maintenance_logs)
    data_store.maintenance_logs = [l for l in data_store.maintenance_logs if l.get("status") == "Completed"]
    cleared = initial_len - len(data_store.maintenance_logs)
    return {
        "status": "SUCCESS",
        "message": f"Cleared {cleared} active/planned maintenance blocks from the schedule.",
        "cleared_count": cleared
    }

@app.get("/api/meta-options")
def get_meta_options():
    """Metadata helper for UI dropdown filters and selectors."""
    issue_types = sorted(list(set(l["issue_type"] for l in data_store.maintenance_logs)))
    severities = ["Low", "Medium", "High"]
    statuses = ["Planned", "Completed", "Overrun", "Cancelled-Rescheduled"]
    resources = sorted(list(set(l["machine_resource"] for l in data_store.maintenance_logs)))
    corridors = sorted(list(set(s["corridor"] for s in data_store.segments.values())))
    departments = ["Civil Engineering", "Electrical (TRD)", "Signal & Telecom (S&T)", "Mechanical (C&W)"]
    
    return {
        "issue_types": issue_types,
        "severities": severities,
        "statuses": statuses,
        "machine_resources": resources,
        "corridors": corridors,
        "departments": departments
    }

