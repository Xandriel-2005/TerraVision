# TerraVision IBVAP — Task Tracker

## Track 1 — AI Pipeline
- [x] Project structure + `requirements.txt`
- [x] `detector.py` — YOLOv8 + ByteTrack detection engine
- [x] `virtual_fence.py` — Zone intrusion + tripwire logic
- [x] `night_enhancer.py` — CLAHE low-light preprocessing
- [x] `stream_manager.py` — Multi-camera + WebSocket push
- [x] `main.py` — Entry point + config loader
- [x] `config.yaml` — Demo camera config

## Track 2 — Backend API
- [x] FastAPI scaffold + `requirements.txt`
- [x] `models.py` — SQLAlchemy models (Camera, Zone, Alert, Event)
- [x] `schemas.py` — Pydantic schemas
- [x] `database.py` — Async SQLite setup
- [x] `routers/cameras.py` — Camera CRUD endpoints
- [x] `routers/zones.py` — Virtual fence zone CRUD
- [x] `routers/alerts.py` — Alert listing + acknowledge
- [x] `routers/analytics.py` — Dashboard stats
- [x] `ws_manager.py` — WebSocket relay (pipeline ↔ dashboard)
- [x] `main.py` — App entry point with CORS + routing

## Track 3 — Frontend Dashboard
- [x] Vite + React + TypeScript scaffold
- [x] Design system — CSS tokens, dark tactical theme, fonts
- [x] Layout shell — Sidebar, Header, routing
- [x] `CameraFeed.tsx` — WebSocket → canvas renderer
- [x] `LiveFeedGrid.tsx` — 2×2 camera grid
- [x] `StatsPanel.tsx` — Real-time counters
- [x] `AlertTicker.tsx` — Scrolling alert bar
- [/] `ZoneEditor.tsx` — Draw virtual fences on camera
- [ ] `AlertList.tsx` + `AlertCard.tsx` — Alert history page
- [ ] `MapView.tsx` — GIS map with camera pins
- [x] `DashboardPage.tsx` — Main page assembly
- [ ] `AlertsPage.tsx` — Alerts history page
- [ ] `ZonesPage.tsx` — Zone management page
- [x] WebSocket hooks (`useWebSocket`, `useCameraStream`, `useAlerts`)

## Integration & Polish
- [ ] End-to-end test: pipeline → backend → dashboard
- [ ] Docker Compose for one-command startup
- [ ] README with setup instructions
