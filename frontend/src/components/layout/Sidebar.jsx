import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Database, 
  BarChart2, 
  Settings, 
  LogOut,
  Sparkles,
  History,
  Search
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const activeTab = location.pathname;

  const menuItems = [
    { id: "/agent", label: "Dashboard", icon: LayoutDashboard },
    { id: "/data", label: "Data Sources", icon: Database },
    { id: "/explorer", label: "Data Explorer", icon: Search },
    { id: "/analytics", label: "Analytics", icon: BarChart2 },
    { id: "/history", label: "Control Center", icon: History },
    { id: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-[#09090b]/80 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nexus</h1>
          <p className="text-xs text-blue-400 font-medium">AI Analytics</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? "text-white" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-blue-400" : "group-hover:text-gray-300"}`} />
              <span className="font-medium relative z-10 text-sm">{item.label}</span>
              
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
          <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
