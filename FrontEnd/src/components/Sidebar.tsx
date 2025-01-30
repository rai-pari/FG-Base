import {
  LayoutDashboard,
  Camera,
  MonitorPlay,
  Settings,
  BarChart3,
  Database,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Camera, label: "Cameras", path: "/cameras" },
    { icon: MonitorPlay, label: "Detection Models", path: "/models" },
    { icon: Settings, label: "Processing Rules", path: "/rules" },
    { icon: Database, label: "Database", path: "/database" },
    { icon: BarChart3, label: "Insights", path: "/insights" },
  ];

  return (
    <div className="h-screen w-64 bg-white text-[#F7493B] px-4 py-3 fixed left-0 top-0 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* CamAI Branding */}
        <div className="flex flex-col items-center gap-2 mb-6">
          {/* Logo below CamAI */}
          <img
            src="FaceGenie Logo.png"
            alt="Logo"
            className="w-40 h-10 object-contain"
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-500 ${
                  isActive
                    ? "bg-red-500 text-white"
                    : "hover:text-white hover:bg-red-400"
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
        <img src="LOGO 1.png" alt="Logo" className="w-40 h-20 object-contain" />
      </div>
    </div>
  );
};

export default Sidebar;
