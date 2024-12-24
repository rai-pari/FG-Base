import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import PageHeader from './common/PageHeader';

const Database = () => {
  return (
    <div className="p-6">
      <PageHeader title="Database Configuration" />
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database Type
            </label>
            <select className="w-full border border-gray-300 rounded-lg p-2">
              <option>PostgreSQL</option>
              <option>MongoDB</option>
              <option>MySQL</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection String
            </label>
            <input
              type="text"
              placeholder="postgresql://username:password@localhost:5432/dbname"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Database;