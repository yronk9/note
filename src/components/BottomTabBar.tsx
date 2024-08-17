import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, FolderOpen, PlusSquare } from "lucide-react";

const BottomTabBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav bg-sky-dark text-cloud-white p-4 flex justify-around items-center">
      <Link
        to="/"
        className={`text-2xl ${location.pathname === "/" ? "text-cloud-white" : "text-sky-light"}`}
      >
        <HomeIcon size={24} />
      </Link>
      <Link
        to="/folders"
        className={`text-2xl ${location.pathname === "/folders" ? "text-cloud-white" : "text-sky-light"}`}
      >
        <FolderOpen size={24} />
      </Link>
      <Link
        to="/add-note"
        className={`text-2xl ${location.pathname === "/add-note" ? "text-cloud-white" : "text-sky-light"}`}
      >
        <PlusSquare size={24} />
      </Link>
    </nav>
  );
};

export default BottomTabBar;