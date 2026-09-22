from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional
from backend.data_loader import data_store
from backend.conflict_checker import does_train_run_on_date

def recommend_block_windows(
    track_id: str,
    target_date_str: str,
    min_duration_min: int = 60,
    window_scope: str = "night"  # "night" (22:00 to 07:00 next day) or "full_day" (00:00 to 24:00)
) -> Dict[str, Any]:
    """
    Finds safe gaps between scheduled trains on a track segment and recommends optimal maintenance slots.
    """
    segment = data_store.segments.get(track_id)
    if not segment:
        return {"error": f"Invalid track_id: {track_id}"}
        
    traffic = data_store.segment_traffic.get(track_id, {})
    congestion = traffic.get("congestion_level", "Medium")
    is_ghat = segment.get("terrain") == "ghat/hilly"

    target_d = datetime.strptime(target_date_str, "%Y-%m-%d").date()

    if window_scope == "night":
        scope_start = datetime(target_d.year, target_d.month, target_d.day, 22, 0)
        scope_end = scope_start + timedelta(hours=9)  # 22:00 to 07:00 next day
    else:
        scope_start = datetime(target_d.year, target_d.month, target_d.day, 0, 0)
        scope_end = scope_start + timedelta(hours=24)

    legs = data_store.segment_train_legs.get(track_id, [])
    
    # Collect train occurrences in or around this scope
    origin_date_candidates = [
        target_d - timedelta(days=2),
        target_d - timedelta(days=1),
        target_d,
        target_d + timedelta(days=1)
    ]
    
    train_events: List[Dict[str, Any]] = []
    
    for origin_d in origin_date_candidates:
        for leg in legs:
            if not does_train_run_on_date(leg["days_of_run"], origin_d):
                continue
                
            dep_dt = datetime(origin_d.year, origin_d.month, origin_d.day) + timedelta(minutes=leg["dep_cum_mins"])
            arr_dt = datetime(origin_d.year, origin_d.month, origin_d.day) + timedelta(minutes=leg["arr_cum_mins"])
            
            # If train event overlaps with scope window (with 1 hr margin)
            if arr_dt >= scope_start - timedelta(hours=1) and dep_dt <= scope_end + timedelta(hours=1):
                train_events.append({
                    "train_number": leg["train_number"],
                    "train_name": leg["train_name"],
                    "train_type": leg["train_type"],
                    "direction": leg["direction"],
                    "entry_dt": dep_dt,
                    "exit_dt": arr_dt,
                    "entry_str": dep_dt.strftime("%H:%M"),
                    "exit_str": arr_dt.strftime("%H:%M"),
                })
                
    # Sort by entry time
    train_events.sort(key=lambda x: x["entry_dt"])
    
    # Merge overlapping or touching train intervals to find true free gaps
    merged_intervals = []
    for ev in train_events:
        if not merged_intervals:
            merged_intervals.append({"start": ev["entry_dt"], "end": ev["exit_dt"], "trains": [ev]})
        else:
            last = merged_intervals[-1]
            if ev["entry_dt"] <= last["end"]:
                last["end"] = max(last["end"], ev["exit_dt"])
                last["trains"].append(ev)
            else:
                merged_intervals.append({"start": ev["entry_dt"], "end": ev["exit_dt"], "trains": [ev]})

    # Find gaps within scope [scope_start, scope_end]
    gaps: List[Dict[str, Any]] = []
    
    # Boundary before first interval
    curr_time = scope_start
    for mi in merged_intervals:
        if mi["start"] > curr_time:
            gap_start = max(curr_time, scope_start)
            gap_end = min(mi["start"], scope_end)
            if gap_end > gap_start:
                duration = int((gap_end - gap_start).total_seconds() / 60)
                if duration >= min_duration_min:
                    gaps.append({
                        "start_dt": gap_start,
                        "end_dt": gap_end,
                        "duration_min": duration,
                        "preceding_train": None if curr_time == scope_start else "Traffic prior",
                        "following_train": f"{mi['trains'][0]['train_number']} {mi['trains'][0]['train_name']}"
                    })
        curr_time = max(curr_time, mi["end"])
        
    # Boundary after last interval
    if curr_time < scope_end:
        duration = int((scope_end - curr_time).total_seconds() / 60)
        if duration >= min_duration_min:
            gaps.append({
                "start_dt": curr_time,
                "end_dt": scope_end,
                "duration_min": duration,
                "preceding_train": f"{merged_intervals[-1]['trains'][-1]['train_number']} {merged_intervals[-1]['trains'][-1]['train_name']}" if merged_intervals else None,
                "following_train": None
            })

    # Calculate feasibility score (0 - 100) for each gap
    recommendations: List[Dict[str, Any]] = []
    for gap in gaps:
        dur = gap["duration_min"]
        
        # Base score on duration: 60m=50, 120m=75, 180m=90, 240m+=98
        if dur >= 240:
            base_score = 95
        elif dur >= 180:
            base_score = 88
        elif dur >= 120:
            base_score = 78
        elif dur >= 90:
            base_score = 68
        else:
            base_score = 52
            
        # Night bonus (00:00 to 05:00 is prime track block window in IR)
        mid_dt = gap["start_dt"] + timedelta(minutes=dur / 2)
        if 0 <= mid_dt.hour < 5:
            night_bonus = 8
        elif 22 <= mid_dt.hour <= 23:
            night_bonus = 4
        else:
            night_bonus = -5

        # Terrain deduction for ghat section (requires more setup)
        terrain_penalty = 5 if is_ghat else 0
        
        # Congestion penalty
        congestion_penalty = 6 if congestion == "High" else (3 if congestion == "Medium" else 0)
        
        score = max(10, min(100, base_score + night_bonus - terrain_penalty - congestion_penalty))
        
        if score >= 80:
            badge = "Optimal Window"
            badge_color = "emerald"
        elif score >= 65:
            badge = "Good Feasibility"
            badge_color = "amber"
        else:
            badge = "Tight Clearance"
            badge_color = "rose"

        recommendations.append({
            "start_time": gap["start_dt"].strftime("%H:%M"),
            "end_time": gap["end_dt"].strftime("%H:%M"),
            "start_datetime": gap["start_dt"].strftime("%Y-%m-%d %H:%M"),
            "end_datetime": gap["end_dt"].strftime("%Y-%m-%d %H:%M"),
            "duration_min": dur,
            "duration_formatted": f"{dur // 60}h {dur % 60}m" if dur >= 60 else f"{dur}m",
            "feasibility_score": score,
            "feasibility_label": badge,
            "badge_color": badge_color,
            "preceding_train": gap["preceding_train"] or "No immediate train",
            "following_train": gap["following_train"] or "Clear onward track",
            "reasoning": (
                f"{dur} min clear window. "
                f"{'Prime night-maintenance slot with minimal passenger disruption. ' if night_bonus > 0 else 'Daytime window; verify freight bypass. '}"
                f"{'Extra caution recommended for ghat terrain. ' if is_ghat else 'Standard plain alignment.'}"
            )
        })

    # Sort recommendations by feasibility score descending, then duration descending
    recommendations.sort(key=lambda x: (x["feasibility_score"], x["duration_min"]), reverse=True)

    return {
        "track_id": track_id,
        "corridor": segment["corridor"],
        "section_name": f"{segment['from_station']} → {segment['to_station']}",
        "terrain": segment["terrain"],
        "congestion_level": congestion,
        "target_date": target_date_str,
        "window_scope": window_scope,
        "total_trains_scheduled_in_window": len(train_events),
        "total_gaps_found": len(gaps),
        "recommendations": recommendations,
        "train_occupancies": [
            {
                "train_number": t["train_number"],
                "train_name": t["train_name"],
                "type": t["train_type"],
                "entry": t["entry_str"],
                "exit": t["exit_str"],
                "direction": t["direction"]
            }
            for t in train_events
        ]
    }
