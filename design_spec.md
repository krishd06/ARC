# Rail Sentinel — Visual Redesign Spec (v2)

**Goal:** move away from the generic "AI-generated dashboard" look (white or
near-black backgrounds, one blue/teal accent, identical rounded SaaS cards)
toward something that feels like it belongs to an actual railway control
room — grounded in signal lights, track systems, and control-panel
instrumentation. Minimalist in structure, rich in color, same feature set as
now, nothing removed.

---

## 1. Color — inspired by railway signaling, not SaaS defaults

Real railway signals only use a handful of colors, and they mean something
(stop, caution, clear). Borrowing that logic gives us a palette that's
inherently railway-specific and naturally avoids "white dashboard" or
"black + one neon accent" territory.

| Role | Color | Hex |
|---|---|---|
| Base background | Deep slate teal (steel-at-dusk, not black) | `#16242A` |
| Panel / surface | Lighter slate | `#22343B` |
| Primary accent (signal amber — attention, in-progress) | Amber | `#E3A63E` |
| Secondary accent (signal green — clear, healthy, low risk) | Signal green | `#4F9D69` |
| Alert accent (signal red — high severity, conflict) | Signal red | `#C1443C` |
| Text / foreground (warm off-white, not stark white) | Warm paper | `#EDE6D8` |
| Muted text | Desaturated slate | `#8FA3A8` |

Rule: no single color should dominate more than ~60% of any screen. Amber,
green, and red are used *functionally* (status, severity, risk level), not
decoratively — so the UI is naturally multi-colored because the data itself
is multi-colored (a page full of "Low risk" badges will be mostly green, one
full of overruns will lean red — the palette responds to the data).

## 2. Typography

- **UI text / body:** IBM Plex Sans — has an engineered, technical
  character without being cold.
- **Data readouts** (chainage numbers, timestamps, train numbers, track
  IDs): IBM Plex Mono — legitimate use here since this is real tabular/
  numeric data, not decoration.
- No tracked-out ALL-CAPS labels, no middot-separated meta strings, no
  arrow-suffixed buttons. Section headers are sentence case.

## 3. Layout

```
[≡]  RAIL SENTINEL                                    [live status dot]
┌────────┬──────────────────────────────────────────────────────────┐
│        │  HERO: 3D isometric corridor map (scroll-driven)         │
│  side  │  trains move along tracks as you scroll; signal lights   │
│  panel │  along the track glow amber/green/red based on real      │
│ (hide- │  segment status                                          │
│  able) ├──────────────────────────────────────────────────────────┤
│        │  Conflict Checker      │  Block Recommender               │
│  nav   │  (panel shape A)       │  (panel shape B — different      │
│  icons │                        │   corner treatment, not a        │
│        │                        │   clone of panel A)              │
│        ├──────────────────────────────────────────────────────────┤
│        │  Congestion Heatmap (full-width, own treatment)          │
│        ├──────────────────────────────────────────────────────────┤
│        │  Maintenance Calendar   │  Overrun Risk Predictor         │
└────────┴──────────────────────────────────────────────────────────┘
```

- **Left sidebar:** collapsible/hideable (icon-only rail when collapsed,
  labeled when expanded), holds navigation between the 5 feature modules
  plus a live network status summary. Slides, doesn't just disappear —
  this is the one deliberate motion moment on load.
- **Feature panels are NOT identical cards.** Each of the 5 features gets
  its own panel treatment (differing corner radius, border weight, or
  accent placement) so the page doesn't read as "same card, different
  content" — while staying within the same color system so it's still
  cohesive.
- Alignment: left-aligned content throughout (control-room instrumentation
  reads left-to-right, top-to-bottom — not centered marketing-page text).

## 4. The 3D scroll element

One deliberate 3D moment, not scattered animations everywhere:
- An isometric 3D view of the three corridors (Mumbai–Pune–Solapur,
  Mumbai–Nagpur trunk, Pune–Kolhapur) rendered as a stylized track network.
- As the user scrolls the hero into view, the camera/perspective shifts
  slightly (parallax) and small train markers travel along the tracks.
- Segment color = live status (green = clear, amber = maintenance
  scheduled, red = conflict/overrun) — pulling directly from
  `segment_traffic_summary.csv` / `maintenance_log.csv`, not decorative.
- Everywhere else: motion only responds to user action (sidebar
  collapsing, a panel expanding, a risk score animating in when
  calculated) — no fade-up-on-scroll for every section.

## 5. What to keep unchanged

- All 5 existing features and their underlying logic/data — this is a
  visual and layout pass only, not a feature or data change.
- Existing API endpoints and data files.

## 6. What "done" looks like

- No pure white or pure black anywhere.
- No default rounded-card-with-grey-shadow treatment repeated identically
  across all 5 features.
- Sidebar can be toggled hidden/shown, state persists during the session.
- Hero has one working 3D/scroll-driven moment; rest of the page motion is
  interaction-triggered only.
- Page reads as "railway control room," not "generic AI SaaS dashboard."
