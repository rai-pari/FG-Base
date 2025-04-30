import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CameraList from "./components/CameraList";
import ModelSelection from "./components/ModelSelection";
import ProcessingRules from "./components/ProcessingRules";
import Database from "./components/Database";
import Insights from "./components/Insights";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Configuration from "./components/Configuration";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("");

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(authStatus === "true");
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <div className="flex min-h-screen bg-[#d4d4d4]">
                <Sidebar onIndustryChange={setSelectedIndustry} />
                <main className="flex-1 ml-64">
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Configuration selectedIndustry={selectedIndustry} />} />
                    <Route path="/dashboard" element={<Dashboard selectedIndustry={selectedIndustry} />} />
                    <Route path="/cameras" element={<CameraList />} />
                    <Route path="/models" element={<ModelSelection selectedIndustry={selectedIndustry} />} />
                    <Route path="/rules" element={<ProcessingRules selectedIndustry={selectedIndustry} />} />
                    <Route path="/database" element={<Database />} />
                    <Route path="/insights" element={<Insights />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;