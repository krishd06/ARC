from typing import Dict, List, Any, Optional
from collections import defaultdict
from backend.data_loader import data_store

class OverrunRiskPredictor:
    def __init__(self):
        self.issue_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0, "overrun": 0, "diffs": [], "durations": []})
        self.severity_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0, "overrun": 0})
        self.resource_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0, "overrun": 0})
        self.terrain_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0, "overrun": 0})
        self.overall_overrun_rate = 0.12  # fallback baseline
        self.compute_historical_baselines()

    def compute_historical_baselines(self):
        logs = data_store.maintenance_logs
        total_logs = len(logs)
        overrun_total = 0

        for r in logs:
            st = r["status"]
            issue = r["issue_type"]
            sev = r["severity"]
            res = r["machine_resource"]
            tid = r["track_id"]
            seg = data_store.segments.get(tid, {})
            terrain = seg.get("terrain", "plain")

            p_dur = r["planned_duration_min"]
            a_dur = r["actual_duration_min"]

            is_ovr = 1 if st == "Overrun" else 0
            if is_ovr:
                overrun_total += 1

            self.issue_stats[issue]["total"] += 1
            if is_ovr:
                self.issue_stats[issue]["overrun"] += 1
            if a_dur > 0 and st in ("Completed", "Overrun"):
                self.issue_stats[issue]["diffs"].append(a_dur - p_dur)
                self.issue_stats[issue]["durations"].append(a_dur)

            self.severity_stats[sev]["total"] += 1
            if is_ovr:
                self.severity_stats[sev]["overrun"] += 1

            self.resource_stats[res]["total"] += 1
            if is_ovr:
                self.resource_stats[res]["overrun"] += 1

            self.terrain_stats[terrain]["total"] += 1
            if is_ovr:
                self.terrain_stats[terrain]["overrun"] += 1

        if total_logs > 0:
            self.overall_overrun_rate = overrun_total / total_logs

    def predict(
        self,
        issue_type: str,
        severity: str,
        machine_resource: str,
        track_id: str,
        planned_duration_min: int,
        block_start_time: str = "02:00"
    ) -> Dict[str, Any]:
        """
        Estimates the probability of maintenance block overrun and explains contributing risk factors.
        """
        seg = data_store.segments.get(track_id, {})
        terrain = seg.get("terrain", "plain")
        traffic = data_store.segment_traffic.get(track_id, {})
        congestion = traffic.get("congestion_level", "Medium")

        # 1. Base Issue Type Risk
        issue_data = self.issue_stats.get(issue_type, {"total": 0, "overrun": 0, "diffs": [], "durations": []})
        if issue_data["total"] > 0:
            # Empirical Bayes smoothing towards overall rate
            prior_weight = 3
            smoothed_issue_rate = (issue_data["overrun"] + prior_weight * self.overall_overrun_rate) / (issue_data["total"] + prior_weight)
            avg_diff = sum(issue_data["diffs"]) / len(issue_data["diffs"]) if issue_data["diffs"] else 0
            avg_duration = sum(issue_data["durations"]) / len(issue_data["durations"]) if issue_data["durations"] else planned_duration_min
        else:
            smoothed_issue_rate = self.overall_overrun_rate
            avg_diff = 0
            avg_duration = planned_duration_min

        # 2. Severity Factor
        sev_mult = {
            "High": 1.25,
            "Medium": 1.10,
            "Low": 0.85
        }.get(severity, 1.0)

        # 3. Terrain Factor (Ghat sections have severe gradient/tunnel access constraints)
        terrain_mult = 1.35 if terrain == "ghat/hilly" else 1.0

        # 4. Congestion Pressure
        congestion_mult = {
            "High": 1.20,
            "Medium": 1.05,
            "Low": 0.90
        }.get(congestion, 1.0)

        # 5. Planned Duration Stress
        # If planned duration is shorter than typical for this issue, risk increases
        duration_stress = 1.0
        if avg_duration > 0 and planned_duration_min < avg_duration * 0.8:
            duration_stress = 1.30
        elif planned_duration_min > avg_duration * 1.3:
            duration_stress = 0.80

        # Combined Probability Calculation
        raw_prob = smoothed_issue_rate * sev_mult * terrain_mult * congestion_mult * duration_stress
        prob_pct = round(max(3.0, min(95.0, raw_prob * 100)), 1)

        # Risk Classification
        if prob_pct >= 60.0:
            risk_tier = "Severe Risk"
            risk_color = "crimson"
            buffer_rec_min = 45
        elif prob_pct >= 35.0:
            risk_tier = "Elevated Risk"
            risk_color = "amber"
            buffer_rec_min = 30
        elif prob_pct >= 18.0:
            risk_tier = "Moderate Risk"
            risk_color = "yellow"
            buffer_rec_min = 15
        else:
            risk_tier = "Low Risk"
            risk_color = "emerald"
            buffer_rec_min = 10

        # Explainable Factors
        factors = [
            {
                "name": "Historical Issue Type Profile",
                "impact": f"{smoothed_issue_rate*100:.1f}% base frequency",
                "detail": f"{issue_type} has {issue_data['overrun']} recorded overruns in {issue_data['total']} historical blocks.",
                "type": "negative" if smoothed_issue_rate > self.overall_overrun_rate else "positive"
            },
            {
                "name": "Terrain Difficulty",
                "impact": "+35% risk multiplier" if terrain == "ghat/hilly" else "Standard plain topography",
                "detail": f"Section {seg.get('from_station', '')}–{seg.get('to_station', '')} is {terrain} terrain.",
                "type": "negative" if terrain == "ghat/hilly" else "neutral"
            },
            {
                "name": "Corridor Congestion Stress",
                "impact": f"{congestion} corridor pressure",
                "detail": f"Carries {traffic.get('trains_per_week', 30)} trains/week. Fast restoration required.",
                "type": "negative" if congestion == "High" else "neutral"
            },
            {
                "name": "Planned Duration Adequacy",
                "impact": "Tight schedule" if duration_stress > 1.1 else ("Generous buffer" if duration_stress < 0.9 else "Standard duration"),
                "detail": f"Planned {planned_duration_min} min vs historical average of {int(avg_duration)} min for this repair type.",
                "type": "negative" if duration_stress > 1.1 else "positive"
            }
        ]

        # Actionable Mitigations
        mitigations = [
            f"Build in a recommended safety contingency buffer of at least +{buffer_rec_min} minutes into the block warrant.",
            f"Pre-position {machine_resource} at nearest junction ({seg.get('from_station', 'hub')}) 45 minutes prior to block grant."
        ]
        if terrain == "ghat/hilly":
            mitigations.append("Deploy brake-van escort and banker locomotive support for equipment movement in ghat section.")
        if congestion == "High":
            mitigations.append("Alert divisional train controller for dynamic path regulation on adjacent loop lines.")

        return {
            "issue_type": issue_type,
            "severity": severity,
            "machine_resource": machine_resource,
            "track_id": track_id,
            "section_name": f"{seg.get('from_station', '')} → {seg.get('to_station', '')}",
            "corridor": seg.get("corridor", ""),
            "terrain": terrain,
            "congestion_level": congestion,
            "planned_duration_min": planned_duration_min,
            "historical_avg_duration_min": round(avg_duration, 1),
            "ai_risk_score": prob_pct,
            "risk_tier": risk_tier,
            "risk_color": risk_color,
            "recommended_buffer_min": buffer_rec_min,
            "factors": factors,
            "mitigations": mitigations,
            "benchmark_stats": {
                "total_past_events": issue_data["total"],
                "past_overruns": issue_data["overrun"],
                "historical_avg_delay_min": round(avg_diff, 1)
            }
        }

    def compute_priority(
        self,
        item: Dict[str, Any],
        current_date_str: str = "2026-08-15"
    ) -> Dict[str, Any]:
        """
        Computes Maintenance Priority Score (0-100) based on:
        - Severity Weight (0-35)
        - Urgency / Days overdue vs Target SLA Window (0-30)
        - Segment Congestion Pressure (0-20)
        - Scheduled Trains Affected / Line Density (0-15)
        """
        severity = item.get("severity", "Medium")
        issue_type = item.get("issue_type", "")
        track_id = item.get("track_id", "")
        trains_affected = item.get("trains_affected", 0)
        event_date_str = item.get("date", "2026-08-01")
        machine_resource = item.get("machine_resource", "")
        
        seg = data_store.segments.get(track_id, {})
        traffic = data_store.segment_traffic.get(track_id, {})
        congestion = traffic.get("congestion_level", "Medium")
        
        # 1. Severity Score (0 - 35 pts)
        if severity == "High":
            sev_pts = 35
        elif severity == "Medium":
            sev_pts = 22
        else:
            sev_pts = 10
            
        if any(term in issue_type.lower() for term in ["fracture", "weld failure", "snag", "signal-track"]):
            sev_pts = max(sev_pts, 35)

        # 2. Urgency Score (0 - 30 pts)
        # SLA target window based on severity
        sla_days = 2 if severity == "High" else (5 if severity == "Medium" else 10)
        try:
            cur_d = datetime.strptime(current_date_str, "%Y-%m-%d").date()
            ev_d = datetime.strptime(event_date_str, "%Y-%m-%d").date()
            days_pending = max(1, (cur_d - ev_d).days)
        except Exception:
            days_pending = 3

        days_overdue = max(0, days_pending - sla_days)
        urg_pts = min(30, max(5, int(days_pending * 2.5 + days_overdue * 5)))

        # 3. Congestion Score (0 - 20 pts)
        if congestion == "High":
            cong_pts = 20
        elif congestion == "Medium":
            cong_pts = 12
        else:
            cong_pts = 5

        # 4. Trains Affected Score (0 - 15 pts)
        trains_pts = min(15, max(2, int(trains_affected * 2.2 + (4 if congestion == "High" else 2))))

        total_score = max(5, min(100, sev_pts + urg_pts + cong_pts + trains_pts))

        if total_score >= 80:
            priority_tier = "Critical Priority"
            priority_badge_color = "red"
            action_recommendation = "Immediate Track Possession Required (<24h)"
        elif total_score >= 60:
            priority_tier = "High Priority"
            priority_badge_color = "amber"
            action_recommendation = "Schedule in Next Available Night Window (<48h)"
        elif total_score >= 40:
            priority_tier = "Medium Priority"
            priority_badge_color = "yellow"
            action_recommendation = "Integrate into Upcoming 7-Day Corridor Plan"
        else:
            priority_tier = "Routine"
            priority_badge_color = "green"
            action_recommendation = "Routine Maintenance Backlog Window"

        # Also get overrun prediction for this item to show both distinct scores
        overrun_pred = self.predict(
            issue_type=issue_type,
            severity=severity,
            machine_resource=machine_resource,
            track_id=track_id,
            planned_duration_min=item.get("planned_duration_min", 120),
            block_start_time=item.get("block_start", "02:00").split(" ")[-1] if " " in item.get("block_start", "") else "02:00"
        )

        return {
            **item,
            "section_name": f"{seg.get('from_station', '')} → {seg.get('to_station', '')}",
            "corridor": seg.get("corridor", item.get("corridor", "")),
            "terrain": seg.get("terrain", "plain"),
            "congestion_level": congestion,
            "priority_score": total_score,
            "priority_tier": priority_tier,
            "priority_badge_color": priority_badge_color,
            "action_recommendation": action_recommendation,
            "sla_target_days": sla_days,
            "days_pending": days_pending,
            "days_overdue": days_overdue,
            "overrun_probability_pct": overrun_pred.get("ai_risk_score", 15.0),
            "overrun_risk_tier": overrun_pred.get("risk_tier", "Low Risk"),
            "score_breakdown": {
                "severity_pts": sev_pts,
                "urgency_pts": urg_pts,
                "congestion_pts": cong_pts,
                "trains_affected_pts": trains_pts
            }
        }

    def get_prioritized_maintenance_list(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Returns ranked list of open/planned and backlog maintenance items sorted by Priority Score descending.
        """
        # Take planned, rescheduled, or all open maintenance items
        all_logs = data_store.maintenance_logs
        scored_items = []
        for l in all_logs:
            # Score each log
            scored = self.compute_priority(l)
            scored_items.append(scored)

        # Sort by priority_score descending
        scored_items.sort(key=lambda x: x["priority_score"], reverse=True)
        return scored_items[:limit]

risk_predictor = OverrunRiskPredictor()
