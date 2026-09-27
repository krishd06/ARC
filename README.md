# ARC 🚆⚡

Rail Sentinel is an AI-powered automatic track maintenance block-planning decision-support system designed for Indian Railways, built for the Smart India Hackathon (SIH) using Central Railway's Maharashtra network as the pilot region. It automates the evaluation, discovery, and risk-scoring of track maintenance windows by cross-referencing timetable movements against physical segment chainages, allowing railway operations controllers to grant maintenance blocks safely without causing cascading train delays.

---

## 🛠️ Tech Stack

- **Backend**: Python (3.10+) • **FastAPI** • **Uvicorn** • **Pydantic**
- **Frontend**: **React 19** • **Vite 6** • **Leaflet** (Interactive Mapping) • **Lucide React** (Icons) • Vanilla CSS Design System
- **Data & Storage**: High-performance in-memory indexing over structured CSV tables (pure standard library, zero external database setup required)

---

## ✨ Features

- **Conflict Checker**: User selects a track segment and proposed maintenance window; the engine cross-references `train_routes.csv` via chainage in `track_segments.csv` to list every affected train with a clear **CONFLICT DETECTED** or **CLEAR** verdict, overlap durations, and adjacent traffic context.
- **Smart Block Recommender**: Automatically scans scheduled train traffic on a segment to find the longest safe gaps (with emphasis on prime night maintenance hours, 22:00–07:00) and suggests optimal block slots ranked by an explainable **Feasibility Score (0–100%)**.
- **Congestion Heatmap**: Interactive Leaflet map and schematic line diagram of the 3 corridors (*Mumbai CSMT–Pune–Solapur*, *Mumbai–Nagpur Trunk*, *Pune–Kolhapur*), color-coded by congestion level (**High** / **Medium** / **Low**) to identify tight scheduling bottlenecks and ghat sections.
- **Maintenance Calendar Dashboard**: 30-day interactive calendar and timeline of 82 historical block events with multi-field filters (Corridor, Status, Severity, Issue Type) and aggregate operational KPIs (On-time rate, overrun rate, trains regulated).
- **Overrun Risk Predictor**: Bayesian statistical risk scoring model that estimates block overrun probability for a new maintenance request based on issue type, severity, machinery, terrain difficulty (ghat gradient factor), and planned duration adequacy.

---

## 📊 Dataset Note

> ⚠️ **Simulated / Synthetic Dataset Notice**  
> The 6 CSV files in this project (`stations.csv`, `track_segments.csv`, `trains.csv`, `train_routes.csv`, `segment_traffic_summary.csv`, and `maintenance_log.csv`) represent a **100% synthetic/simulated demo dataset** developed for prototype demonstration purposes. Station names, coordinates, and corridor distances are close-to-real approximations of Central Railway Maharashtra routes; train numbers, timetables, and maintenance logs are fabricated. **Do not present any output as real Indian Railways operational data.** See [`dataset_overview.md`](dataset_overview.md) for full schema and design details.

---

## 🚀 Setup & Quick Start (< 5 Minutes)

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/<your-org>/rail-sentinel.git
cd rail-sentinel
```

### 2. Install Dependencies

**Backend:**
```bash
pip install -r backend/requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 3. Environment Variables
**None required!** The application runs out-of-the-box with local CSV loading and configured proxying.

### 4. Run the Application

#### Option A: One-Click Startup (Windows)
Double-click `run.bat` or run:
```cmd
run.bat
```

#### Option B: Manual Startup (Two Terminals)

**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- API Docs & Swagger UI: `http://127.0.0.1:8000/docs`

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 📁 Folder Structure

```
rail-sentinel/
├── backend/
│   ├── data_loader.py          # CSV parser & in-memory relational indexing
│   ├── conflict_checker.py     # Timetable cross-referencing & conflict detection
│   ├── block_recommender.py    # Gap discovery & feasibility scoring engine
│   ├── risk_predictor.py       # Empirical Bayesian overrun risk scoring
│   ├── main.py                 # FastAPI application & REST endpoints
│   └── requirements.txt        # Python backend dependencies
├── frontend/
│   ├── index.html              # App entry HTML & Leaflet/Font stylesheets
│   ├── vite.config.js          # Vite config with /api proxy to FastAPI
│   ├── package.json            # React dependencies & scripts
│   └── src/
│       ├── App.jsx             # Main container, routing & cross-tab state
│       ├── index.css           # Custom Railway command-center design system
│       └── components/
│           ├── Navbar.jsx              # Header, navigation & demo dataset modal
│           ├── ConflictChecker.jsx     # Feature 1: Conflict checking interface
│           ├── BlockRecommender.jsx    # Feature 2: Smart block suggestions
│           ├── CongestionHeatmap.jsx   # Feature 3: Interactive Leaflet map & schematic
│           ├── MaintenanceCalendar.jsx # Feature 4: 30-day timeline, filters & KPIs
│           └── RiskPredictor.jsx       # Feature 5: AI risk score gauge & mitigations
├── dataset_overview.md         # Schema & corridor documentation
├── stations.csv                # 23 Maharashtra station locations & coordinates
├── track_segments.csv          # 23 double-line physical track sections
├── trains.csv                  # 16 scheduled train profiles
├── train_routes.csv            # 150 route stop timings (the timetable)
├── segment_traffic_summary.csv # Segment weekly traffic & congestion levels
├── maintenance_log.csv         # 82 historical block events across 30 days
├── run.bat                     # Windows one-click launcher
├── .gitignore                  # Git ignore rules for Python, Node & OS
└── README.md                   # Project documentation
```

---


