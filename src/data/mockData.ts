import { Camera, DetectionModel, ProcessingRule, Detection } from '../types';

export const mockCameras: Camera[] = [
  {
    id: '1',
    name: 'Front Entrance',
    url: 'rtsp://camera1.stream',
    location: 'Main Building',
    status: 'online',
  },
  {
    id: '2',
    name: 'Parking Lot',
    url: 'rtsp://camera2.stream',
    location: 'Exterior',
    status: 'online',
  },
];

export const mockModels: DetectionModel[] = [
  {
    id: '1',
    name: 'YOLOv8',
    description: 'General object detection model',
    accuracy: 0.92,
    type: 'object',
  },
  {
    id: '2',
    name: 'Face Recognition',
    description: 'Advanced face detection and recognition',
    accuracy: 0.95,
    type: 'face',
  },
];

export const mockRules: ProcessingRule[] = [
  {
    id: '1',
    name: 'Motion Detection',
    type: 'motion',
    threshold: 0.6,
    enabled: true,
  },
  {
    id: '2',
    name: 'Person Detection',
    type: 'object',
    threshold: 0.7,
    enabled: true,
  },
];

export const mockDetections: Detection[] = [
  {
    id: '1',
    cameraId: '1',
    timestamp: new Date().toISOString(),
    objectType: 'person',
    confidence: 0.89,
    bbox: [100, 200, 150, 300],
  },
];