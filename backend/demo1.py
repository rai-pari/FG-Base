from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import json
import os
import uuid
from services.tracking import process_video
import shutil
from typing import List, Dict
from uuid import uuid4

UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create FastAPI app instance
app = FastAPI(
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # "http://localhost:5173"
    allow_credentials=True,
    allow_methods=["*"],  # ["GET", "POST", "PUT"]
    allow_headers=["*"],
)

# Dummy data storage
rules = [
    {
        "id": "2",
        "rule": "Rule 2",
        "type": "NONE",
        "threshold": 62,
        "enabled": True,
    },
    {
        "id": "1",
        "rule": "Person Detection",
        "type": "object",
        "threshold": 70,
        "enabled": True,
    }
]

models = [
    {
        "id": "1",
        "name": "YOLOv8",
        "model_info": "General object detection model",
        "accuracy": "92.0%",
        "type": "Object",
        "active": True
    },
    {
        "id": "2",
        "name": "Model 2",
        "model_info": "Model 2 info",
        "accuracy": "95.0%",
        "type": "Model 2 type",
        "active": True
    },
    {
        "id": "3",
        "name": "Model 3",
        "model_info": "Model 3 info",
        "accuracy": "93.0%",
        "type": "Model 3 type",
        "active": True
    },
    {
        "id": "4",
        "name": "Model 4",
        "model_info": "Model 4 info",
        "accuracy": "98.0%",
        "type": "Model 4 type",
        "active": True
    },
    {
        "id": "5",
        "name": "Model 5",
        "model_info": "Model 5 info",
        "accuracy": "88.0%",
        "type": "Model 5 type",
        "active": True
    }
]

output_configurations = {
    "storage": [
        "Local Storage",
        "Cloud Storage",
        "Network Storage",
    ],
    "format": [
        "JSON",
        "CSV",
        "XML",
    ],
    "current_output_configurations": ["Local Storage", "JSON"]
}

processed_results = {}

# Store ROI coordinates globally
roi_coordinates = None

UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# /models endpoint
@app.get("/models", response_model=List[dict])
def get_models():
    """
    Returns a list of dummy detection models with unique IDs and details.
    """
    return models


# /rules endpoint
@app.get("/rules", response_model=List[dict])
def get_rules():
    """
    Returns a list of processing rules with unique IDs and details.
    """
    return rules


@app.put("/rules/update", response_model=Dict[str, str])
def update_rule(updated_rules: List[Dict]):
    """
    Updates multiple processing rules based on the provided unique IDs.
    """
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

    return {"message": "Rule updated successfully"}


@app.put("/models/update", response_model=Dict[str, str])
def update_model(updated_models: List[Dict]):
    """
    Updates multiple processing models based on the provided unique IDs.
    """
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

    return {"message": "Model updated successfully"}


def save_outputs():
    try:
        global processed_results  # Declare the global variable
        if not processed_results:
            raise HTTPException(status_code=404, detail="No processed results found")

        # Combine outputs into a JSON object
        output_data = {
            "process_video_output": processed_results
        }

        # Define the save path for JSON
        save_path = "./output.json"

        # Save to local storage
        with open(save_path, "w") as json_file:
            json.dump(output_data, json_file)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# RectangleCoords model
class RectangleCoords(BaseModel):
    p1: list[float]  # [x1, y1]
    p2: list[float]  # [x2, y2]
    p3: list[float]  # [x3, y3]
    p4: list[float]  # [x4, y4]

@app.post("/process_rectangle/")
async def process_rectangle(coords: RectangleCoords):
    global roi_coordinates
    roi_coordinates = {
        "p1": coords.p1,
        "p2": coords.p2,
        "p3": coords.p3,
        "p4": coords.p4
    }
    
    print("ROI Coordinates stored:", roi_coordinates)
    
    return {"message": "ROI coordinates received successfully", "roi_coordinates": roi_coordinates}

@app.post("/process-video/")
async def process_uploaded_video(
    file: UploadFile = File(...), 
    save_output: str = Query(..., alias="save_output")
):
    global roi_coordinates

    # Ensure ROI coordinates are available before processing
    if roi_coordinates is None:
        raise HTTPException(status_code=400, detail="ROI coordinates have not been set. Call /process_rectangle first.")

    # Convert dictionary to a list of lists
    roi_list = [roi_coordinates["p1"], roi_coordinates["p2"], roi_coordinates["p4"], roi_coordinates["p3"]]
    print("ROI Coordinates received:", roi_list)

    # Generate a unique file name
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    input_video_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save uploaded video
    with open(input_video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Retrieve the person detection threshold
    detection_rule = next((rule for rule in rules if rule["id"] == "1"), None)
    if not detection_rule:
        raise HTTPException(status_code=404, detail="Person Detection rule not found")

    detection_threshold = detection_rule["threshold"]

    # Process the video with updated ROI coordinates
    result = process_video(input_video_path, detection_threshold, roi_list)
    if result is None:
        raise HTTPException(status_code=400, detail="Failed to process video. Check video format or path.")

    output_video_path, people_count, total_dwell_time = result

    # Store results temporarily
    global processed_results
    processed_results = {
        "output_video": output_video_path,
        "people_count": people_count,
        "duration_rate": f"{int(total_dwell_time)} s"
    }

    if save_output == 'true':
        save_outputs()

    # Remove input video after processing
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
