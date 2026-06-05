import React from "react";
import { FaBars } from "react-icons/fa";

interface PanelHeaderProps {
  title: string;
  toggleSidebar: () => void;
}

const MobileHeader: React.FC<PanelHeaderProps> = ({ title, toggleSidebar }) => {
  return (
    <div className="lg:hidden bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-colors focus:outline-none"
        >
          <FaBars size={20} />
        </button>
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h1>
      </div>

      {/* Optional: Add User Avatar or Notification Icon here for Mobile */}
      <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
        AD
      </div>
    </div>
  );
};

export default MobileHeader;
