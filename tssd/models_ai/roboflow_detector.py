from inference_sdk import InferenceHTTPClient
from .base import BaseDetector
import cv2
import os

class RoboflowDetector(BaseDetector):
    def __init__(self, api_key, model_id="traffic_sign-gv5rp-t0k2e-q8meh/1"):
        self.client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=api_key
        )
        self.model_id = model_id

    def process_image(self, image_path):
        result = self.client.infer(image_path, model_id=self.model_id)
        return self._format_result(result)

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
        # Save frame temporarily
        temp_path = "temp_frame.jpg"
        cv2.imwrite(temp_path, frame)
        
        try:
            result = self.client.infer(temp_path, model_id=self.model_id)
            return self._format_result(result)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def _format_result(self, result):
        return {
            'predictions': result.get('predictions', []),
            'image_size': result.get('image', {})
        } 