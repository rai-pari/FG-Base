import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CameraList from './components/CameraList';
import ModelSelection from './components/ModelSelection';
import ProcessingRules from './components/ProcessingRules';
import Database from './components/Database';
import Insights from './components/Insights';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cameras" element={<CameraList />} />
            <Route path="/models" element={<ModelSelection />} />
            <Route path="/rules" element={<ProcessingRules />} />
            <Route path="/database" element={<Database />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;