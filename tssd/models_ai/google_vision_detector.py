from google.cloud import vision
from .base import BaseDetector
import cv2
import os
import io

class GoogleVisionDetector(BaseDetector):
    def __init__(self, credentials_path=None):
        """
        Initialize Google Vision client.
        credentials_path: Path to your Google Cloud credentials JSON file
        """
        if credentials_path:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        self.client = vision.ImageAnnotatorClient()
        
        # Expanded list of traffic-related objects
        self.traffic_objects = {
            'Traffic sign', 'Traffic light', 'Stop sign', 
            'Parking meter', 'Street sign', 'Road sign',
            'Sign', 'Traffic', 'Road'
        }
        
        # Expanded list of traffic sign types
        self.traffic_labels = {
            # Regulatory signs
            'Stop sign', 'Yield sign', 'Speed limit sign', 'One way sign',
            'No parking sign', 'No entry sign', 'No stopping sign',
            'No overtaking sign', 'Priority road sign', 'Give way sign',
            
            # Warning signs
            'Warning sign', 'Pedestrian crossing sign', 'School zone sign',
            'Curve warning sign', 'Merge sign', 'Road work sign',
            'Traffic signal ahead sign', 'Railroad crossing sign',
            
            # Information signs
            'Information sign', 'Direction sign', 'Parking sign',
            'Hospital sign', 'Gas station sign', 'Restaurant sign',
            
            # Traffic control
            'Traffic light', 'Traffic signal', 'Regulatory sign',
            'Mandatory sign', 'Lane control sign'
        }
        
        # Keywords to help identify sign types
        self.sign_keywords = {
            'stop': 'Stop sign',
            'yield': 'Yield sign',
            'speed': 'Speed limit sign',
            'limit': 'Speed limit sign',
            'parking': 'Parking sign',
            'no': 'Prohibition sign',
            'warning': 'Warning sign',
            'danger': 'Warning sign',
            'school': 'School zone sign',
            'pedestrian': 'Pedestrian crossing sign',
            'crossing': 'Crossing sign',
            'one way': 'One way sign',
            'turn': 'Turn sign',
            'merge': 'Merge sign',
            'lane': 'Lane control sign',
            'work': 'Road work sign',
            'signal': 'Traffic signal sign',
            'ahead': 'Warning sign',
            'km': 'Speed limit sign',
            'mph': 'Speed limit sign',
            'maximum': 'Speed limit sign',
            'min': 'Speed limit sign',
            'exit': 'Exit sign',
            'enter': 'Entry sign',
            'right': 'Direction sign',
            'left': 'Direction sign'
        }

    def _process_image_file(self, image_path):
        with io.open(image_path, 'rb') as image_file:
            content = image_file.read()
        image = vision.Image(content=content)
        
        # Get multiple types of detection results
        objects = self.client.object_localization(image=image)
        labels = self.client.label_detection(image=image)
        texts = self.client.text_detection(image=image)
        
        return self._format_annotations(objects, labels, texts, image_path)

    def _format_annotations(self, objects, labels, texts, image_path):
        predictions = []
        
        # Process detected objects with their locations
        for obj in objects.localized_object_annotations:
            if obj.name in self.traffic_objects:
                vertices = obj.bounding_poly.normalized_vertices
                
                # Get specific labels for this region
                sign_type = self._get_sign_type(labels.label_annotations)
                sign_text = self._get_text_in_region(texts.text_annotations, vertices)
                
                prediction = {
                    'class': obj.name,
                    'specific_type': sign_type,
                    'confidence': obj.score,
                    'text_content': sign_text,
                    'bbox': {
                        'x': vertices[0].x,
                        'y': vertices[0].y,
                        'width': vertices[1].x - vertices[0].x,
                        'height': vertices[2].y - vertices[0].y
                    }
                }
                predictions.append(prediction)
        
        # Get image dimensions
        img = cv2.imread(image_path)
        height, width = img.shape[:2]
        
        return {
            'predictions': predictions,
            'image_size': {
                'width': width,
                'height': height
            }
        }

    def _get_sign_type(self, labels):
        """Extract specific traffic sign type from labels with improved detection"""
        # First check for exact matches in traffic_labels
        for label in labels:
            if label.description in self.traffic_labels:
                return label.description
        
        # Then check for keywords in label descriptions
        for label in labels:
            desc_lower = label.description.lower()
            for keyword, sign_type in self.sign_keywords.items():
                if keyword in desc_lower:
                    return sign_type
        
        # If no match found, return a more descriptive unknown type
        return 'Unidentified traffic sign'

    def _get_text_in_region(self, text_annotations, vertices):
        """Extract text that appears within or near the sign region with improved detection"""
        if not text_annotations:
            return ""
        
        relevant_text = []
        for text in text_annotations[1:]:  # Skip first annotation (contains all text)
            text_vertices = text.bounding_poly.vertices
            # Check if text overlaps or is very close to sign region
            if self._regions_overlap(vertices, text_vertices, tolerance=0.1):
                # Clean up and normalize the text
                cleaned_text = text.description.strip()
                if cleaned_text.isdigit():
                    # If it's a number, it might be a speed limit
                    cleaned_text = f"{cleaned_text} speed limit"
                relevant_text.append(cleaned_text)
        
        return " ".join(relevant_text)

    def _regions_overlap(self, region1, region2, tolerance=0.1):
        """Check if two regions overlap with added tolerance for nearby text"""
        def get_bounds(vertices):
            xs = [v.x for v in vertices]
            ys = [v.y for v in vertices]
            return min(xs), max(xs), min(ys), max(ys)
        
        r1_x1, r1_x2, r1_y1, r1_y2 = get_bounds(region1)
        r2_x1, r2_x2, r2_y1, r2_y2 = get_bounds(region2)
        
        # Add tolerance to the bounds
        r1_x1 -= tolerance
        r1_x2 += tolerance
        r1_y1 -= tolerance
        r1_y2 += tolerance
        
        return not (r1_x2 < r2_x1 or r1_x1 > r2_x2 or 
                   r1_y2 < r2_y1 or r1_y1 > r2_y2)

    def process_image(self, image_path):
        return self._process_image_file(image_path)

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
            return self._process_image_file(temp_path)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path) 