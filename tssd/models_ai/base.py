from abc import ABC, abstractmethod

class BaseDetector(ABC):
    @abstractmethod
    def process_image(self, image_path):
        """Process a single image and return predictions"""
        pass

    @abstractmethod
    def process_video(self, video_path):
        """Process a video and return predictions for each frame"""
        pass

    @abstractmethod
    def process_frame(self, frame):
        """Process a single video frame and return predictions"""
        pass 