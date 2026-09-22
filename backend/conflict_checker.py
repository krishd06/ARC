from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional
from backend.data_loader import data_store

def does_train_run_on_date(days_of_run: str, d: date) -> bool:
    """Checks whether a train runs given its days_of_run and origin date d."""
    wd = d.weekday()  # 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    norm = days_of_run.strip().lower()
    
    if "daily except tue" in norm:
        return wd != 1
    if "daily" in norm:
        return True
    if "mon,wed,fri" in norm:
        return wd in (0, 2, 4)
    
    return True

def check_segment_conflicts(
    track_id: str,
    target_date_str: str,
    start_time_str: str,
    end_time_str: str,
    buffer_minutes: int = 0
) -> Dict[str, Any]:
    """
    Checks for conflicts between a proposed maintenance window and scheduled trains on a track segment.
    """
    segment = data_store.segments.get(track_id)
    if not segment:
        return {"error": f"Invalid track_id: {track_id}"}

    target_d = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    
    start_dt = datetime.strptime(f"{target_date_str} {start_time_str}", "%Y-%m-%d %H:%M")
    end_dt = datetime.strptime(f"{target_date_str} {end_time_str}", "%Y-%m-%d %H:%M")
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)
        
    duration_min = int((end_dt - start_dt).total_seconds() / 60)
    
    legs = data_store.segment_train_legs.get(track_id, [])
    
    conflicts: List[Dict[str, Any]] = []
    all_trains_in_range: List[Dict[str, Any]] = []
    
    # Check origin dates around target_date
    origin_date_candidates = [
        target_d - timedelta(days=2),
        target_d - timedelta(days=1),
        target_d,
        target_d + timedelta(days=1)
    ]
    
    for origin_d in origin_date_candidates:
        for leg in legs:
            tnum = leg["train_number"]
            days_of_run = leg["days_of_run"]
            
            if not does_train_run_on_date(days_of_run, origin_d):
                continue
                
            train_dep_dt = datetime(origin_d.year, origin_d.month, origin_d.day) + timedelta(minutes=leg["dep_cum_mins"])
            train_arr_dt = datetime(origin_d.year, origin_d.month, origin_d.day) + timedelta(minutes=leg["arr_cum_mins"])
            
            # Check if this train event is within 12 hours of the maintenance window
            event_near = (train_arr_dt >= start_dt - timedelta(hours=12)) and (train_dep_dt <= end_dt + timedelta(hours=12))
            
            eff_start = train_dep_dt - timedelta(minutes=buffer_minutes)
            eff_end = train_arr_dt + timedelta(minutes=buffer_minutes)
            
            # Overlap test
            is_overlap = max(start_dt, eff_start) < min(end_dt, eff_end)
            overlap_duration = 0
            if is_overlap:
                overlap_duration = int((min(end_dt, eff_end) - max(start_dt, eff_start)).total_seconds() / 60)
                
            train_record = {
                "train_number": tnum,
                "train_name": leg["train_name"],
                "train_type": leg["train_type"],
                "direction": leg["direction"],
                "from_station": leg["from_station"],
                "to_station": leg["to_station"],
                "origin_station": leg["origin_station"],
                "destination_station": leg["destination_station"],
                "scheduled_entry": train_dep_dt.strftime("%Y-%m-%d %H:%M"),
                "scheduled_exit": train_arr_dt.strftime("%Y-%m-%d %H:%M"),
                "scheduled_entry_time": train_dep_dt.strftime("%H:%M"),
                "scheduled_exit_time": train_arr_dt.strftime("%H:%M"),
                "transit_duration_min": leg["transit_duration_min"],
                "origin_date": origin_d.strftime("%Y-%m-%d"),
                "is_conflict": is_overlap,
                "overlap_minutes": overlap_duration,
                "buffer_breach": is_overlap and (train_arr_dt < start_dt or train_dep_dt > end_dt)
            }
            
            if event_near:
                all_trains_in_range.append(train_record)
                
            if is_overlap:
                conflicts.append(train_record)
                
    # Sort conflicts and range trains chronologically
    conflicts.sort(key=lambda x: x["scheduled_entry"])
    all_trains_in_range.sort(key=lambda x: x["scheduled_entry"])
    
    verdict = "CLEAR" if len(conflicts) == 0 else "CONFLICT DETECTED"
    
    return {
        "track_id": track_id,
        "corridor": segment["corridor"],
        "from_station": segment["from_station"],
        "to_station": segment["to_station"],
        "length_km": segment["length_km"],
        "terrain": segment["terrain"],
        "max_speed_kmph": segment["max_speed_kmph"],
        "target_date": target_date_str,
        "start_time": start_time_str,
        "end_time": end_time_str,
        "start_datetime": start_dt.strftime("%Y-%m-%d %H:%M"),
        "end_datetime": end_dt.strftime("%Y-%m-%d %H:%M"),
        "planned_duration_min": duration_min,
        "buffer_minutes": buffer_minutes,
        "verdict": verdict,
        "conflict_count": len(conflicts),
        "conflicts": conflicts,
        "timeline_context": all_trains_in_range
    }
