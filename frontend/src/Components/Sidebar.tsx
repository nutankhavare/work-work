// React not needed directly - using JSX transform
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToolkit } from "../Utils/Toolkit";
import { logout } from "../Services/AuthService";
import { useAuth } from "../Context/AuthContext";
import { useConfirm } from "../Context/ConfirmContext";
import { motion, AnimatePresence } from "framer-motion";

// Lucide Icons as per Design Spec
import { 
  LayoutDashboard, 
  ShieldCheck, 
  // ShieldAlert,
  UserCog, 
  Bus, 
  Users, 
  CircuitBoard, 
  // UsersRound, 
  // Briefcase, 
  // BookOpen, 
  Truck, 
  MessageSquare, 
  // FileText, 
  Settings, 
  LogOut,
  // ChevronRight,
  Megaphone,
  Headset,
  BarChart2
} from "lucide-react";

import type { SidebarLinkType } from "../Types/Index";

const app_features = [
  "VIEW DASHBOARD",
  "MANAGE ROLE PERMISIONS",
  "MANAGE EMPLOYEES",
  "MANAGE VEHICLES",
  "MANAGE DRIVERS",
  "MANAGE DEVICES",
  "MANAGE COMPLIANCE",
  "MANAGE SETTINGS",
  "MANAGE BULK COMMUNICATION",
  "MANAGE CUSTOMER CARE",
  "VIEW REPORTS",
  "MANAGE FEEDBACKS",
  "MANAGE ADS",
];

const sidebarLinks: SidebarLinkType[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
    feature: "VIEW DASHBOARD",
    requiredPermissions: ["view dashboard"],
  },
  {
    name: "Roles & Permissions",
    path: "/roles",
    icon: <ShieldCheck size={18} />,
    feature: "MANAGE ROLE PERMISIONS",
    requiredPermissions: ["view role permissions"],
  },
  {
    name: "Staff/Emp Management",
    path: "/staff",
    icon: <UserCog size={18} />,
    feature: "MANAGE EMPLOYEES",
    requiredPermissions: ["view employees"],
  },
  {
    name: "Vehicle Management",
    path: "/vehicles",
    icon: <Bus size={18} />,
    feature: "MANAGE VEHICLES",
    requiredPermissions: ["view vehicles"],
  },
  {
    name: "Driver Management",
    path: "/drivers",
    icon: <Users size={18} />,
    feature: "MANAGE DRIVERS",
    requiredPermissions: ["view drivers"],
  },
  {
    name: "Device Management",
    path: "/devices",
    icon: <CircuitBoard size={18} />,
    feature: "MANAGE DEVICES",
  },
  { 
    name: "Feedbacks", 
    path: "/feedbacks", 
    icon: <MessageSquare size={18} />, 
    feature: "MANAGE FEEDBACKS", 
  },
  { 
    name: "Reports", 
    path: "/reports", 
    icon: <BarChart2 size={18} />, 
    feature: "VIEW REPORTS", 
  },
  {
    name: "Compliance",
    path: "/compliance",
    icon: <ShieldCheck size={18} />,
    feature: "MANAGE COMPLIANCE",
  },
  {
    name: "Bulk Communication",
    path: "/bulk-communication",
    icon: <Megaphone size={18} />,
    feature: "MANAGE BULK COMMUNICATION",
    requiredPermissions: ["view communications"],
  },
  {
    name: "Ad Management",
    path: "/ads",
    icon: <Megaphone size={18} />,
    feature: "MANAGE ADS",
  },
  { 
    name: "Settings", 
    path: "/settings", 
    icon: <Settings size={18} />, 
    feature: "MANAGE SETTINGS", 
  },
  { 
    name: "Customer Care", 
    path: "/customer-care", 
    icon: <Headset size={18} />, 
    feature: "MANAGE CUSTOMER CARE", 
  },
];

interface Props {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ isOpen, closeSidebar }: Props) => {
  const location = useLocation();
  const { canAny, roles } = useToolkit();
  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const isAdmin = roles.some((role: any) => ["admin", "super admin", "org_admin", "org admin"].includes(role?.toLowerCase?.()));

  const accessibleLinks = sidebarLinks
    .filter((link) => app_features.includes(link.feature))
    .filter((link) => {
      if (!link.requiredPermissions || link.requiredPermissions.length === 0) return true;
      if (isAdmin) return true;
      return canAny(link.requiredPermissions);
    });

  const handleLogout = async () => {
    if (await confirm("Are you sure you want to logout? Any unsaved changes will be lost.")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f1028]/50 backdrop-blur-[4px] z-[60] lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <aside
        className={`sidebar shrink-0 fixed inset-y-0 left-0 z-[70] lg:static lg:z-50 transform lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Brand Section */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner" style={{ justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="brand-icon">
                <Truck size={18} color="white" />
              </div>
              <div>
                <div className="brand-name">Institute</div>
                <div className="brand-sub">Admin Panel</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-divider"></div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          {accessibleLinks.map((link) => {
            const isActive = link.path && location.pathname.startsWith(link.path);
            
            return (
              <Link
                key={link.name}
                to={link.path!}
                onClick={closeSidebar}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  {link.icon}
                </span>
                <span style={{ flex: "1 1 0%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: User & Logout */}
        <div className="sidebar-user">
          <div className="sidebar-user-divider"></div>
          <button 
            className="user-row" 
            title="Logout"
            onClick={handleLogout}
          >
            <div className="avi" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              {user?.email?.substring(0, 2).toUpperCase() || "AU"}
            </div>
            <div style={{ flex: "1 1 0%", minWidth: "0px", textAlign: "left" }}>
              <div className="user-name" style={{ textTransform: "capitalize" }}>
                {user?.name || roles[0] || "Admin User"}
              </div>
              <div className="user-email" style={{ fontSize: "11px", opacity: 0.8 }}>
                {user?.email || "admin@admin.com"}
              </div>
            </div>
            <LogOut size={14} className="user-logout-icon" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
