import React from 'react';
import { Detection } from '../../types';

interface DetectionsTableProps {
  detections: Detection[];
}

const DetectionsTable: React.FC<DetectionsTableProps> = ({ detections }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Detections</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Time</th>
              <th className="text-left py-3 px-4">Camera</th>
              <th className="text-left py-3 px-4">Object Type</th>
              <th className="text-left py-3 px-4">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((detection) => (
              <tr key={detection.id} className="border-b">
                <td className="py-3 px-4">
                  {new Date(detection.timestamp).toLocaleTimeString()}
                </td>
                <td className="py-3 px-4">{detection.cameraId}</td>
                <td className="py-3 px-4 capitalize">{detection.objectType}</td>
                <td className="py-3 px-4">
                  {(detection.confidence * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetectionsTable;