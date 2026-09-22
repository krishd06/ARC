# Maharashtra Rail Network — Simulated Dataset
**For: AI-Powered Automatic Block Planning (SIH prototype)**
**Status: 100% synthetic / simulated. Station names, coordinates, and corridor
distances are close-to-real approximations of actual Central Railway routes
in Maharashtra; train numbers, exact timings, and all maintenance events are
fabricated for demo purposes. Do not present as official Indian Railways data.**

---

## 1. Why this dataset exists

Real-time Indian Railways schedule data is scraped/unofficial only, and
maintenance/block-planning data is **not publicly available at all** (internal
zonal operations data — confirmed via CAG audit reports and Parliament
Q&As). For a hackathon prototype of an automatic block-planning tool, this
synthetic dataset stands in for both, built to be internally consistent
(distances, traffic volumes, and maintenance frequency all relate to each
other sensibly) so the app's logic can be demoed convincingly.

## 2. Coverage

Three real Central Railway corridors through Maharashtra, stitched together
at shared junctions (Mumbai CSMT, Kalyan, Pune):

| Corridor | Stations | Approx. length |
|---|---|---|
| Mumbai CSMT → Pune → Solapur | 9 stations | 456 km |
| Mumbai CSMT → Igatpuri → Manmad → Bhusawal → Nagpur | 11 stations | 837 km |
| Pune → Satara → Miraj → Kolhapur | 6 stations | 275 km |

23 unique stations, 23 track segments, 16 trains (express/superfast/passenger/
freight/EMU mix), 150 route-stop rows, 82 maintenance events across 30 days.

## 3. Files

### `stations.csv`
One row per station.
| column | meaning |
|---|---|
| station_code | short IR-style code (e.g. `PUNE`, `NGP`) |
| station_name | full name |
| division | operating division (Mumbai CR / Pune / Bhusawal / Nagpur / Solapur) |
| line | which corridor(s) pass through it |
| latitude, longitude | approximate coordinates |

### `track_segments.csv`
One row per track segment **between two consecutive stations** — this is the
core unit block-planning operates on.
| column | meaning |
|---|---|
| track_id | unique ID, e.g. `T001` |
| corridor | which of the 3 corridors |
| from_station, to_station | station codes at each end |
| from_km, to_km | chainage (distance from corridor origin) |
| length_km | segment length |
| num_lines | number of parallel tracks (all set to 2 = double line) |
| electrified | true/false |
| max_speed_kmph | permissible speed (lower in ghat/hilly sections) |
| terrain | `plain` or `ghat/hilly` (ghat sections: Kalyan–Karjat–Lonavala, Kalyan–Kasara–Igatpuri) |

### `trains.csv`
One row per train (16 total): number, name, type, corridor, days of run,
average speed.

### `train_routes.csv`
The full timetable — one row per (train, stop). Includes arrival/departure
time, halt duration, and cumulative distance from origin. This is what a
scheduling engine would join against `track_segments.csv` to know which
train occupies which segment at which time.

### `segment_traffic_summary.csv`
Derived table: trains-per-week and a `congestion_level` (Low/Medium/High)
per track segment, computed from how many trains in `trains.csv` traverse
it. Use this to prioritize which segments are hardest to find a maintenance
block on — high-traffic segments (Pune–Solapur stretch, Mumbai–Nagpur trunk)
have the least slack.

### `maintenance_log.csv`
30 days of simulated maintenance/block events (82 rows), the core dataset
for the "automatic block planning" feature.
| column | meaning |
|---|---|
| event_id | unique ID |
| date | calendar date |
| track_id, corridor, section | which segment |
| track_position_km | exact chainage point of the issue within the segment |
| issue_type | e.g. rail fracture, ballast deficiency, OHE snag, weld failure, points wear, corrugation, vegetation, bridge inspection, signal-track fault, routine USFD |
| severity | Low / Medium / High |
| machine_resource | resource needed (Tamping Machine, USFD Vehicle, Welding Crew, OHE Van, etc.) |
| block_start, block_end | scheduled window (blocks cluster late-night/early-morning, matching real IR practice) |
| planned_duration_min, actual_duration_min | for modelling overruns |
| status | Planned / Completed / Overrun / Cancelled-Rescheduled |
| trains_affected | how many scheduled trains fell inside the block window |

## 4. Suggested app logic to build on this

1. **Conflict detection**: for a proposed maintenance window (track_id +
   time range), cross-reference `train_routes.csv` (via `track_segments.csv`
   chainage) to list trains that would be affected.
2. **Optimal slot suggestion**: use `segment_traffic_summary.csv` +
   `train_routes.csv` to find the longest gap between trains on a segment
   each night — that's the maximum feasible block length.
3. **Overrun risk scoring**: `maintenance_log.csv`'s `status` and
   `planned_duration_min` vs `actual_duration_min` gives you a simple
   historical basis for predicting overrun probability by `issue_type`.
4. **Dashboard views**: congestion heatmap (segment_traffic_summary), a
   monthly maintenance calendar (maintenance_log), and a "next available
   block window" recommender per segment.

## 5. Known simplifications (say this if judges ask)

- Only 2 lines assumed everywhere (no single-line sections modelled).
- Weekly train frequency used as the congestion proxy rather than a full
  minute-by-minute conflict graph.
- Maintenance event generation is randomized within realistic patterns
  (late-night blocks, higher-severity issues needing longer blocks) rather
  than pulled from any real fault-history model.
