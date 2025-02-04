const MeasureManager = {
    stream: null,
    videoElement: null,
    isInitialized: false,
    referenceObject: {
        widthCm: 21,  // A4 paper width as reference
        heightCm: 29.7 // A4 paper height as reference
    },

    async handleCapture() {
        if (!this.isInitialized) {
            // First click - initialize camera
            await this.initCamera();
            this.isInitialized = true;
        } else {
            // Camera is ready - take picture
            await this.captureImage();
        }
    },

    async initCamera() {
        try {
            this.videoElement = document.getElementById('camera');
            console.log('Initializing camera...');
            
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'environment'
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    console.log('Camera stream loaded successfully');
                    resolve();
                };
            });
            
            // Update capture button text
            const captureBtn = document.getElementById('capture');
            captureBtn.textContent = 'Take Picture';
            captureBtn.disabled = false;
            
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Failed to access camera. Please make sure you have granted camera permissions and are using HTTPS.');
        }
    },

    async captureImage() {
        try {
            // Create a canvas element to capture the frame
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            
            // Draw the current video frame to the canvas
            const context = canvas.getContext('2d');
            context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 image
            const imageData = canvas.toDataURL('image/jpeg');
            
            // Store the captured image (we'll use this later for measurements)
            this.capturedImage = imageData;
            
            // Show preview
            this.showPreview(imageData);
            
            console.log('Image captured successfully');
        } catch (err) {
            console.error('Error capturing image:', err);
            alert('Failed to capture image. Please try again.');
        }
    },

    showPreview(imageData) {
        // Replace video with captured image
        this.videoElement.style.display = 'none';
        
        // Create and show preview image
        const previewImg = document.createElement('img');
        previewImg.src = imageData;
        previewImg.id = 'preview';
        previewImg.className = 'w-full h-full object-contain rounded-lg';
        this.videoElement.parentNode.appendChild(previewImg);
        
        // Show retake button
        const captureBtn = document.getElementById('capture');
        captureBtn.textContent = 'Retake';
        captureBtn.onclick = () => this.retake();
        
        // Enable measure button
        document.getElementById('measure').disabled = false;
    },

    retake() {
        // Remove preview image
        const preview = document.getElementById('preview');
        if (preview) preview.remove();
        
        // Show video element again
        this.videoElement.style.display = 'block';
        
        // Reset capture button
        const captureBtn = document.getElementById('capture');
        captureBtn.textContent = 'Start Camera';
        captureBtn.onclick = () => this.handleCapture();
        
        // Disable measure button
        document.getElementById('measure').disabled = true;
    },

    cleanup() {
        // Stop all video streams when switching tabs
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    },

    async calculateDimensions() {
        if (!this.capturedImage) {
            alert('Please capture an image first');
            return;
        }

        try {
            // Load the captured image
            const img = new Image();
            img.src = this.capturedImage;
            
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // Create a canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get image data for processing
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // TODO: Implement computer vision algorithm here
            // For now, we'll use a placeholder calculation
            const estimatedWidth = 250; // cm
            const estimatedHeight = 180; // cm
            
            // Update the measurement fields
            document.getElementById('width').value = estimatedWidth.toFixed(1);
            document.getElementById('height').value = estimatedHeight.toFixed(1);
            
            // Calculate surface area in m²
            const surfaceArea = (estimatedWidth * estimatedHeight) / 10000;
            document.getElementById('surface').value = surfaceArea.toFixed(2);
            
            console.log('Dimensions calculated:', {
                width: estimatedWidth,
                height: estimatedHeight,
                surface: surfaceArea
            });
        } catch (err) {
            console.error('Error calculating dimensions:', err);
            alert('Failed to calculate dimensions. Please try again.');
        }
    }
};

// Initialize when tab is active
document.addEventListener('alpine:init', () => {
    Alpine.data('measurementData', () => ({
        activeTab: 'camera',
        init() {
            this.$watch('activeTab', value => {
                if (value === 'camera') {
                    MeasureManager.initCamera();
                } else {
                    MeasureManager.cleanup();
                }
            });
            
            if (this.activeTab === 'camera') {
                MeasureManager.initCamera();
            }
        }
    }));
});

// Initialize click handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('capture');
    captureBtn.textContent = 'Start Camera';
    captureBtn.disabled = false;
    captureBtn.onclick = () => MeasureManager.handleCapture();
    
    const measureBtn = document.getElementById('measure');
    measureBtn.disabled = true;
    measureBtn.onclick = () => MeasureManager.calculateDimensions();
}); 