import React from 'react';
import { Plus } from 'lucide-react';
import { Camera } from '../types';
import { mockCameras } from '../data/mockData';
import CameraCard from './camera/CameraCard';
import CameraModal from './camera/CameraModal';
import PageHeader from './common/PageHeader';

const CameraList = () => {
  const [cameras, setCameras] = React.useState<Camera[]>(mockCameras);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCamera, setSelectedCamera] = React.useState<Camera | undefined>();

  const handleAddCamera = () => {
    setSelectedCamera(undefined);
    setIsModalOpen(true);
  };

  const handleEditCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setIsModalOpen(true);
  };

  const handleDeleteCamera = (camera: Camera) => {
    if (window.confirm('Are you sure you want to delete this camera?')) {
      setCameras(cameras.filter((c) => c.id !== camera.id));
    }
  };

  const handleSaveCamera = (camera: Camera) => {
    if (selectedCamera) {
      // Edit existing camera
      setCameras(cameras.map((c) => 
        c.id === camera.id ? camera : c
      ));
    } else {
      // Add new camera
      setCameras([...cameras, camera]);
    }
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Cameras"
        action={{
          label: "Add Camera",
          icon: Plus,
          onClick: handleAddCamera
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <CameraCard 
            key={camera.id} 
            camera={camera}
            onEdit={handleEditCamera}
            onDelete={handleDeleteCamera}
          />
        ))}
      </div>

      <CameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCamera}
        camera={selectedCamera}
      />
    </div>
  );
};

export default CameraList;