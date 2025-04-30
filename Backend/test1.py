from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import os, cv2
import shutil
import uuid
import multiprocessing
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List, Dict
import pandas as pd
import json
import time
import asyncio
import traceback
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from services.tracking import process_video
from services.usecase1 import process_video1, stop_yolo1
from services.usecase2 import process_video2, stop_yolo2
from services.usecase3 import process_video3, stop_yolo3
from services.usecase4 import process_video4, stop_yolo4
from services.code1 import process_video_helmet
from services.code2 import process_video_speed
from services.code3 import process_video_ppe
from services.code4 import process_video_intrusion
from services.code5 import process_video_crowd
from services.code6 import process_video_tamper
from dbconn import get_mongo_client, get_collection, get_collection1,get_collection2,get_collection3,get_collection4,get_collection5,get_collection6,get_collection7,get_collection8,get_collection9,get_collection10,set_mongo_client

app = FastAPI()
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session-specific result queues
result_queues = {}
processes = {}
client = None
db = None

# Store processing status
processing_status = {}
frame_counters = {}

# ROI coordinates (hardcoded for now)
roi_coordinates = {
    "p1": [291, 353],
    "p2": [572, 353],
    "p3": [291, 738],
    "p4": [572, 738]
}

# Current selected industry (default is None)
current_industry = None

# Industry-specific models and rules
industry_data = {
    "industry1": {
        "name": "Retail Analytics",
        "models": [
            {"id": "1", "name": "Person Detection", "model_info": "General Person detection model", "accuracy": "92.0%", "type": "Object", "active": True},
            {"id": "2", "name": "Person Detection1", "model_info": "General Person detection model1", "accuracy": "92.0%", "type": "Object", "active": True}
        ],
        "rules": [
            {"id": "1", "rule": "Person count", "type": "object", "threshold": 70, "enabled": True},
            {"id": "2", "rule": "Dwell Time", "type": "object", "threshold": 70, "enabled": True},
            {"id": "3", "rule": "Dwell Time1", "type": "object1", "threshold": 70, "enabled": True},
        ]
    },
    "industry2": {
        "name": "Manufacturing",
        "models": [
            {"id": "1", "name": "Crate Count", "model_info": "General Crate detection model", "accuracy": "92.0%", "type": "Crates", "active": True},
            {"id": "2", "name": "Spillage Detection", "model_info": "General Spillage Detection Model", "accuracy": "93.0%", "type": "Milk", "active": True},
            {"id": "3", "name": "Conveyor Belt Crate Count", "model_info": "General Crate count Model", "accuracy": "95.0%", "type": "Crates", "active": True},
        ],
        "rules": [
            {"id": "1", "rule": "Crate Count", "type": "object", "threshold": 70, "enabled": True},
            {"id": "2", "rule": "Milk Spillage", "type": "milk", "threshold": 70, "enabled": True},
            {"id": "3", "rule": "Milk Wastage", "type": "milk", "threshold": 70, "enabled": True},
            {"id": "4", "rule": "Conveyor Belt Crate Count", "type": "object", "threshold": 70, "enabled": True},
        ]
    },
    "industry3": {
        "name": "Textile",
        "models": [
            {"id": "1", "name": "Vehicle Speed Monitoring", "model_info": "General Speed Monitoring model", "accuracy": "92.0%", "type": "Crates", "active": True},
            {"id": "2", "name": "Safety Detection", "model_info": "General Safety Detection Model", "accuracy": "93.0%", "type": "Milk", "active": True},
            {"id": "3", "name": "Intrusion Detection", "model_info": "General Intrusion Detection Model", "accuracy": "95.0%", "type": "Crates", "active": True},
            {"id": "4", "name": "Crowd Detection", "model_info": "General Crowd Detection Model", "accuracy": "95.0%", "type": "Crates", "active": True},
            {"id": "5", "name": "Camera Tempering", "model_info": "General Camera Tempering Model", "accuracy": "95.0%", "type": "Crates", "active": True},
            
        ],
        "rules": [
            {"id": "1", "rule": "Speed", "type": "Speed", "threshold": 70, "enabled": True},
            {"id": "2", "rule": "Helmet", "type": "Safety", "threshold": 10, "enabled": True},
            {"id": "3", "rule": "PPE", "type": "Safety", "threshold": 10, "enabled": True},
            {"id": "4", "rule": "Intrusion", "type": "Alert", "threshold": 50, "enabled": True},
            {"id": "5", "rule": "Crowd", "type": "Alert", "threshold": 60, "enabled": True},
            {"id": "6", "rule": "Camera Tampering", "type": "Alert", "threshold": 60, "enabled": True},
            
        ]
    }
}

# Industry Selection Endpoint
@app.post("/select-industry/{industry_id}")
def select_industry(industry_id: str):
    global current_industry
    if industry_id not in industry_data:
        raise HTTPException(status_code=404, detail=f"Industry with ID {industry_id} not found")
    
    current_industry = industry_id
    return {
        "message": f"Industry {industry_data[industry_id]['name']} selected successfully",
        "industry_id": industry_id,
        "industry_name": industry_data[industry_id]['name']
    }

# Get current industry
@app.get("/current-industry")
def get_current_industry():
    if not current_industry:
        raise HTTPException(status_code=404, detail="No industry currently selected")
    
    return {
        "industry_id": current_industry,
        "industry_name": industry_data[current_industry]['name'],
        "models_count": len(industry_data[current_industry]['models']),
        "rules_count": len(industry_data[current_industry]['rules'])
    }

# Get available industries
@app.get("/industries")
def get_industries():
    return [
        {"id": "industry1", "name": industry_data["industry1"]["name"]},
        {"id": "industry2", "name": industry_data["industry2"]["name"]},
        {"id": "industry3", "name": industry_data["industry3"]["name"]}
    ]

# Models Endpoint
@app.get("/models", response_model=List[dict])
def get_models():
    if not current_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    return industry_data[current_industry]["models"]

# Rules Endpoint
@app.get("/rules", response_model=List[dict])
def get_rules():
    if not current_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    return industry_data[current_industry]["rules"]

# Update Rules Endpoint
@app.put("/rules/update", response_model=Dict[str, str])
def update_rule(updated_rules: List[Dict]):
    if not current_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    for updated_rule in updated_rules:
        rule_id = updated_rule["id"]
        rule_found = False
        for rule in industry_data[current_industry]["rules"]:
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
    if not current_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    for updated_model in updated_models:
        model_id = updated_model["id"]
        model_found = False
        for model in industry_data[current_industry]["models"]:
            if model["id"] == model_id:
                model.update(updated_model)
                model_found = True
                break
        if not model_found:
            raise HTTPException(status_code=404, detail=f"Model with ID {model_id} not found")
    return {"message": "Models updated successfully"}

# Get Rules by Model ID Endpoint
@app.get("/rules/by-model/{model_id}", response_model=List[dict])
def get_rules_by_model(industry:str,model_id: str):
    if not current_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    # Mapping of model IDs to their corresponding rule IDs for each industry
    model_rule_mapping = {
        "industry1": {
            "1": ["1", "2"],
            "2":["3"]  # Person Detection - Person count and Dwell Time
        },
        "industry2": {
            "1": ["1"],       # Crate Count
            "2": ["2", "3"],  # Spillage Detection - Milk Spillage and Milk Wastage
            "3": ["4"]        # Conveyor Belt Crate Count
        },
        "industry3": {
            "1": ["1"],       # Crate Count
            "2": ["2", "3"],  # Spillage Detection - Milk Spillage and Milk Wastage
            "3": ["4"], 
            "4": ["5"],
            "5":["6"]            # Conveyor Belt Crate Count

        }
    }
    
    # Check if model_id exists in mapping for current industry
    if model_id not in model_rule_mapping[industry]:
        raise HTTPException(status_code=404, detail=f"Model with ID {model_id} not found in current industry")
    
    # Get the rule IDs associated with this model
    rule_ids = model_rule_mapping[industry][model_id]
    
    # Filter rules based on the mapped rule IDs
    filtered_rules = [rule for rule in industry_data[industry]["rules"] if rule["id"] in rule_ids]
    
    if not filtered_rules:
        raise HTTPException(status_code=404, detail=f"No rules found for model ID {model_id}")
    
    return filtered_rules

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan handlers
@app.on_event("startup")
async def startup_event():
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown_event():
    global processes
    logger.info("Starting application shutdown")
    for session_id, process in list(processes.items()):
        if process.is_alive():
            process.terminate()
            process.join(timeout=5)
            if process.is_alive():
                logger.warning(f"Force terminating process for session {session_id}")
                process.kill()
        time.sleep(10)
        cleanup(session_id)
    processes.clear()
    logger.info("Application shut down completed")

# CSV File Monitoring for all rules
class CSVHandler(FileSystemEventHandler):
    def __init__(self, session_id, queue, rule_id, industry_id):
        self.session_id = session_id
        self.queue = queue
        self.rule_id = rule_id
        self.industry_id = industry_id
        self.last_line_count = 0  # Track how many lines we've read
        self.update_interval = 0.5  # Seconds between updates
        self.last_update_time = time.time()
        self.all_data = []

    def on_modified(self, event):
        # CSV file map by industry and rule
        csv_file_maps = {
            "industry1": {
                "1": f"person_count_by_frames_{self.session_id}.csv",  # Person count
                "2": f"person_count_by_frames_{self.session_id}.csv"   # Dwell Time (uses same file)
            },
            "industry2": {
                "1": f"crate_count_by_frames_{self.session_id}.csv",         # Crate Count
                "2": f"milk_spillage_by_frames_{self.session_id}.csv",       # Milk Spillage
                "3": f"milk_wastage_by_frames_{self.session_id}.csv",        # Milk Wastage
                "4": f"conveyor_crate_count_by_frames_{self.session_id}.csv", # Conveyor Belt Crate Count
            },
            "industry3": {
                "1": f"speed_monitoring_by_frames_{self.session_id}.csv",         # Crate Count
                "2": f"helmet_safety_by_frames_{self.session_id}.csv",       # Milk Spillage
                "3": f"safety_detection_by_frames_{self.session_id}.csv",        # Milk Wastage
                "4": f"intrusion_detection_{self.session_id}.csv" ,
                "5": f"crowd_monitoring_{self.session_id}.csv",      # Conveyor Belt Crate Count
                "6": f"camera_tampering_{self.session_id}.csv" 
            }
        }
        
        expected_csv = csv_file_maps.get(self.industry_id, {}).get(self.rule_id)
        if expected_csv and event.src_path.endswith(expected_csv):
            current_time = time.time()
            # Throttle updates to reduce frontend load
            if current_time - self.last_update_time < self.update_interval:
                return
                
            self.last_update_time = current_time
            
            try:
                if not os.path.exists(event.src_path):
                    return
                    
                # Directly read the file instead of using pandas for better incremental processing
                with open(event.src_path, 'r') as file:
                    lines = file.readlines()
                
                # If no new lines, skip processing
                if len(lines) <= self.last_line_count:
                    return
                
                # Get header line
                header = lines[0].strip().split(',')
                
                # Process only new lines
                new_lines = lines[self.last_line_count:]
                if self.last_line_count == 0:
                    # Skip header on first read
                    new_lines = new_lines[1:]
                
                # Process the new data
                new_data = []
                for line in new_lines:
                    if line.strip():  # Skip empty lines
                        values = line.strip().split(',')
                        # Create dict from header and values
                        row_data = {header[i]: values[i] for i in range(min(len(header), len(values)))}
                        new_data.append(row_data)
                
                # Remember how many lines we've processed
                self.last_line_count = len(lines)
                
                # Add new data to our overall collection
                self.all_data.extend(new_data)
                
                # Only send summary to frontend
                if new_data:
                    # Send only the most recent data point and summary info
                    update = {
                        "session_id": self.session_id,
                        "latest_data": new_data[-1],  # Most recent data point
                        "new_points_count": len(new_data),
                        "total_points": len(self.all_data),
                        "is_final": False
                    }
                    self.queue.put(json.dumps(update))
                    logger.info(f"Sent update for session {self.session_id}: {len(new_data)} new points, {len(self.all_data)} total")
                    
            except Exception as e:
                logger.error(f"Error processing CSV update for session {self.session_id}: {str(e)}")
                logger.error(traceback.format_exc())

    def send_final_data(self):
        # Only send the final data if we have something to send
        if self.all_data:
            final_data = {
                "session_id": self.session_id,
                "all_data": self.all_data,
                "data_point_count": len(self.all_data),
                "is_final": True
            }
            self.queue.put(json.dumps(final_data))
            logger.info(f"Sent final data for session {self.session_id}: {len(self.all_data)} total points")

# CSV monitoring management
observers = {}
completed_cleanups = set()

def start_csv_monitoring(session_id, rule_id, industry_id):
    queue = multiprocessing.Queue()
    path = os.path.join(os.getcwd(), "csv_files")
    os.makedirs(path, exist_ok=True)
    event_handler = CSVHandler(session_id, queue, rule_id, industry_id)
    observer = Observer()
    observer.schedule(event_handler, path=path, recursive=False)
    observer.start()
    observers[session_id] = (observer, queue, event_handler)
    frame_counters[session_id] = 0
    logger.info(f"Started CSV monitoring for session {session_id} with rule {rule_id} in industry {industry_id}")

def stop_csv_monitoring(session_id):
    if session_id in observers:
        observer, queue, handler = observers.pop(session_id)
        try:
            handler.send_final_data()
            time.sleep(2)
            observer.stop()
            observer.join(timeout=5)
            if observer.is_alive():
                logger.warning(f"Force stopping observer for session {session_id}")
                observer._thread.terminate()
            while not queue.empty():
                queue.get()
            queue.close()
            queue.join_thread()
            logger.info(f"Successfully stopped CSV monitoring for session {session_id}")
        except Exception as e:
            logger.error(f"Error stopping CSV monitoring for session {session_id}: {str(e)}")
            logger.error(traceback.format_exc())

def cleanup(session_id):
    if session_id in completed_cleanups:
        logger.info(f"Cleanup already completed for session {session_id}")
        return

    logger.info(f"Starting cleanup for session {session_id}")
    processing_status[session_id] = "completing"
    
    stop_csv_monitoring(session_id)
    time.sleep(10)

    completed_cleanups.add(session_id)
    processing_status[session_id] = "complete"

    paths_to_remove = [
        os.path.join("uploads", f"{session_id}.mp4"),
        os.path.join("csv_files", f"person_count_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"crate_count_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"milk_spillage_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"milk_wastage_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"conveyor_crate_count_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"helmet_safety_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"speed_monitoring_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"safety_detection_by_frames_{session_id}.csv"),
        os.path.join("csv_files", f"intrusion_detection_{session_id}.csv"),
        os.path.join("csv_files", f"crowd_monitoring_{session_id}.csv"),
        os.path.join("csv_files", f"camera_tampering_{session_id}.csv"),
        os.path.join("csv_files", f"id_by_dwell_time_{session_id}.csv"),
    ]

    for path in paths_to_remove:
        if os.path.exists(path):
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    if os.path.isdir(path):
                        shutil.rmtree(path)
                        logger.info(f"Successfully deleted directory: {path}")
                    else:
                        os.remove(path)
                        logger.info(f"Successfully deleted file: {path}")
                    break
                except PermissionError as pe:
                    logger.warning(f"Permission denied deleting {path} (attempt {attempt + 1}/{max_retries}): {str(pe)}")
                    time.sleep(10)
                except Exception as e:
                    logger.error(f"Error deleting {path} (attempt {attempt + 1}/{max_retries}): {str(e)}")
                    logger.error(traceback.format_exc())
                    time.sleep(10)
            else:
                logger.error(f"Failed to delete {path} after {max_retries} attempts - file may still be in use")
        else:
            logger.debug(f"Path not found for cleanup: {path}")

    logger.info(f"Cleanup completed for session {session_id}")

def process_task(session_id, video_path, rule_id, threshold, roi_data, queue, mongo_credentials, industry_id):
    logger.info(f"Processing started for session {session_id} with rule ID {rule_id} in industry {industry_id}")
    processing_status[session_id] = "processing"

    rule = next((r for r in industry_data[industry_id]["rules"] if r["id"] == rule_id), None)
    if not rule:
        queue.put({"session_id": session_id, "status": "error", "message": "Rule not found"})
        return

    rule_name = rule["rule"]
    try:
        # Industry 1 rules
        if industry_id == "industry1":
            if rule_name == "Person count" or rule_name == "Dwell Time":
                output_path, person_count, total_dwell_time = process_video(
                    session_id, video_path, threshold, roi_data, mongo_credentials
                )
                result = {"output_path": output_path, "person_count": person_count, "total_dwell_time": total_dwell_time}
            else:
                queue.put({"session_id": session_id, "status": "error", "message": "Unsupported rule for Industry 1"})
                return
        
        # Industry 2 rules
        elif industry_id == "industry2":
            if rule_name == "Crate Count":
                roi_box_count, total_crates = process_video1(session_id, video_path, mongo_credentials)
                result = {"roi_box_count": roi_box_count, "total_crates": total_crates}
            elif rule_name == "Milk Spillage":
                white_percentage, detection_start_time_str, total_detection_time = process_video2(session_id, video_path, mongo_credentials)
                result = {
                    "white_percentage": white_percentage,
                    "detection_start_time": detection_start_time_str,
                    "total_detection_time": total_detection_time
                }
            elif rule_name == "Milk Wastage":
                white_percentage, detection_start_time_str = process_video3(session_id, video_path, mongo_credentials)
                result = {"white_percentage": white_percentage, "detection_start_time": detection_start_time_str}
            elif rule_name == "Conveyor Belt Crate Count":
                box_count = process_video4(session_id, video_path, mongo_credentials)
                result = {"box_count": box_count}
            else:
                queue.put({"session_id": session_id, "status": "error", "message": "Unsupported rule for Industry 2"})
                return
        
        elif industry_id == "industry3":
            if rule_name == "Speed":
                normal_count, medium_count, overspeed_count = process_video_speed(session_id, video_path, threshold, mongo_credentials)
                result = {"normal_count": normal_count,"medium_count": medium_count, "overspeed_count": overspeed_count}

            elif rule_name == "Helmet" :
                safe_count, unsafe_count= process_video_helmet(
                    session_id, video_path, threshold, mongo_credentials
                )
                result = {"safe_count": safe_count, "unsafe_count": unsafe_count}
            elif rule_name == "PPE" :
                safe_count, unsafe_count= process_video_ppe(
                    session_id, video_path, threshold, mongo_credentials
                )
                result = {"safe_count": safe_count, "unsafe_count": unsafe_count}
            elif rule_name == "Intrusion" :
                intrusion_time_sec,max_persons_in_roi = process_video_intrusion(
                    session_id, video_path,threshold,roi_data, mongo_credentials
                )
                result = {"intrusion_time_sec": intrusion_time_sec,"max_persons_in_roi":max_persons_in_roi}
            elif rule_name == "Crowd" :
                detection_start_time, detection_duration = process_video_crowd(
                    session_id, video_path,threshold,roi_data, mongo_credentials
                )
                result = {"detection_start_time": detection_start_time,"detection_duration":detection_duration}
            elif rule_name == "Camera Tampering" :
                detection_type, detection_start_time_str, total_detection_time = process_video_tamper(
                    session_id, video_path,mongo_credentials
                )
                result = {"detection_type":detection_type,"detection_start_time":  detection_start_time_str,"total_detection_time":total_detection_time}
            else:
                queue.put({"session_id": session_id, "status": "error", "message": "Unsupported rule for Industry 1"})
                return

        else:
            queue.put({"session_id": session_id, "status": "error", "message": "Invalid industry"})
            return

        processing_status[session_id] = "results_ready"
        queue.put({"session_id": session_id, **result, "status": "completed"})
        logger.info(f"Processing complete for session {session_id}")

    except Exception as e:
        queue.put({"session_id": session_id, "status": "error", "message": str(e)})
        logger.error(f"Error processing session {session_id}: {str(e)}")
        logger.error(traceback.format_exc())

    finally:
        stop_csv_monitoring(session_id)
        time.sleep(10)
        cleanup(session_id)

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

@app.post("/process-video/")
async def upload_video(file: UploadFile = File(...), rule_id: str = "1"):
    global roi_coordinates, result_queues, processes, mongo_credentials, current_industry

    if not current_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    if roi_coordinates is None:
        raise HTTPException(status_code=400, detail="ROI coordinates have not been set.")
    if mongo_credentials is None:
        raise HTTPException(status_code=500, detail="MongoDB is not connected. Please connect first.")

    detection_rule = next((rule for rule in industry_data[current_industry]["rules"] if rule["id"] == rule_id), None)
    if not detection_rule:
        raise HTTPException(status_code=404, detail=f"Rule with ID {rule_id} not found in the current industry")

    roi_list = [roi_coordinates["p1"], roi_coordinates["p2"], roi_coordinates["p4"], roi_coordinates["p3"]]
    session_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    video_filename = f"{session_id}.{file_extension}"
    video_path = os.path.join(UPLOAD_FOLDER, video_filename)

    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detection_threshold = detection_rule.get("threshold", None)
    queue = multiprocessing.Queue()
    result_queues[session_id] = queue

    process = multiprocessing.Process(
        target=process_task,
        args=(session_id, video_path, rule_id, detection_threshold, roi_list, queue, mongo_credentials, current_industry)
    )
    process.start()
    processes[session_id] = process
    start_csv_monitoring(session_id, rule_id, current_industry)
    processing_status[session_id] = "started"
    #print(session_id, video_path, rule_id, detection_threshold, roi_list, queue, mongo_credentials, current_industry)

    return {
        "message": "Processing started", 
        "session_id": session_id,
        "rule_id": rule_id,
        "industry": current_industry
    }

@app.get("/stream-live-data/{session_id}")
async def stream_live_data(session_id: str):
    async def event_stream():
        if session_id not in observers:
            yield f"data: {json.dumps({'error': 'Session ID not found'})}\n\n"
            return
            
        _, queue, _ = observers[session_id]
        data_sent = 0
        all_data = []
        
        while True:
            if session_id in completed_cleanups or (session_id in processing_status and processing_status[session_id] == "complete"):
                if all_data:
                    final_message = {
                        'session_id': session_id,
                        'status': 'completed',
                        'message': 'Live data stream completed',
                        'data_points_sent': data_sent,
                        'all_data': all_data,
                        'is_final': True
                    }
                    yield f"data: {json.dumps(final_message)}\n\n"
                else:
                    yield f"data: {json.dumps({'session_id': session_id, 'status': 'completed', 'message': 'Live data stream completed', 'data_points_sent': data_sent, 'is_final': True})}\n\n"
                break
                
            if not queue.empty():
                result = queue.get()
                result_obj = json.loads(result)
                
                if 'is_final' in result_obj and result_obj['is_final']:
                    yield f"data: {result}\n\n"
                    break
                
                data_sent += 1
                if 'data' in result_obj:
                    all_data.append(result_obj['data'])
                yield f"data: {result}\n\n"
            await asyncio.sleep(0.2)
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/stream-results/{session_id}")
async def stream_results(session_id: str):
    async def event_stream():
        if session_id not in result_queues:
            yield f"data: {json.dumps({'error': 'Session ID not found'})}\n\n"
            return

        while True:
            if not result_queues[session_id].empty():
                result = result_queues[session_id].get()
                if isinstance(result, dict):
                    if "status" not in result:
                        result["status"] = "completed"
                    if "message" not in result:
                        result["message"] = "Processing completed successfully"
                    if "is_final" not in result:
                        result["is_final"] = True
                yield f"data: {json.dumps(result)}\n\n"
                break
            
            if session_id in processes and not processes[session_id].is_alive() and result_queues[session_id].empty():
                yield f"data: {json.dumps({'session_id': session_id, 'status': 'error', 'message': 'Processing ended without results', 'is_final': True})}\n\n"
                break
                    
            await asyncio.sleep(0.2)

    return StreamingResponse(event_stream(), media_type="text/event-stream")

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
    

# Pydantic models for response structure
class Rule(BaseModel):
    id: str
    rule: str

class Industry(BaseModel):
    name: str
    rules: List[Rule]


# Pydantic models for response structure
class Rule(BaseModel):
    id: str
    rule: str

class Industry(BaseModel):
    name: str
    rules: List[Rule]

class IndustryInfo(BaseModel):
    id: str
    name: str

# Sample industry_dbdata
industry_dbdata = {
    "industry1": {
        "name": "Retail Analytics",
        "rules": [
            {"id": "1", "rule": "Product Rule"}
        ]
    },
    "industry2": {
        "name": "Manufacturing",
        "rules": [
            {"id": "1", "rule": "Crate Count"},
            {"id": "2", "rule": "Milk Spillage"},
            {"id": "3", "rule": "Milk Wastage"},
            {"id": "4", "rule": "Conveyor Belt Crate Count"}
        ]
    },
    "industry3": {
        "name": "Textile",
        "rules": [
            {"id": "1", "rule": "Speed"},
            {"id": "2", "rule": "Helmet"},
            {"id": "3", "rule": "PPE"},
            {"id": "4", "rule": "Intrusion"},
            {"id": "5", "rule": "Crowd"},
            {"id": "6", "rule": "Camera Tampering"}
        ]
    }
}

@app.get("/dbindustries", response_model=List[IndustryInfo])
async def get_industries():
    """
    Returns a list of available industries with their IDs and names.
    
    Returns:
    - List of dictionaries containing industry IDs and names.
    """
    return [
        {"id": industry_id, "name": details["name"]}
        for industry_id, details in industry_dbdata.items()
    ]

@app.get("/dbindustry_rules/{industry_id}", response_model=List[Rule])
async def get_industry_rules(industry_id: str):
    """
    Returns the rules for the specified industry.
    
    Parameters:
    - industry_id: The industry identifier (e.g., industry1, industry2, industry3)
    
    Returns:
    - List of rules for the specified industry.
    
    Raises:
    - HTTPException: If the industry_id is invalid.
    """
    if industry_id not in industry_dbdata:
        raise HTTPException(status_code=400, detail=f"Invalid industry ID: {industry_id}")
    return industry_dbdata[industry_id]["rules"]
    

class MongoDBCredentials(BaseModel):
    connection_string: str
    password: str
    db_name: str

mongo_credentials = None

@app.post("/connect-mongodb")
def connect_mongodb(credentials: MongoDBCredentials):
    global mongo_credentials
    try:
        client, database = get_mongo_client(credentials.connection_string, credentials.password, credentials.db_name)
        set_mongo_client(client, database)
        mongo_credentials = {
            "connection_string": credentials.connection_string,
            "password": credentials.password,
            "db_name": credentials.db_name
        }
        return {"message": "Connected to MongoDB successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/disconnect")
async def disconnect_mongo():
    from dbconn import mongo_client
    if mongo_client:
        mongo_client.close()
        set_mongo_client(None, None)
        return {"message": "MongoDB connection closed successfully"}
    return {"message": "No active MongoDB connection"}

@app.get("/get_data")
async def get_data(industry_id: str = None, rule_id: str = None):
    global current_industry
    
    # Use provided industry_id or fall back to current_industry
    selected_industry = industry_id if industry_id else current_industry
    
    if not selected_industry:
        raise HTTPException(status_code=400, detail="Please select an industry first")
    
    try:
        # Get rule name if rule_id is provided
        rule_name = None
        if rule_id:
            for rule in industry_data[selected_industry]["rules"]:
                if rule["id"] == rule_id:
                    rule_name = rule["rule"]
                    break
        
        # Get data based on industry and rule
        if selected_industry == "industry1":
            # Industry 1 uses the "product" collection
            collection = get_collection()  # "product" collection
        elif selected_industry == "industry2":
            if rule_id and rule_name:
                if rule_name == "Crate Count":
                    collection = get_collection1()  # "crate_count" collection
                elif rule_name == "Milk Spillage":
                    collection = get_collection2()  # "milk_spillage" collection
                elif rule_name == "Milk Wastage":
                    collection = get_collection3()  # "milk_wastage" collection
                elif rule_name == "Conveyor Belt Crate Count":
                    collection = get_collection4()  # "conveyor_belt_crate_count" collection
                else:
                    collection = get_collection1()  # Default to "crate_count" collection
            else:
                collection = get_collection1()  # Default to "crate_count" collection
                
        elif selected_industry == "industry3":
            if rule_id and rule_name:
                if rule_name == "Speed":
                    collection = get_collection5()  # "Speed_Monitoring" collection
                elif rule_name == "Helmet":
                    collection = get_collection6()  # "helmet_safety" collection
                elif rule_name == "PPE":
                    collection = get_collection7()  # "safety_detection" collection
                elif rule_name == "Intrusion":
                    collection = get_collection8()  # "Intrusion_detection" collection
                elif rule_name == "Crowd":
                    collection = get_collection9()  # "crowd_monitoring" collection
                elif rule_name == "Camera Tampering":
                    collection = get_collection10()  # "camera_tampering" collection
                else:
                    collection = get_collection5()  # Default to "Speed_Monitoring" collection
            else:
                collection = get_collection5()  # Default to "Speed_Monitoring" collection
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported industry: {selected_industry}")
            
        # Query the database and format the results
        documents = collection.find()
        db_result = [{**doc, "_id": str(doc["_id"])} for doc in documents]
        return db_result
            
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


output_configurations = {
    "storage": ["Local Storage", "Cloud Storage", "Network Storage"],
    "format": ["JSON", "CSV", "XML"],
    "current_output_configurations": ["Local Storage", "JSON"],
}

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
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Here, you could also apply detection/processing to the frame
        # Encode the frame as JPEG
        _, jpeg = cv2.imencode(".jpg", frame)
        frame_data = {
            "frame_number": frame_count,
            "frame_data": jpeg.tobytes()
        }
        frame_count += 1
        yield frame_data

    cap.release()

@app.get("/video-stream/")
async def video_stream():
    video_path = "output_videos/output_video_v1.mp4"  # The path to your processed video
    return StreamingResponse(generate_video_frames(video_path), media_type="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)