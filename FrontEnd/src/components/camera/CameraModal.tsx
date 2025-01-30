import React from 'react';
import { X } from 'lucide-react';
import { Camera } from '../../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (camera: Camera) => void;
  camera?: Camera;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onSave, camera }) => {
  const [formData, setFormData] = React.useState<Partial<Camera>>({
    name: camera?.name || '',
    location: camera?.location || '',
    url: camera?.url || '',
  });

  React.useEffect(() => {
    if (camera) {
      setFormData({
        name: camera.name,
        location: camera.location,
        url: camera.url,
      });
    }
  }, [camera]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: camera?.id || String(Date.now()),
      status: camera?.status || 'offline',
      ...formData as Camera
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {camera ? 'Edit Camera' : 'Add Camera'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Camera Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stream URL
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="rtsp://camera.stream"
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CameraModal;