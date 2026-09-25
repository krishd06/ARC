import csv
import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def parse_time_to_minutes(time_str: str) -> Optional[int]:
    """Converts HH:MM string to minutes from 00:00."""
    if not time_str or time_str.strip() == "--":
        return None
    parts = time_str.strip().split(":")
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time_str(mins: int) -> str:
    """Converts minutes to HH:MM (mod 1440)."""
    mins = mins % 1440
    h = mins // 60
    m = mins % 60
    return f"{h:02d}:{m:02d}"

RESOURCE_DEPARTMENT_MAP = {
    # Engineering (Civil / Track - P-Way & Bridges)
    "Tamping Machine (BCM)": "Civil Engineering",
    "Track Machine Gang": "Civil Engineering",
    "Bridge Inspection Team": "Civil Engineering",
    "Welding Crew": "Civil Engineering",
    "Manual Gang": "Civil Engineering",
    "USFD Vehicle": "Civil Engineering",
    "Rail Grinding Machine": "Civil Engineering",
    "P&C Maintenance Gang": "Civil Engineering",
    
    # Electrical (TRD / OHE)
    "OHE Maintenance Van": "Electrical (TRD)",
    "OHE Inspection Car": "Electrical (TRD)",
    "Tower Wagon": "Electrical (TRD)",
    "Electrical Gang": "Electrical (TRD)",
    
    # Signal & Telecom (S&T)
    "S&T Maintenance Team": "Signal & Telecom (S&T)",
    "Signal Testing Unit": "Signal & Telecom (S&T)",
    "Interlocking & Points Crew": "Signal & Telecom (S&T)",
    
    # Mechanical (C&W)
    "Accident Relief Train (ART)": "Mechanical (C&W)",
    "140T Crane": "Mechanical (C&W)"
}

def get_department_for_resource(resource: str) -> str:
    res_clean = (resource or "").strip()
    if res_clean in RESOURCE_DEPARTMENT_MAP:
        return RESOURCE_DEPARTMENT_MAP[res_clean]
    for key, dept in RESOURCE_DEPARTMENT_MAP.items():
        if key.lower() in res_clean.lower() or res_clean.lower() in key.lower():
            return dept
    if any(w in res_clean.lower() for w in ["ohe", "electrical", "wire", "traction", "power"]):
        return "Electrical (TRD)"
    if any(w in res_clean.lower() for w in ["signal", "s&t", "telecom", "interlock", "point machine"]):
        return "Signal & Telecom (S&T)"
    if any(w in res_clean.lower() for w in ["crane", "wagon", "art", "carriage"]):
        return "Mechanical (C&W)"
    return "Civil Engineering"

class DataLoader:
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or BASE_DIR
        self.stations: Dict[str, Dict[str, Any]] = {}
        self.segments: Dict[str, Dict[str, Any]] = {}
        self.station_pair_to_segment: Dict[Tuple[str, str], Dict[str, Any]] = {}
        self.adjacent_segments: Dict[str, List[str]] = {}
        self.trains: Dict[str, Dict[str, Any]] = {}
        self.train_routes: Dict[str, List[Dict[str, Any]]] = {}
        self.segment_traffic: Dict[str, Dict[str, Any]] = {}
        self.maintenance_logs: List[Dict[str, Any]] = []
        self.goods_forecasts: List[Dict[str, Any]] = []
        self.segment_train_legs: Dict[str, List[Dict[str, Any]]] = {}
        
        self.load_all()

    def _file_path(self, filename: str) -> str:
        path = os.path.join(self.data_dir, filename)
        if not os.path.exists(path):
            path = os.path.join(BASE_DIR, filename)
        return path

    def load_stations(self):
        self.stations.clear()
        filepath = self._file_path("stations.csv")
        with open(filepath, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                code = row["station_code"].strip()
                self.stations[code] = {
                    "station_code": code,
                    "station_name": row["station_name"].strip(),
                    "division": row["division"].strip(),
                    "line": row["line"].strip(),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"])
                }

    def load_segments(self):
        self.segments.clear()
        self.station_pair_to_segment.clear()
        filepath = self._file_path("track_segments.csv")
        with open(filepath, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                tid = row["track_id"].strip()
                seg = {
                    "track_id": tid,
                    "corridor": row["corridor"].strip(),
                    "from_station": row["from_station"].strip(),
                    "to_station": row["to_station"].strip(),
                    "from_km": float(row["from_km"]),
                    "to_km": float(row["to_km"]),
                    "length_km": float(row["length_km"]),
                    "num_lines": int(row["num_lines"]),
                    "electrified": row["electrified"].strip().lower() == "true",
                    "max_speed_kmph": int(row["max_speed_kmph"]),
                    "terrain": row["terrain"].strip()
                }
                self.segments[tid] = seg
                # Pair lookup
                self.station_pair_to_segment[(seg["from_station"], seg["to_station"])] = seg
                self.station_pair_to_segment[(seg["to_station"], seg["from_station"])] = seg

        # Compute adjacent segments (segments sharing at least one junction station)
        self.adjacent_segments = {tid: [] for tid in self.segments}
        for tid1, seg1 in self.segments.items():
            stns1 = {seg1["from_station"], seg1["to_station"]}
            for tid2, seg2 in self.segments.items():
                if tid1 == tid2:
                    continue
                stns2 = {seg2["from_station"], seg2["to_station"]}
                if bool(stns1 & stns2):
                    self.adjacent_segments[tid1].append(tid2)

    def load_trains(self):
        self.trains.clear()
        filepath = self._file_path("trains.csv")
        with open(filepath, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                tnum = row["train_number"].strip()
                self.trains[tnum] = {
                    "train_number": tnum,
                    "train_name": row["train_name"].strip(),
                    "train_type": row["train_type"].strip(),
                    "corridor": row["corridor"].strip(),
                    "days_of_run": row["days_of_run"].strip(),
                    "avg_speed_kmph": float(row["avg_speed_kmph"])
                }

    def load_train_routes(self):
        self.train_routes.clear()
        filepath = self._file_path("train_routes.csv")
        with open(filepath, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                tnum = row["train_number"].strip()
                if tnum not in self.train_routes:
                    self.train_routes[tnum] = []
                self.train_routes[tnum].append({
                    "train_number": tnum,
                    "train_name": row["train_name"].strip(),
                    "train_type": row["train_type"].strip(),
                    "days_of_run": row["days_of_run"].strip(),
                    "seq": int(row["seq"]),
                    "station_code": row["station_code"].strip(),
                    "station_name": row["station_name"].strip(),
                    "distance_from_origin_km": float(row["distance_from_origin_km"]),
                    "arrival": row["arrival"].strip(),
                    "departure": row["departure"].strip(),
                    "halt_min": int(row["halt_min"])
                })

        for tnum in self.train_routes:
            self.train_routes[tnum].sort(key=lambda s: s["seq"])

    def load_segment_traffic(self):
        self.segment_traffic.clear()
        filepath = self._file_path("segment_traffic_summary.csv")
        with open(filepath, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                tid = row["track_id"].strip()
                self.segment_traffic[tid] = {
                    "track_id": tid,
                    "corridor": row["corridor"].strip(),
                    "from_station": row["from_station"].strip(),
                    "to_station": row["to_station"].strip(),
                    "length_km": float(row["length_km"]),
                    "trains_per_week": int(row["trains_per_week"]),
                    "congestion_level": row["congestion_level"].strip()
                }

    def load_maintenance_logs(self):
        self.maintenance_logs.clear()
        filepath = self._file_path("maintenance_log.csv")
        with open(filepath, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                res = row["machine_resource"].strip()
                dept = get_department_for_resource(res)
                self.maintenance_logs.append({
                    "event_id": row["event_id"].strip(),
                    "date": row["date"].strip(),
                    "track_id": row["track_id"].strip(),
                    "corridor": row["corridor"].strip(),
                    "section": row["section"].strip(),
                    "track_position_km": float(row["track_position_km"]),
                    "issue_type": row["issue_type"].strip(),
                    "severity": row["severity"].strip(),
                    "machine_resource": res,
                    "department": dept,
                    "block_start": row["block_start"].strip(),
                    "planned_duration_min": int(row["planned_duration_min"]),
                    "actual_duration_min": int(row["actual_duration_min"]),
                    "block_end": row["block_end"].strip(),
                    "status": row["status"].strip(),
                    "trains_affected": int(row["trains_affected"])
                })

    def load_goods_forecasts(self):
        self.goods_forecasts.clear()
        filepath = self._file_path("goods_train_forecast.csv")
        if os.path.exists(filepath):
            with open(filepath, mode="r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    self.goods_forecasts.append({
                        "forecast_id": row["forecast_id"].strip(),
                        "week_starting": row["week_starting"].strip(),
                        "corridor": row["corridor"].strip(),
                        "forecast_freight_trains": int(row["forecast_freight_trains"]),
                        "dominant_commodity": row["dominant_commodity"].strip(),
                        "forecast_confidence": row["forecast_confidence"].strip(),
                        "source": row["source"].strip()
                    })

    def precompute_segment_legs(self):
        """
        Precomputes train legs for each track segment using monotonic elapsed minutes
        so overnight journeys and midnight rollovers are calculated cleanly.
        """
        self.segment_train_legs = {tid: [] for tid in self.segments}

        for tnum, stops in self.train_routes.items():
            if len(stops) < 2:
                continue

            train_info = self.trains.get(tnum, {})
            days_of_run = train_info.get("days_of_run", stops[0]["days_of_run"])

            # Calculate monotonic cumulative minutes for each stop along the train's journey
            # Origin stop
            origin_dep_m = parse_time_to_minutes(stops[0]["departure"])
            if origin_dep_m is None:
                continue

            # Store computed (dep_cum_mins, arr_cum_mins) per stop
            stop_times: List[Dict[str, Any]] = []
            cum_clock = origin_dep_m

            for s in stops:
                arr_m = parse_time_to_minutes(s["arrival"])
                dep_m = parse_time_to_minutes(s["departure"])

                # Handle arrival
                if arr_m is not None:
                    # arrival should not be earlier in daily clock than cum_clock % 1440 without crossing midnight
                    while arr_m < (cum_clock % 1440):
                        arr_m += 1440
                    cum_clock = (cum_clock // 1440) * 1440 + arr_m
                    arr_cum = cum_clock
                else:
                    arr_cum = None

                # Handle departure
                if dep_m is not None:
                    while dep_m < (cum_clock % 1440):
                        dep_m += 1440
                    cum_clock = (cum_clock // 1440) * 1440 + dep_m
                    dep_cum = cum_clock
                else:
                    dep_cum = None

                stop_times.append({
                    "station_code": s["station_code"],
                    "station_name": s["station_name"],
                    "arr_cum": arr_cum,
                    "dep_cum": dep_cum,
                    "raw_arrival": s["arrival"],
                    "raw_departure": s["departure"]
                })

            # Create legs between consecutive stops
            for i in range(len(stops) - 1):
                s1 = stops[i]
                s2 = stops[i+1]
                t1 = stop_times[i]
                t2 = stop_times[i+1]

                pair = (s1["station_code"], s2["station_code"])
                seg = self.station_pair_to_segment.get(pair)
                if not seg:
                    continue

                track_id = seg["track_id"]
                dep_cum = t1["dep_cum"]
                arr_cum = t2["arr_cum"]

                if dep_cum is None or arr_cum is None:
                    continue

                direction = "DOWN" if s1["station_code"] == seg["from_station"] else "UP"

                leg_entry = {
                    "train_number": tnum,
                    "train_name": stops[0]["train_name"],
                    "train_type": stops[0]["train_type"],
                    "days_of_run": days_of_run,
                    "track_id": track_id,
                    "corridor": seg["corridor"],
                    "direction": direction,
                    "from_station": s1["station_code"],
                    "to_station": s2["station_code"],
                    "departure_time": s1["departure"],
                    "arrival_time": s2["arrival"],
                    "dep_cum_mins": dep_cum,
                    "arr_cum_mins": arr_cum,
                    "transit_duration_min": arr_cum - dep_cum,
                    "day_offset_dep": dep_cum // 1440,
                    "day_offset_arr": arr_cum // 1440,
                    "dep_mins_in_day": dep_cum % 1440,
                    "arr_mins_in_day": arr_cum % 1440,
                    "origin_station": stops[0]["station_code"],
                    "destination_station": stops[-1]["station_code"],
                    "origin_departure": stops[0]["departure"],
                    "destination_arrival": stops[-1]["arrival"]
                }

                self.segment_train_legs[track_id].append(leg_entry)

        # Sort legs by departure time in day
        for tid in self.segment_train_legs:
            self.segment_train_legs[tid].sort(key=lambda x: (x["dep_mins_in_day"], x["arr_mins_in_day"]))

    def load_all(self):
        self.load_stations()
        self.load_segments()
        self.load_trains()
        self.load_train_routes()
        self.load_segment_traffic()
        self.load_maintenance_logs()
        self.load_goods_forecasts()
        self.precompute_segment_legs()

# Global singleton
data_store = DataLoader()
