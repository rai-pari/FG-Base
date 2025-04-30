export interface Camera {
  id: string;
  name: string;
  url: string;
  location: string;
  status: 'online' | 'offline';
}

export interface DetectionModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  type: 'object' | 'face' | 'motion';
}

export interface ProcessingRule {
  id: string;
  name: string;
  type: 'motion' | 'object' | 'zone';
  threshold: number;
  enabled: boolean;
}

export interface Detection {
  id: string;
  cameraId: string;
  timestamp: string;
  objectType: string;
  confidence: number;
  bbox: [number, number, number, number];
}