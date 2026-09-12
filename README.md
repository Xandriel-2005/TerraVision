# TerraVision IBVAP — Prototype

Software-only AI platform that transforms existing CCTV cameras into an intelligent surveillance network. Built for SIH 2026.

## Architecture
The system consists of three main components:
1. **AI Pipeline (Python)**: YOLOv8 + ByteTrack + Virtual Fencing engine. Processes video and pushes results via WebSocket. Needs GPU for real-time performance.
2. **Backend API (FastAPI)**: REST endpoints + WebSocket relay.
3. **Dashboard (React/Vite)**: Tactical UI for real-time monitoring.

## Getting Started

### 1. Start Backend & Frontend
You can use Docker Compose to start the web stack:
```bash
docker-compose up --build
```
- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs

Alternatively, to run natively:
```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 2. Start AI Pipeline (CPU or NVIDIA GPU)
The AI pipeline uses PyTorch. It can run on the CPU (using `yolov8n.pt` for speed) or on an NVIDIA GPU (using `yolov8m.pt` for accuracy).

```bash
cd ai_pipeline
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create demo videos folder and add some mp4 files
mkdir demo_videos
# Edit config.yaml to point to your video files

# Run pipeline
python main.py
```

### 3. Demo Videos
Place your pre-recorded demo footage in `ai_pipeline/demo_videos/`. Update `ai_pipeline/config.yaml` to point to these files.

When the pipeline runs, it will process the videos, detect people and vehicles, calculate virtual fence crossings, and stream the annotated frames directly to the React dashboard.
