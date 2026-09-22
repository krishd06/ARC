from backend.data_loader import data_store
from backend.conflict_checker import check_segment_conflicts
from backend.block_recommender import recommend_block_windows

print("=== CONFLICT CHECKER TEST ===")
c1 = check_segment_conflicts("T001", "2026-08-05", "07:10", "07:30")
print(f"T001 07:10-07:30 verdict: {c1['verdict']} ({c1['conflict_count']} trains)")
c2 = check_segment_conflicts("T001", "2026-08-05", "03:00", "05:00")
print(f"T001 03:00-05:00 verdict: {c2['verdict']} ({c2['conflict_count']} trains)")

print("\n=== BLOCK RECOMMENDER TEST ===")
r = recommend_block_windows("T003", "2026-08-05")
print(f"T003 recommendations found: {len(r['recommendations'])}")
for rec in r["recommendations"][:3]:
    print(f"  Slot: {rec['start_time']} - {rec['end_time']} ({rec['duration_formatted']}) | Score: {rec['feasibility_score']}% ({rec['feasibility_label']})")
