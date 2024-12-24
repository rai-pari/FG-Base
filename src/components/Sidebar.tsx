import React from 'react';
import { LayoutDashboard, Camera, MonitorPlay, Settings, BarChart3, Database } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Camera, label: 'Cameras', path: '/cameras' },
    { icon: MonitorPlay, label: 'Detection Models', path: '/models' },
    { icon: Settings, label: 'Processing Rules', path: '/rules' },
    { icon: Database, label: 'Database', path: '/database' },
    { icon: BarChart3, label: 'Insights', path: '/insights' },
  ];

  return (
    <div className="h-screen w-64 bg-gray-900 text-white p-4 fixed left-0 top-0 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* CamAI Branding */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <MonitorPlay className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold">CamAI</span>
          {/* Logo below CamAI */}
          <img 
            src="FaceGenie Logo.png" 
            alt="Logo" 
            className="w-50 h-30 object-contain mt-2" 
          />
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logo */}
      <div className="flex justify-center mt-8">
        <img 
          src="LOGO 1.png" 
          alt="Logo" 
          className="w-40 h-20 object-contain"
        />
      </div>
    </div>
  );
};

export default Sidebar;
