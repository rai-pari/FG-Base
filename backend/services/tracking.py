import os
import cv2
from ultralytics import YOLO
import uuid
import time
import numpy as np
 
def detect_boxes(results):
    boxes = results[0].boxes
    bboxes = boxes.xyxy
    scores = boxes.conf
    classes = boxes.cls
    ids = boxes.id
 
    rois = []
    for index in range(len(boxes)):
        xmin = int(bboxes[index][0])
        ymin = int(bboxes[index][1])
        xmax = int(bboxes[index][2])
        ymax = int(bboxes[index][3])
        score = int(scores[index] * 100)
        class_id = int(classes[index])
        tracker_id = int(ids[index]) if ids is not None else None
        rois.append([xmin, ymin, xmax, ymax, class_id, score, tracker_id])
    return rois
 
def process_video(video_path: str, threshold: int, roi_data, frame_interval: int = 12):
    start_time = time.time()
    output_video_path = f"output_videos/output_{uuid.uuid4().hex}.mp4"
   
    # Load YOLO model
    model = YOLO(r'F:\ResoluteAI\FaceGemini\backend\services\yolov8m.pt')
    threshold = threshold / 100
    print("Confidence Threshold:", threshold)
 
    # Open video file
    cap = cv2.VideoCapture(video_path)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (frame_width, frame_height))
 
    seen_ids = {}  
    total_count = 0
    person_count = 0
    total_dwell_time = 0.0  
    persons_id = []  
    frame_count = 0  
 
    # Extract bounding box from ROI and ensure valid cropping
    x_min = max(0, min(int(min(roi_data[0][0], roi_data[1][0], roi_data[2][0], roi_data[3][0])), frame_width - 1))
    y_min = max(0, min(int(min(roi_data[0][1], roi_data[1][1], roi_data[2][1], roi_data[3][1])), frame_height - 1))
    x_max = max(x_min + 1, min(int(max(roi_data[0][0], roi_data[1][0], roi_data[2][0], roi_data[3][0])), frame_width))
    y_max = max(y_min + 1, min(int(max(roi_data[0][1], roi_data[1][1], roi_data[2][1], roi_data[3][1])), frame_height))
 
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
 
        frame_count += 1
        current_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000  
 
        # Crop the frame based on ROI
        cropped_frame = frame[y_min:y_max, x_min:x_max]
 
        # Check if cropping resulted in an empty frame
        if cropped_frame.size == 0:
            print("Warning: Cropped frame is empty. Skipping this frame.")
            continue  
 
        cropped_frame_resized = cv2.resize(cropped_frame, (frame_width, frame_height))
 
        if frame_count % frame_interval == 0:
            results = model.track(cropped_frame_resized, persist=True, conf=threshold, iou=0.5, agnostic_nms=True)
            rois = detect_boxes(results)
 
            current_frame_ids = set()
            for roi in rois:
                if roi[4] == 0 and roi[5] > 80:  
                    tracker_id = roi[6]
                    current_frame_ids.add(tracker_id)
 
                    if tracker_id not in seen_ids:
                        seen_ids[tracker_id] = {
                            'start_time': current_time,
                            'end_time': current_time,
                            'bbox': roi[:4],  
                            'is_visible': True
                        }
                        total_count += 1
                    else:
                        seen_ids[tracker_id]['end_time'] = current_time
                        seen_ids[tracker_id]['bbox'] = roi[:4]
                        seen_ids[tracker_id]['is_visible'] = True
        else:
            for tracker_id, data in seen_ids.items():
                if data['is_visible']:
                    data['end_time'] = current_time
 
        # Adjust bounding boxes back to the original frame coordinates
        for tracker_id, data in seen_ids.items():
            if data['is_visible']:
                bbox = data['bbox']
                dwell_time = data['end_time'] - data['start_time']
                bbox_message = f"Person ID: {tracker_id} | Dwell Time: {dwell_time:.2f}s"
 
                # Convert bounding box from cropped frame to original frame
                x1, y1, x2, y2 = bbox
                x1 = int(x1 * (x_max - x_min) / frame_width) + x_min
                y1 = int(y1 * (y_max - y_min) / frame_height) + y_min
                x2 = int(x2 * (x_max - x_min) / frame_width) + x_min
                y2 = int(y2 * (y_max - y_min) / frame_height) + y_min
 
                text_color, bbox_color = (255, 255, 255), (255, 0, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), bbox_color, 2)
                cv2.putText(frame, bbox_message, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 2)
 
        if frame_count % frame_interval == 0:
            for tracker_id in seen_ids.keys():
                if tracker_id not in current_frame_ids:
                    seen_ids[tracker_id]['is_visible'] = False
 
        # Draw ROI box on the original frame
        cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
        cv2.putText(frame, "ROI Region", (x_min, y_min - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
 
        out.write(frame)
 
    cap.release()
    out.release()
 
    for tracker_id, data in seen_ids.items():
        dwell_time = data['end_time'] - data['start_time']
        total_dwell_time += dwell_time
        if dwell_time > 20:
            person_count += 1
            persons_id.append(tracker_id)
 
    print(f"Final persons_id: {persons_id}")
    print(f"Final Person Count: {person_count}")
    print(f"Total Dwell Time: {total_dwell_time:.2f} seconds")
   
    end_time = time.time()
    processing_time = end_time - start_time
    print("Processing time:", processing_time)
 
    return output_video_path, person_count, total_dwell_time