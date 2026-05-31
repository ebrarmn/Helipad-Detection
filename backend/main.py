from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import os
import sqlite3
import json
from datetime import datetime
from fpdf import FPDF

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

model = YOLO("best.pt")
KNOWN_WIDTH, FOCAL_LENGTH = 12.0, 800

# ─── DATABASE SETUP ────────────────────────────────────────────────────────────
DB_PATH = "history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            source    TEXT,
            detections INTEGER,
            distance  REAL,
            confidence REAL,
            min_dist  REAL,
            max_dist  REAL,
            avg_dist  REAL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ─── SESSION STATS (per video session) ─────────────────────────────────────────
session_stats = {
    "source": "unknown",
    "distances": [],
    "confidences": [],
    "detection_count": 0,
    "start_time": datetime.now().isoformat(),
}

last_frame_path = "last_frame.jpg"


# ─── HELPER: run inference on a decoded image ──────────────────────────────────
def run_inference(img: np.ndarray):
    """Returns (annotated_img, detections_list)"""
    results = model.predict(img, conf=0.4)
    detections = []

    if len(results[0].boxes) > 0:
        res_img = results[0].plot()
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0])
            pixel_w = float(x2 - x1)
            distance = (KNOWN_WIDTH * FOCAL_LENGTH) / pixel_w if pixel_w > 0 else 0.0
            detections.append({
                "distance": round(distance, 2),
                "confidence": round(conf, 2),
                "bbox": {
                    "x1": round(float(x1), 1),
                    "y1": round(float(y1), 1),
                    "x2": round(float(x2), 1),
                    "y2": round(float(y2), 1),
                },
            })
    else:
        res_img = img

    return res_img, detections


# ─── /analyze  (video frame stream) ───────────────────────────────────────────
@app.post("/analyze")
async def analyze_mission(file: UploadFile = File(...)):
    global session_stats

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    res_img, detections = run_inference(img)

    # Pick the closest detection as the primary result
    primary = min(detections, key=lambda d: d["distance"]) if detections else None
    distance = primary["distance"] if primary else 0.0
    confidence = primary["confidence"] if primary else 0.0

    # Update session stats
    if detections:
        session_stats["detection_count"] += 1
        session_stats["distances"].append(distance)
        session_stats["confidences"].append(confidence)
        cv2.imwrite(last_frame_path, res_img)

    _, buffer = cv2.imencode('.jpg', res_img)
    img_str = base64.b64encode(buffer).decode('utf-8')

    return {
        "image": img_str,
        "distance": distance,
        "confidence": confidence,
        "status": "TARGET_LOCKED" if distance > 0 else "SEARCHING",
        "detections": detections,          # Feature 8 & 9: all boxes + coords
    }


# ─── /analyze-image  (single static image) ────────────────────────────────────
@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Feature 12 — analyze a single photo, no video required."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    res_img, detections = run_inference(img)

    primary = min(detections, key=lambda d: d["distance"]) if detections else None
    distance = primary["distance"] if primary else 0.0
    confidence = primary["confidence"] if primary else 0.0

    if detections:
        cv2.imwrite(last_frame_path, res_img)

    # Persist to DB immediately for single-image analyses
    _save_to_db(
        source=file.filename or "image",
        detections=len(detections),
        distance=distance,
        confidence=confidence,
        distances=[d["distance"] for d in detections],
    )

    _, buffer = cv2.imencode('.jpg', res_img)
    img_str = base64.b64encode(buffer).decode('utf-8')

    return {
        "image": img_str,
        "distance": distance,
        "confidence": confidence,
        "status": "TARGET_LOCKED" if distance > 0 else "NO_TARGET",
        "detections": detections,
    }


# ─── /session/start  ───────────────────────────────────────────────────────────
@app.post("/session/start")
async def start_session(source: str = "video"):
    global session_stats
    session_stats = {
        "source": source,
        "distances": [],
        "confidences": [],
        "detection_count": 0,
        "start_time": datetime.now().isoformat(),
    }
    return {"status": "session_started"}


# ─── /session/end  ─────────────────────────────────────────────────────────────
@app.post("/session/end")
async def end_session():
    """Save current session stats to DB."""
    dists = session_stats["distances"]
    _save_to_db(
        source=session_stats["source"],
        detections=session_stats["detection_count"],
        distance=dists[-1] if dists else 0.0,
        confidence=session_stats["confidences"][-1] if session_stats["confidences"] else 0.0,
        distances=dists,
    )
    return {"status": "session_saved"}


def _save_to_db(source, detections, distance, confidence, distances):
    dists = [d for d in distances if d > 0]
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """INSERT INTO analysis_history
           (timestamp, source, detections, distance, confidence, min_dist, max_dist, avg_dist)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            datetime.now().isoformat(timespec="seconds"),
            source,
            detections,
            round(distance, 2),
            round(confidence, 2),
            round(min(dists), 2) if dists else 0.0,
            round(max(dists), 2) if dists else 0.0,
            round(sum(dists) / len(dists), 2) if dists else 0.0,
        ),
    )
    conn.commit()
    conn.close()


# ─── /history  ─────────────────────────────────────────────────────────────────
@app.get("/history")
async def get_history(limit: int = 20):
    """Feature 10 — return past analysis sessions."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM analysis_history ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return {"history": [dict(r) for r in rows]}


# ─── /generate-report  ────────────────────────────────────────────────────────
@app.get("/generate-report")
async def generate_report():
    """Feature 11 — enhanced PDF with stats, timestamps, multi-detection info."""
    dists = [d for d in session_stats["distances"] if d > 0]
    confs = session_stats["confidences"]

    pdf = FPDF()
    pdf.add_page()

    # ── Header ──
    pdf.set_fill_color(10, 10, 10)
    pdf.set_text_color(0, 200, 100)
    pdf.set_font("Courier", 'B', 18)
    pdf.cell(0, 12, "HELIPAD DETECTION SYSTEM", ln=True, align='C')
    pdf.set_font("Courier", size=9)
    pdf.cell(0, 6, "MISSION CONTROL - ANALYSIS REPORT", ln=True, align='C')
    pdf.ln(4)

    # ── Divider ──
    pdf.set_draw_color(0, 180, 80)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)

    # ── Mission Info ──
    pdf.set_text_color(50, 50, 50)
    pdf.set_font("Courier", 'B', 10)
    pdf.cell(0, 7, "MISSION INFORMATION", ln=True)
    pdf.set_font("Courier", size=9)
    pdf.cell(95, 6, f"Source: {session_stats['source']}", border=1)
    pdf.cell(95, 6, f"Session Start: {session_stats['start_time'][:19]}", border=1, ln=True)
    pdf.cell(95, 6, f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", border=1)
    pdf.cell(95, 6, f"Total Detections: {session_stats['detection_count']}", border=1, ln=True)
    pdf.ln(4)

    # ── Distance Statistics ──
    pdf.set_font("Courier", 'B', 10)
    pdf.cell(0, 7, "DISTANCE STATISTICS", ln=True)
    pdf.set_font("Courier", size=9)
    stats = [
        ("Min Distance", f"{min(dists):.2f} m" if dists else "N/A"),
        ("Max Distance", f"{max(dists):.2f} m" if dists else "N/A"),
        ("Avg Distance", f"{sum(dists)/len(dists):.2f} m" if dists else "N/A"),
        ("Avg Confidence", f"{sum(confs)/len(confs)*100:.1f}%" if confs else "N/A"),
        ("Last Distance", f"{dists[-1]:.2f} m" if dists else "N/A"),
    ]
    for label, value in stats:
        pdf.cell(95, 6, label, border=1)
        pdf.cell(95, 6, value, border=1, ln=True)
    pdf.ln(4)

    # ── Last Captured Frame ──
    if os.path.exists(last_frame_path):
        pdf.set_font("Courier", 'B', 10)
        pdf.cell(0, 7, "LAST CAPTURED FRAME", ln=True)
        pdf.image(last_frame_path, x=10, w=180)
        pdf.ln(4)

    # ── Distance History (last 30 readings) ──
    if dists:
        pdf.set_font("Courier", 'B', 10)
        pdf.cell(0, 7, f"DISTANCE LOG (last {min(len(dists),30)} readings)", ln=True)
        pdf.set_font("Courier", size=8)
        for i, d in enumerate(dists[-30:], 1):
            pdf.cell(30, 5, f"#{i:02d}: {d:.2f}m", border=1)
            if i % 6 == 0:
                pdf.ln()
        pdf.ln(6)

    pdf.output("report.pdf")
    return FileResponse("report.pdf", filename=f"helipad_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")