# views.py
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import MediaFile
import os
from django.conf import settings
from .models_ai.yolo_detector import YOLODetector
from .models_ai.roboflow_detector import RoboflowDetector
from .models_ai.google_vision_detector import GoogleVisionDetector
from .models_ai.custom_yolo_detector import CustomYOLODetector

# Initialize all detectors
yolo_detector = YOLODetector()
roboflow_detector = RoboflowDetector(api_key="VWw9T4je8TeGaa85n5HF")
google_detector = GoogleVisionDetector(
    credentials_path="/Users/lucian/Documents/Github/Facultate/wade/tssd-uni-cfe19943514d.json")
custom_yolo_detector = CustomYOLODetector(weights_path=None, train=False)

# Choose which detector to use
DETECTOR = google_detector  # Change this to use different detectors


def home_page(request):
    return render(request, 'home.html')


@api_view(['POST'])
def upload_media(request):
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=400)

        file = request.FILES['file']
        file_type = 'video' if file.content_type.startswith('video') else 'image'

        # Save the file
        media = MediaFile.objects.create(
            file=file,
            file_type=file_type
        )

        if not os.path.exists(media.file.path):
            raise Exception('File was not saved successfully')

        # Process with selected detector
        if file_type == 'image':
            result = DETECTOR.process_image(media.file.path)
        else:
            result = DETECTOR.process_video(media.file.path)

        return Response({
            'id': media.id,
            'predictions': result
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({
            'error': str(e),
            'detail': 'An error occurred while processing the file'
        }, status=500)


@api_view(['POST'])
def process_live_frame(request):
    try:
        if 'frame' not in request.FILES:
            return Response({'error': 'No frame provided'}, status=400)

        frame = request.FILES['frame']
        temp_path = os.path.join(settings.MEDIA_ROOT, "temp_live_frame.jpg")

        with open(temp_path, 'wb+') as destination:
            for chunk in frame.chunks():
                destination.write(chunk)

        result = DETECTOR.process_image(temp_path)

        if os.path.exists(temp_path):
            os.remove(temp_path)

        return Response(result)

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({
            'error': str(e),
            'detail': 'An error occurred while processing the frame'
        }, status=500)
