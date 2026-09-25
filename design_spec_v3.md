# Rail Sentinel — Redesign Update: Map + Theme (v3)

## 1. Replace the 3D isometric scroll animation

Current: an isometric 3D perspective of the corridors that rotates/shifts
with scroll depth. This isn't reading well and is being replaced.

**New approach — flat clickable blocks on a real-looking map:**
- Keep the same overall geography: the 3 corridors laid out in their real
  relative shape (Mumbai–Pune–Solapur, Mumbai–Nagpur trunk, Pune–Kolhapur),
  not a stylized isometric tilt.
- Background: a satellite-style map texture/tile layer (e.g. a static
  satellite-look basemap or a map library like Leaflet/Mapbox with a
  satellite tile source) so it reads as a real geographic map, not an
  abstract diagram.
- Each track segment (from `track_segments.csv`) is rendered as a flat,
  colored block/line laid over the map along its real path — color =
  live status (green = clear, amber = maintenance/ghat alert, red = high
  occupancy/conflict), same meaning as before.
- No rotation, no scroll-driven perspective change, no auto-animation.
  The map is static until the user interacts with it.

## 2. Click-to-inspect interaction (new — replaces passive viewing)

- Clicking a block opens a detail panel (side drawer or modal) showing:
  - Track ID, section (from–to station), corridor, length, terrain
  - Current status and congestion level (from
    `segment_traffic_summary.csv`)
  - **Live maintenance updates for that block** — the relevant rows from
    `maintenance_log.csv` (issue type, severity, block window, status,
    trains affected), most recent first
  - Scheduled trains passing through that block (from `train_routes.csv`)
- Hovering a block can show a lightweight tooltip (name + status only);
  full detail only on click.
- Closing the panel returns to the plain map view.

## 3. Theme change: dark slate → light theme

Current dark slate palette is reading as dull. Move to a light base while
keeping the signal-color logic (this avoids sliding into plain white/grey
SaaS-default territory):

| Role | Old (dark) | New (light) |
|---|---|---|
| Base background | `#16242A` | Warm off-white `#F6F3EC` |
| Panel / surface | `#22343B` | Soft warm grey `#EDE7DA` |
| Primary accent (amber) | `#E3A63E` | keep `#E3A63E` (works on light too) |
| Secondary accent (green) | `#4F9D69` | keep `#4F9D69` |
| Alert accent (red) | `#C1443C` | keep `#C1443C` |
| Text | `#EDE6D8` | Dark slate `#1C2B30` (for contrast on light bg) |
| Muted text | `#8FA3A8` | `#6B7B80` |

The signal colors (amber/green/red) stay identical — they're functional,
not theme-dependent — so the page will still read as multi-colored rather
than flipping to a plain white-and-black look.

## 4. Keep unchanged

- Sidebar (collapsible), all 5 feature panels and their distinct shapes,
  typography (IBM Plex Sans / Mono), all underlying data and logic.
