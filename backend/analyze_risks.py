import csv
from collections import defaultdict

logs = list(csv.DictReader(open("maintenance_log.csv")))
print(f"Total maintenance logs: {len(logs)}")

status_counts = defaultdict(int)
issue_overrun = defaultdict(lambda: {"total": 0, "overrun": 0, "completed": 0, "diffs": []})
severity_overrun = defaultdict(lambda: {"total": 0, "overrun": 0})
resource_overrun = defaultdict(lambda: {"total": 0, "overrun": 0})

for r in logs:
    st = r["status"]
    status_counts[st] += 1
    issue = r["issue_type"]
    sev = r["severity"]
    res = r["machine_resource"]
    p_dur = int(r["planned_duration_min"])
    a_dur = int(r["actual_duration_min"]) if r["actual_duration_min"].isdigit() else 0
    
    is_ovr = 1 if st == "Overrun" else 0
    
    issue_overrun[issue]["total"] += 1
    if is_ovr:
        issue_overrun[issue]["overrun"] += 1
    if a_dur > 0:
        issue_overrun[issue]["diffs"].append(a_dur - p_dur)
        
    severity_overrun[sev]["total"] += 1
    if is_ovr: severity_overrun[sev]["overrun"] += 1
    
    resource_overrun[res]["total"] += 1
    if is_ovr: resource_overrun[res]["overrun"] += 1

print("\n--- Status Counts ---")
for k, v in status_counts.items():
    print(f"  {k}: {v}")

print("\n--- Overrun Rate by Issue Type ---")
for k, v in sorted(issue_overrun.items(), key=lambda x: x[1]["overrun"]/max(1, x[1]["total"]), reverse=True):
    rate = (v["overrun"] / v["total"]) * 100
    avg_diff = sum(v["diffs"]) / len(v["diffs"]) if v["diffs"] else 0
    print(f"  {k:45s} | Count: {v['total']:2d} | Overruns: {v['overrun']:2d} ({rate:4.1f}%) | Avg Diff: {avg_diff:+4.1f}m")

print("\n--- Overrun Rate by Severity ---")
for k, v in severity_overrun.items():
    print(f"  {k}: {v['overrun']}/{v['total']} ({(v['overrun']/v['total'])*100:.1f}%)")
