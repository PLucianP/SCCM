from django.db import models
from django.utils import timezone


class MediaFile(models.Model):
    file = models.FileField(upload_to='uploads/')
    file_type = models.CharField(max_length=10)  # 'image' or 'video'
    uploaded_at = models.DateTimeField(default=timezone.now)
    processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.file_type} uploaded at {self.uploaded_at}"
