import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Camera } from '../../types';

interface CameraCardProps {
  camera: Camera;
  onEdit: (camera: Camera) => void;
  onDelete: (camera: Camera) => void;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{camera.name}</h3>
          <p className="text-gray-600">{camera.location}</p>
        </div>
        {camera.status === 'online' ? (
          <div className="flex items-center text-green-500">
            <Wifi className="w-4 h-4 mr-1" />
            <span className="text-sm">Online</span>
          </div>
        ) : (
          <div className="flex items-center text-red-500">
            <WifiOff className="w-4 h-4 mr-1" />
            <span className="text-sm">Offline</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Stream URL: {camera.url}</p>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(camera)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(camera)}
            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;