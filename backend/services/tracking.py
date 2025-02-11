import cv2
from ultralytics import YOLO
import uuid
import os
import time
import csv
import math
import numpy as np

def is_inside_roi(point, roi_coordinates):
    """ Check if a point (x, y) is inside the polygon ROI """
    return cv2.pointPolygonTest(np.array(roi_coordinates, dtype=np.int32), point, False) >= 0

def process_video(video_path: str, threshold: int, roi_data, frame_interval: int = 12, speed_threshold: float = 0.1, idle_threshold: int = 10):
    start_time = time.time()
    output_video_path = f"output_videos/output_video.mp4"
    if os.path.exists(output_video_path):
        os.remove(output_video_path)
    model = YOLO('yolov8m.pt')
    threshold = threshold / 100

    def detect_boxes(results):
        boxes = results[0].boxes
        rois = []
        for box in boxes:
            xmin, ymin, xmax, ymax = map(int, box.xyxy[0])
            score = int(box.conf[0] * 100)
            class_id = int(box.cls[0])
            tracker_id = int(box.id[0]) if box.id is not None else None
            rois.append([xmin, ymin, xmax, ymax, class_id, score, tracker_id])
        return rois

    cap = cv2.VideoCapture(video_path)
    frame_width, frame_height = int(cap.get(3)), int(cap.get(4))
    fps = int(cap.get(5))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (frame_width, frame_height))

    seen_ids = {}
    total_count = person_count = 0
    total_dwell_time = total_active_time = total_idle_time = 0.0
    persons_id = []
    frame_count = 0

    csv_file_path_frame = "person_count_by_frames.csv"
    csv_file_path_dwell = "id_by_dwell_time.csv"

    if os.path.exists(csv_file_path_frame):
        os.remove(csv_file_path_frame)

    output_frame_dir = "output_frame"
    os.makedirs(output_frame_dir, exist_ok=True)

    with open(csv_file_path_frame, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Frame", "Number of Persons", "Total Dwell Time"])

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        roi_coordinates_int = np.array(roi_data, dtype=np.int32)
        cv2.polylines(frame, [roi_coordinates_int], isClosed=True, color=(0, 255, 0), thickness=2)
        cv2.putText(frame, "ROI Region", tuple(roi_coordinates_int[0]), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        frame_count += 1
        current_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000  # Convert ms to seconds

        if frame_count % frame_interval == 0:
            results = model.track(frame, persist=True, conf=threshold, iou=0.5, agnostic_nms=True)
            rois = detect_boxes(results)

            num_persons = 0
            total_dwell_time_frame = 0.0  # Store dwell time for this frame
            current_frame_ids = set()

            for roi in rois:
                if roi[4] == 0 and roi[5] > 80:  # Detect only persons with confidence > 80%
                    tracker_id = roi[6]
                    xmin, ymin, xmax, ymax = roi[:4]  # Bounding box coordinates
                    curr_x, curr_y = (xmin + xmax) // 2, (ymin + ymax) // 2  # Compute center

                    # Only track persons inside the ROI
                    if is_inside_roi((curr_x, curr_y), roi_data):
                        current_frame_ids.add(tracker_id)
                        num_persons += 1

                        if tracker_id not in seen_ids:
                            seen_ids[tracker_id] = {
                                'start_time': current_time,
                                'end_time': current_time,
                                'bbox': (xmin, ymin, xmax, ymax),
                                'prev_position': (curr_x, curr_y),
                                'total_distance': 0.0,
                                'active_time': 0.0,
                                'idle_time': 0.0
                            }
                            total_count += 1
                        else:
                            prev_x, prev_y = seen_ids[tracker_id]['prev_position']
                            distance = math.sqrt((curr_x - prev_x) ** 2 + (curr_y - prev_y) ** 2)
                            seen_ids[tracker_id]['total_distance'] += distance
                            seen_ids[tracker_id]['prev_position'] = (curr_x, curr_y)
                            seen_ids[tracker_id]['end_time'] = current_time
                            seen_ids[tracker_id]['bbox'] = (xmin, ymin, xmax, ymax)

                            if distance <= idle_threshold:
                                seen_ids[tracker_id]['idle_time'] += frame_interval / fps
                            else:
                                seen_ids[tracker_id]['active_time'] += frame_interval / fps

                        # Add person's dwell time for this frame
                        dwell_time = seen_ids[tracker_id]['end_time'] - seen_ids[tracker_id]['start_time']
                        total_dwell_time_frame += dwell_time

            with open(csv_file_path_frame, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([frame_count, num_persons, round(total_dwell_time_frame, 2)])

        # Draw bounding boxes & ID labels only for persons inside the ROI
        for tracker_id, data in seen_ids.items():
            dwell_time = data['end_time'] - data['start_time']
            xmin, ymin, xmax, ymax = data['bbox']
            last_position = data['prev_position']

            if is_inside_roi(last_position, roi_data):
                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (255, 0, 0), 2)
                text = f"ID: {tracker_id}, Dwell: {dwell_time:.1f}s"
                cv2.putText(frame, text, (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        out.write(frame)
        # Save every 5th frame
        if frame_count % frame_interval == 0:
            frame_path = os.path.join(output_frame_dir, f"frame_{frame_count}.jpg")
            cv2.imwrite(frame_path, frame)

    cap.release()
    out.release()

    with open(csv_file_path_dwell, "w", newline="") as csvfile1:
        writer = csv.writer(csvfile1)
        writer.writerow(["Tracker ID", "Total Dwell Time", "Average Speed", "Active Time", "Idle Time"])

        for tracker_id, data in seen_ids.items():
            dwell_time = data['end_time'] - data['start_time']
            avg_speed = data['total_distance'] / dwell_time if dwell_time > 0 else 0
            data['active_time'] = dwell_time - data['idle_time']

            writer.writerow([tracker_id, dwell_time, avg_speed, data['active_time'], data['idle_time']])

            total_dwell_time += dwell_time
            total_active_time += data['active_time']
            total_idle_time += data['idle_time']

            if dwell_time > 15:
                person_count += 1
                persons_id.append(tracker_id)

    print(f"Final persons_id: {persons_id}")
    print(f"Final Person Count: {person_count}")
    print(f"Total Dwell Time: {total_dwell_time:.2f} seconds")
    print(f"Total Active Time: {total_active_time:.2f} seconds")
    print(f"Total Idle Time: {total_idle_time:.2f} seconds")

    return output_video_path, person_count, total_dwell_time