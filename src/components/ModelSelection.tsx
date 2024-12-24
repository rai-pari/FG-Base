import React from 'react';
import { DetectionModel } from '../types';
import { mockModels } from '../data/mockData';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from './common/PageHeader';

const ModelSelection = () => {
  const [selectedModel, setSelectedModel] = React.useState<string>(mockModels[0].id);

  return (
    <div className="p-6">
      <PageHeader title="Detection Models" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockModels.map((model) => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`cursor-pointer bg-white rounded-lg shadow-md p-6 ${
              selectedModel === model.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{model.name}</h3>
                <p className="text-gray-600 mt-1">{model.description}</p>
              </div>
              {selectedModel === model.id && (
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Accuracy:</span>
                <span className="text-sm font-semibold">{(model.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-semibold capitalize">{model.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelection;