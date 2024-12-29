import os
from ultralytics import YOLO
import cv2
from .base import BaseDetector

class YOLODetector(BaseDetector):
    def __init__(self, model_path='yolov8n.pt'):
        self.model = YOLO(model_path)
        self.traffic_sign_classes = ['stop sign', 'traffic light']  # Add more classes as needed

    def _process_predictions(self, results):
        predictions = []
        for box in results[0].boxes:
            box_coords = box.xywh[0].cpu().numpy()
            cls_id = int(box.cls.cpu().numpy()[0])
            conf = float(box.conf.cpu().numpy()[0])
            
            predictions.append({
                'class': results[0].names[cls_id],
                'confidence': conf,
                'bbox': {
                    'x': float(box_coords[0]),
                    'y': float(box_coords[1]),
                    'width': float(box_coords[2]),
                    'height': float(box_coords[3])
                }
            })
        
        # Filter for traffic signs
        filtered_predictions = [
            pred for pred in predictions 
            if pred['class'] in self.traffic_sign_classes
        ]
        
        return {
            'predictions': filtered_predictions,
            'image_size': {
                'width': results[0].orig_shape[1],
                'height': results[0].orig_shape[0]
            }
        }

    def process_image(self, image_path):
        results = self.model(image_path)
        return self._process_predictions(results)

    def process_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        results = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_result = self.process_frame(frame)
            frame_result['frame'] = frame_count
            results.append(frame_result)
            frame_count += 1
            
        cap.release()
        return results

    def process_frame(self, frame):
        results = self.model(frame)
        return self._process_predictions(results) 