import React, { useState, useRef, useEffect } from 'react';
import { Camera, Square } from 'lucide-react';

// Measurement utility functions
const pixelsToMeters = (pixels, referenceObject) => {
  const pixelsPerMeter = referenceObject.pixelSize / referenceObject.realSize;
  return pixels / pixelsPerMeter;
};

const calculateArea = (width, length) => {
  return width * length;
};

const detectEdges = async (imageData) => {
  return {
    corners: [
      { x: 0, y: 0 },
      { x: imageData.width, y: 0 },
      { x: imageData.width, y: imageData.height },
      { x: 0, y: imageData.height }
    ]
  };
};

const calculateDistances = (corners) => {
  const width = Math.sqrt(
    Math.pow(corners[1].x - corners[0].x, 2) +
    Math.pow(corners[1].y - corners[0].y, 2)
  );

  const length = Math.sqrt(
    Math.pow(corners[2].x - corners[1].x, 2) +
    Math.pow(corners[2].y - corners[1].y, 2)
  );

  return { width, length };
};

const getMeasurements = async (imageData, referenceObject) => {
  try {
    const { corners } = await detectEdges(imageData);
    const pixelDistances = calculateDistances(corners);

    const width = pixelsToMeters(pixelDistances.width, referenceObject);
    const length = pixelsToMeters(pixelDistances.length, referenceObject);
    const area = calculateArea(width, length);

    return {
      width: Number(width.toFixed(2)),
      length: Number(length.toFixed(2)),
      area: Number(area.toFixed(2))
    };
  } catch (error) {
    console.error('Error in measurement calculation:', error);
    throw error;
  }
};

const CameraMeasureApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [measurements, setMeasurements] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Load object detection model
  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        // Simulating model load time
        await new Promise(resolve => setTimeout(resolve, 1000));
        setModel({});
      } catch (err) {
        setError('Failed to load detection model. Please try again.');
        console.error('Error loading model:', err);
      }
      setIsModelLoading(false);
    };

    loadModel();
  }, []);

  // Initialize camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to access camera. Please ensure you have granted camera permissions.');
      console.error('Error accessing camera:', err);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Capture frame and process measurement
  const captureAndMeasure = async () => {
    if (!videoRef.current || !canvasRef.current || !model) return;

    // Reset measurements before taking new ones
    setMeasurements(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time

      const measurements = await getMeasurements(imageData, {
        pixelSize: 100,
        realSize: 0.3
      });

      setMeasurements(measurements);
    } catch (error) {
      setError('Failed to process measurements. Please try again.');
      console.error('Error processing measurements:', error);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-4 max-w-xl mx-auto">
      <div className="w-full mb-4 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Carpet Measurement Tool</h2>
          <p className="text-gray-600">Use your camera to measure carpet dimensions</p>
        </div>

        <div className="p-4">
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full hidden"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={captureAndMeasure}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
                    disabled={isModelLoading}
                  >
                    <Square className="w-5 h-5" />
                    {isModelLoading ? 'Loading Model...' : 'Measure'}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <h3 className="font-semibold">Error</h3>
              <p>{error}</p>
            </div>
          )}

          {measurements && (
            <div className="space-y-2">
              <p className="text-lg font-semibold">Measurements:</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-100 p-3 rounded">
                  <p className="text-sm text-slate-600">Width</p>
                  <p className="text-lg font-medium">{measurements.width}m</p>
                </div>
                <div className="bg-slate-100 p-3 rounded">
                  <p className="text-sm text-slate-600">Length</p>
                  <p className="text-lg font-medium">{measurements.length}m</p>
                </div>
                <div className="bg-slate-100 p-3 rounded">
                  <p className="text-sm text-slate-600">Area</p>
                  <p className="text-lg font-medium">{measurements.area}m²</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraMeasureApp;