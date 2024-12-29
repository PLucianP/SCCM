from ultralytics import YOLO
import torch
from .base import BaseDetector
import cv2
import os

class CustomYOLODetector(BaseDetector):
    def __init__(self, weights_path=None, train=False):
        """
        Initialize Custom YOLO model for traffic sign detection.
        weights_path: Path to custom trained weights
        train: Whether to train a new model if weights don't exist
        """
        if weights_path and os.path.exists(weights_path):
            self.model = YOLO(weights_path)
        else:
            # Start with base YOLOv8 model
            self.model = YOLO('yolov8n.pt')
            if train:
                self._train_model()

    def _train_model(self):
        """
        Train the model on a traffic sign dataset.
        You can use GTSDB (German Traffic Sign Detection Benchmark) or similar datasets.
        """
        # Training configuration
        config = {
            'data': 'traffic_signs.yaml',  # Path to data configuration file
            'epochs': 100,
            'imgsz': 640,
            'batch': 16,
            'device': 'cuda:0' if torch.cuda.is_available() else 'cpu'
        }
        
        # Train the model
        self.model.train(**config)
        
        # Save the trained weights
        self.model.save('traffic_sign_detector.pt')

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
        
        return {
            'predictions': predictions,
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