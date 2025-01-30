import os
import cv2
from ultralytics import YOLO
import uuid
import time
import csv
import math

def process_video(video_path: str, threshold: int, frame_interval: int = 12, speed_threshold: float = 0.1):
    start_time = time.time()
    output_video_path = f"output_videos/output_{uuid.uuid4().hex}.mp4"
    model = YOLO('yolov8m.pt')
    threshold = threshold / 100
    print(threshold)

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
    total_active_time = 0.0
    total_idle_time = 0.0
    persons_id = []
    frame_count = 0

    # CSV file paths
    csv_file_path_frame = "person_count_by_frames.csv"
    csv_file_path_dwell = "id_by_dwell_time.csv"

    # Open the CSV file for frame-wise person count
    with open(csv_file_path_frame, mode='w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(["Frame", "Number of Persons"])

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            current_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000

            if frame_count % frame_interval == 0:
                results = model.track(frame, persist=True, conf=threshold, iou=0.5, agnostic_nms=True)
                rois = detect_boxes(results)

                current_frame_ids = set()
                num_persons = 0
                for roi in rois:
                    if roi[4] == 0 and roi[5] > 80:  # Class 0 is 'person'
                        tracker_id = roi[6]
                        current_frame_ids.add(tracker_id)
                        num_persons += 1

                        if tracker_id not in seen_ids:
                            seen_ids[tracker_id] = {
                                'start_time': current_time,
                                'end_time': current_time,
                                'bbox': roi[:4],
                                'is_visible': True,
                                'prev_position': ((roi[0] + roi[2]) // 2, (roi[1] + roi[3]) // 2),
                                'total_distance': 0.0,
                                'active_time': 0.0,
                                'idle_time': 0.0
                            }
                            total_count += 1
                        else:
                            prev_x, prev_y = seen_ids[tracker_id]['prev_position']
                            curr_x, curr_y = (roi[0] + roi[2]) // 2, (roi[1] + roi[3]) // 2
                            distance = math.sqrt((curr_x - prev_x) ** 2 + (curr_y - prev_y) ** 2)
                            seen_ids[tracker_id]['total_distance'] += distance
                            seen_ids[tracker_id]['prev_position'] = (curr_x, curr_y)
                            seen_ids[tracker_id]['end_time'] = current_time
                            seen_ids[tracker_id]['bbox'] = roi[:4]
                            seen_ids[tracker_id]['is_visible'] = True

                csv_writer.writerow([frame_count, num_persons])

            else:
                for tracker_id, data in seen_ids.items():
                    if data['is_visible']:
                        data['end_time'] = current_time

            for tracker_id, data in seen_ids.items():
                if data['is_visible']:
                    bbox = data['bbox']
                    dwell_time = data['end_time'] - data['start_time']
                    bbox_message = f"Person ID: {tracker_id} | Dwell Time: {dwell_time:.2f}s"
                    text_color, bbox_color = (255, 255, 255), (255, 0, 0)
                    cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), bbox_color, 2)
                    cv2.putText(frame, bbox_message, (bbox[0], bbox[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 2)

            if frame_count % frame_interval == 0:
                for tracker_id in seen_ids.keys():
                    if tracker_id not in current_frame_ids:
                        seen_ids[tracker_id]['is_visible'] = False

            out.write(frame)

    cap.release()
    out.release()

    # Write dwell time, speed, and activity data to CSV
    with open(csv_file_path_dwell, mode='w', newline='') as csvfile1:
        csv_writer_dwell = csv.writer(csvfile1)
        csv_writer_dwell.writerow(["Tracker ID", "Total Dwell Time","Average Speed", "Active Time", "Idle Time"])

        for tracker_id, data in seen_ids.items():
            dwell_time = data['end_time'] - data['start_time']
            avg_speed = data['total_distance'] / dwell_time if dwell_time > 0 else 0

            # Calculate active and idle time
            active_time = 0.0
            idle_time = 0.0
            if dwell_time > 0:
                if avg_speed > speed_threshold:
                    active_time = dwell_time
                else:
                    idle_time = dwell_time

            csv_writer_dwell.writerow([tracker_id, dwell_time,avg_speed, active_time, idle_time])
  
            total_dwell_time += dwell_time
            total_active_time += active_time
            total_idle_time += idle_time

            if dwell_time > 15:
                person_count += 1
                persons_id.append(tracker_id)

    print(f"Final persons_id: {persons_id}")
    print(f"Final Person Count: {person_count}")
    print(f"Total Dwell Time: {total_dwell_time:.2f} seconds")
    print(f"Total Active Time: {total_active_time:.2f} seconds")
    print(f"Total Idle Time: {total_idle_time:.2f} seconds")

    return output_video_path, person_count, total_dwell_time
