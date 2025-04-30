import { Save, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setConnectionStatus, setDatabaseInfo } from '../store/api/localData/databaseSlice';

const DatabaseConfig = () => {
  const dispatch = useDispatch();
  const { isConnected } = useSelector((state) => state.database);

  const [formData, setFormData] = useState({
    db_type: 'mongodb', // Default database type
    connection_string: '',
    password: '',
    db_name: ''
  });
  const [testLoading, setTestLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const testConnection = async () => {
    if (!formData.connection_string || !formData.password || !formData.db_name || !formData.db_type) {
      setError('All fields are required');
      return;
    }

    setError('');
    setTestLoading(true);

    try {
      const response = await axios.post(`http://localhost:8000/connect-${formData.db_type}`, formData);
      alert(response.data.message || 'Connection test completed');
      
      // Update Redux state
      dispatch(setConnectionStatus(true));
      dispatch(setDatabaseInfo({
        dbType: formData.db_type,
        dbName: formData.db_name
      }));
    } catch (error) {
      alert('Failed to connect to the database');
      dispatch(setConnectionStatus(false));
    } finally {
      setTestLoading(false);
    }
  };

  const disconnect = async () => {
    setDisconnectLoading(true);
    try {
      await axios.post('http://localhost:8000/disconnect');
      alert('Disconnected successfully');
      
      // Update Redux state
      dispatch(setConnectionStatus(false));
    } catch (error) {
      alert('Failed to disconnect');
    } finally {
      setDisconnectLoading(false);
    }
  };

  // Custom button style classes based on disabled state
  const getButtonClass = (baseClass, isDisabled) => {
    return `${baseClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`;
  };

  const getDisconnectButtonClass = (isDisabled) => {
    return `px-4 py-2 bg-red-600 text-white rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`;
  };

  const getTestButtonClass = (isDisabled) => {
    return `px-4 py-2 border border-gray-300 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {/* Connection Status Indicator */}
          {isConnected && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
              <span>Connected to database</span>
            </div>
          )}
          
          {/* Database Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
            <select
              name="db_type"
              className="w-full border border-gray-300 rounded-lg p-2"
              value={formData.db_type}
              onChange={handleChange}
            >
              <option value="mongodb">MongoDB</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Connection String</label>
            <input
              type="text"
              name="connection_string"
              placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/mydatabase?retryWrites=true&w=majority"
              className="w-full border border-gray-300 rounded-lg p-2"
              value={formData.connection_string}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
              <input
                type="text"
                name="db_name"
                placeholder="Enter database name"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.db_name}
                onChange={handleChange}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="text-red-500">{error}</div>}
          <div className="flex gap-4">
            <button
              className={getButtonClass("px-4 py-2 bg-blue-600 text-white rounded-lg", testLoading || disconnectLoading)}
              disabled={testLoading || disconnectLoading}
            >
              <Save className="w-4 h-4 inline" /> Save
            </button>
            <button
              className={getTestButtonClass(testLoading || isConnected)}
              onClick={testConnection}
              disabled={testLoading || isConnected}
              title={isConnected ? "Already connected" : "Test database connection"}
            >
              {testLoading ? (
                'Connecting...'
              ) : isConnected ? (
                <>
                  <RefreshCw className="w-4 h-4 inline" /> Connected
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 inline" /> Connect
                </>
              )}

            </button>
            <button
              className={getDisconnectButtonClass(disconnectLoading || !isConnected)}
              onClick={disconnect}
              disabled={disconnectLoading || !isConnected}
              title={!isConnected ? "Not connected" : "Disconnect from database"}
            >
              {disconnectLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfig;