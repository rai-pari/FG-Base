import UserNav from "./UserNav";
import { MonitorPlay } from "lucide-react";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const pageNameItems = [
    { pageName: "Configuration", path: "/" },
    { pageName: "Dashboard", path: "/dashboard" },
    { pageName: "Cameras", path: "/cameras" },
    { pageName: "Detection Models", path: "/models" },
    { pageName: "Processing Rules", path: "/rules" },
    { pageName: "Database", path: "/database" },
    { pageName: "Insights", path: "/insights" },
  ];

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-6 flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4 lg:space-x-0">
          {/* <Image
            src="/images/logo_gokaldas.png"
            alt="Gokaldas Logo"
            width={100}
            height={100}
            className="h-16 w-[120px]"
          /> */}
          {/* <img
            src="/images/logo_gokaldas.png"
            alt="Gokaldas Logo"
            width="120px"
            className="h-16"
          /> */}
          <h1 className="font-bold text-[20px]">
            {pageNameItems.find((item) => location.pathname === item.path)
              ?.pageName || "PageName"}
          </h1>
        </div>

        <div className="flex justify-center gap-2">
          <MonitorPlay className="w-8 h-8 text-red-500" />
        </div>

        {/* <div className="text-[30px] font-bold">Cam AI</div> */}

        <div className="flex items-center">
          <UserNav />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
