from fastapi import FastAPI, File, UploadFile, HTTPException, Query, WebSocket, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import json
import csv
import base64
import asyncio
import os
import uuid
import shutil
from typing import List, Dict
from services.tracking import process_video  # Import video processing function

# Directories and File Paths
UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)
active_websockets: List[WebSocket] = []
data_file = "person_count_by_frames.csv"
last_sent_row: Dict[str, str] = {}
BASE_CSV_DIR = os.getcwd()
CSV_FILE_PATH = os.path.join(BASE_CSV_DIR, data_file)

# Global Variables
processed_results = {}
roi_coordinates = None

# FastAPI App
app = FastAPI(
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

# Dummy Data Storage
rules = [
    {"id": "1", "rule": "Person Detection", "type": "object", "threshold": 70, "enabled": True},
    {"id": "2", "rule": "Rule 2", "type": "NONE", "threshold": 62, "enabled": True},
]

models = [
    {"id": "1", "name": "YOLOv8", "model_info": "General object detection model", "accuracy": "92.0%", "type": "Object", "active": True},
    {"id": "2", "name": "Model 2", "model_info": "Model 2 info", "accuracy": "95.0%", "type": "Model 2 type", "active": True},
]

output_configurations = {
    "storage": ["Local Storage", "Cloud Storage", "Network Storage"],
    "format": ["JSON", "CSV", "XML"],
    "current_output_configurations": ["Local Storage", "JSON"],
}

OUTPUT_FRAME_DIR = "output_frame"
image_websockets = set()

def clear_output_folder():
    """Deletes all existing images in the output_frame folder before starting a new process."""
    global image_websockets
    if os.path.exists(OUTPUT_FRAME_DIR):
        for file in os.listdir(OUTPUT_FRAME_DIR):
            file_path = os.path.join(OUTPUT_FRAME_DIR, file)
            if os.path.isfile(file_path) and file.endswith(".jpg"):
                os.remove(file_path)
    image_websockets


@app.post("/clear-frames")
async def clear_frames():
    """Clear the output frame directory before processing a new video."""
    clear_output_folder()
    return {"message": "Old frames cleared"}


async def broadcast_images():
    """Continuously sends images every 5th frame via WebSocket and deletes after sending."""
    while True:
        if image_websockets:
            try:
                images = sorted(
                    [f for f in os.listdir(OUTPUT_FRAME_DIR) if f.endswith(".jpg")],
                    key=lambda x: int(x.split("_")[1].split(".")[0])  # Extract frame number
                )

                for image in images:
                    image_path = os.path.join(OUTPUT_FRAME_DIR, image)

                    # Read image as base64
                    with open(image_path, "rb") as img_file:
                        base64_image = base64.b64encode(img_file.read()).decode("utf-8")

                    # Send image to all active WebSockets
                    for ws in list(image_websockets):
                        try:
                            await ws.send_json({"frame": image, "image_data": base64_image})
                        except Exception:
                            image_websockets.remove(ws)  # Remove disconnected clients

                    # Remove the image after sending
                    os.remove(image_path)

                    await asyncio.sleep(0.2)  # Adjust delay if needed

            except Exception as e:
                print(f"Error streaming images: {e}")

        await asyncio.sleep(0.3)  # Check periodically

@app.websocket("/ws/live-images/")
async def websocket_images(websocket: WebSocket):
    """WebSocket endpoint for streaming images every 5 frames."""
    await websocket.accept()
    image_websockets.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        image_websockets.remove(websocket)

# Start background WebSocket image streaming
@app.on_event("startup")
async def start_image_broadcast():
    """Clears old images and starts image broadcasting in a background thread."""
    clear_output_folder()  # Clear old images before starting
    asyncio.create_task(broadcast_images())


# Ensure CSV file exists with headers
if not os.path.exists(data_file):
    with open(data_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Frame", "Number of Persons","Total Dwell Time"])

# Load the initial last row from CSV
def load_initial_last_row():
    global last_sent_row
    try:
        with open(data_file, "r") as f:
            reader = csv.DictReader(f)
            data = list(reader)
            if data:
                last_sent_row = data[-1]
    except Exception as e:
        print(f"Error loading initial row: {e}")

# WebSocket Broadcasting Function
async def broadcast_csv_updates():
    global last_sent_row
    while True:
        if active_websockets:
            try:
                if os.path.exists(data_file) and os.path.getsize(data_file) > 0:
                    with open(data_file, "r") as f:
                        reader = csv.DictReader(f)
                        data = list(reader)

                    if data:
                        latest_data = data[-1]
                        if latest_data != last_sent_row:
                            message = {"data": {"frame": latest_data["Frame"], "person_count": latest_data["Number of Persons"],"Total_Dwell_Time":latest_data["Total Dwell Time"]}}

                            stale_websockets = set()
                            for ws in list(active_websockets):
                                try:
                                    await ws.send_json(message)
                                except Exception:
                                    stale_websockets.add(ws)

                            for ws in stale_websockets:
                                active_websockets.remove(ws)

                            last_sent_row = latest_data

            except Exception as e:
                print(f"Error reading CSV: {e}")

        await asyncio.sleep(0.3)

# WebSocket Endpoint
@app.websocket("/ws/live-data/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)

    try:
        while True:
            await asyncio.sleep(1)
    except:
        pass
    finally:
        active_websockets.remove(websocket)

# Startup Event
@app.on_event("startup")
async def start_background_tasks():
    load_initial_last_row()
    asyncio.create_task(broadcast_csv_updates())


# Models Endpoint
@app.get("/models", response_model=List[dict])
def get_models():
    return models

# Rules Endpoint
@app.get("/rules", response_model=List[dict])
def get_rules():
    return rules

# Update Rules Endpoint
@app.put("/rules/update", response_model=Dict[str, str])
def update_rule(updated_rules: List[Dict]):
    for updated_rule in updated_rules:
        rule_id = updated_rule["id"]
        rule_found = False

        for rule in rules:
            if rule["id"] == rule_id:
                rule.update(updated_rule)
                rule_found = True
                break

        if not rule_found:
            raise HTTPException(status_code=404, detail=f"Rule with ID {rule_id} not found")

    return {"message": "Rules updated successfully"}

# Update Models Endpoint
@app.put("/models/update", response_model=Dict[str, str])
def update_model(updated_models: List[Dict]):
    for updated_model in updated_models:
        model_id = updated_model["id"]
        model_found = False

        for model in models:
            if model["id"] == model_id:
                model.update(updated_model)
                model_found = True
                break

        if not model_found:
            raise HTTPException(status_code=404, detail=f"Model with ID {model_id} not found")

    return {"message": "Models updated successfully"}

# RectangleCoords Model
class RectangleCoords(BaseModel):
    p1: list[float]
    p2: list[float]
    p3: list[float]
    p4: list[float]

# Set ROI Coordinates
@app.post("/process_rectangle/")
async def process_rectangle(coords: RectangleCoords):
    global roi_coordinates
    roi_coordinates = {
        "p1": coords.p1,
        "p2": coords.p2,
        "p3": coords.p3,
        "p4": coords.p4
    }
    print(roi_coordinates)
    return {"message": "ROI coordinates received successfully", "roi_coordinates": roi_coordinates}

# Save Outputs Function
def save_outputs():
    try:
        global processed_results  
        if not processed_results:
            raise HTTPException(status_code=404, detail="No processed results found")

        output_data = {"process_video_output": processed_results}
        save_path = "./output.json"

        with open(save_path, "w") as json_file:
            json.dump(output_data, json_file)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-video/")
async def process_uploaded_video(
    file: UploadFile = File(...), 
    save_output: str = Query(..., alias="save_output")
):
    global roi_coordinates
    if roi_coordinates is None:
        raise HTTPException(status_code=400, detail="ROI coordinates have not been set.")

    roi_list = [roi_coordinates["p1"], roi_coordinates["p2"], roi_coordinates["p4"], roi_coordinates["p3"]]
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    input_video_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save the uploaded file
    with open(input_video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detection_rule = next((rule for rule in rules if rule["id"] == "1"), None)
    if not detection_rule:
        raise HTTPException(status_code=404, detail="Person Detection rule not found")

    detection_threshold = detection_rule["threshold"]

    # Get the event loop and run the processing function in a separate thread
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, process_video, input_video_path, detection_threshold, roi_list)

    if result is None:
        raise HTTPException(status_code=400, detail="Failed to process video.")

    output_video_path, people_count, total_dwell_time = result

    # Store processed results
    processed_results.update({
        "output_video": output_video_path,
        "people_count": people_count,
        "duration_rate": f"{int(total_dwell_time)} s"
    })

    # Save results if requested
    if save_output.lower() == "true":
        with open("output.json", "w") as json_file:
            json.dump({"process_video_output": processed_results}, json_file)

    # Remove input video after processing
    if os.path.exists(input_video_path):
        os.remove(input_video_path)

    return processed_results



# GET output configurations
@app.get("/output_configurations", response_model=Dict[str, List[str]])
def get_output_configurations():
    """
    Returns a dict of output configurations with keys name storage and format both containing list of options.
    """
    return output_configurations


# PUT output configurations
@app.put("/output_configurations/update", response_model=Dict[str, str])
def update_output_configurations(updated_output_configurations: List[str]):
    """
    Updates the current_output_configurations with the provided storage and format values in output_configurations dict.
    """
    if len(updated_output_configurations) != 2:
        return {"error": "Invalid input, must be an array of exactly two elements."}

    output_configurations["current_output_configurations"] = updated_output_configurations
    save_outputs()
    return {"message": "Output Configurations updated successfully"}


def generate_video_frames(video_path: str):
    cap = cv2.VideoCapture(video_path)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Here, you could also apply detection/processing to the frame
        # Encode the frame as JPEG
        _, jpeg = cv2.imencode(".jpg", frame)
        yield jpeg.tobytes()

    cap.release()


@app.get("/video-stream/")
async def video_stream():
    video_path = "output_videos/output_video_v1.mp4"  # The path to your processed video
    return StreamingResponse(generate_video_frames(video_path), media_type="multipart/x-mixed-replace; boundary=frame")