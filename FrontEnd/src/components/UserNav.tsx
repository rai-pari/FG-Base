import React, { useState } from "react";
import { LogOut, LayoutGrid, User } from "lucide-react";
// import Link from "next/link";

const UserNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  //   const userString = sessionStorage.getItem("user");
  //   const userData = userString
  //     ? JSON.parse(sessionStorage.getItem("user") || "")
  //     : { role_id: "", name: "", username: "" };

  //   const role = "Admin";

  return (
    <div className="relative">
      {/* Profile Dropdown Trigger */}
      <div
        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded-md"
        onClick={() => setOpen(!open)}
      >
        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
          {/* {userData?.name.charAt(0).toUpperCase()} */}J
        </div>
        <div>
          <h3 className="text-sm font-medium">
            {/* {userData?.name} */}
            Jayesh Dave
          </h3>
          <h4 className="text-xs text-gray-600">
            {/* {role} */}
            Admin
          </h4>
        </div>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-20">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">
              {/* {userData?.name} */}
              Jayesh Dave
            </p>
            <p className="text-xs text-gray-500">
              {/* {userData?.username} */}
              jayesh@100
            </p>
          </div>
          <ul>
            <li className="p-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
              {/* <Link href="/dashboard" className="flex items-center gap-2"> */}
              <LayoutGrid className="w-4 h-4" /> Dashboard
              {/* </Link> */}
            </li>
            <li className="p-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
              {/* <Link href="/profile" className="flex items-center gap-2"> */}
              <User className="w-4 h-4" /> Profile
              {/* </Link> */}
            </li>
          </ul>
          <div
            className="p-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            onClick={() => alert("Logging out...")}
          >
            <LogOut className="w-4 h-4" /> Logout
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNav;
