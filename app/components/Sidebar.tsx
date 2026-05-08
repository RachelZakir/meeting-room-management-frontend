"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings,
  User,
  LogOut,
  DoorOpen
} from "lucide-react";

interface SidebarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/bookings", icon: Calendar, label: "My Bookings" },
    { href: "/dashboard/rooms", icon: DoorOpen, label: "Rooms" },
  ];

  // Add Users link only for ADMIN
  if (userRole === "ADMIN") {
    navItems.push({ href: "/dashboard/users", icon: Users, label: "Users" });
    navItems.push({ href: "/dashboard/settings", icon: Settings, label: "Settings" });
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              RoomBooking
            </h1>
            <p className="text-xs text-gray-400">Enterprise</p>
          </div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {userName || "User"}
            </p>
            <p className="text-xs text-gray-400">
              {userRole || "USER"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon size={20} className={active ? "text-white" : "group-hover:text-white"} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1 h-6 rounded-full bg-white" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:text-white" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}