import React from 'react';
import { Camera, Brain, Cog, Database as DatabaseIcon, BarChart } from 'lucide-react';
import { mockCameras, mockModels, mockRules } from '../data/mockData';
import PageHeader from './common/PageHeader';

const Dashboard = () => {
  const [selectedCamera, setSelectedCamera] = React.useState(mockCameras[0]?.id);
  const [selectedModel, setSelectedModel] = React.useState(mockModels[0]?.id);

  return (
    <div className="p-6">
      <PageHeader title="Configuration Dashboard" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Source Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Video Source</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Camera
              </label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
              >
                {mockCameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name} - {camera.location}
                  </option>
                ))}
              </select>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Camera Preview</p>
            </div>
          </div>
        </div>

        {/* Detection Model Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Detection Model</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Model
              </label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {mockModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({(model.accuracy * 100).toFixed(1)}% accuracy)
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Model Information</h3>
              <p className="text-sm text-gray-600">
                {mockModels.find(m => m.id === selectedModel)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Logic Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cog className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Processing Logic</h2>
          </div>
          <div className="space-y-4">
            {mockRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-sm text-gray-600">Threshold: {(rule.threshold * 100).toFixed(0)}%</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={rule.enabled} readOnly />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Output Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <DatabaseIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Output Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <select className="w-full border border-gray-300 rounded-lg p-2">
                <option>Local Storage</option>
                <option>Cloud Storage</option>
                <option>Network Storage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select className="w-full border border-gray-300 rounded-lg p-2">
                <option>JSON</option>
                <option>CSV</option>
                <option>XML</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="save-images" className="rounded" />
              <label htmlFor="save-images" className="text-sm text-gray-700">
                Save detection images
              </label>
            </div>
          </div>
        </div>

        {/* Analytics Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Analytics Preview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Detection Rate</h3>
              <p className="text-2xl font-bold text-blue-600">24.5/min</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Average Confidence</h3>
              <p className="text-2xl font-bold text-green-600">92.3%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Processing Time</h3>
              <p className="text-2xl font-bold text-purple-600">45ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;