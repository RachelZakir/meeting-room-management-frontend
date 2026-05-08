"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { Toaster } from "sonner";
import { User, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    console.log("Dashboard layout - Token exists:", !!token);
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Get user info from localStorage
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    
    console.log("Dashboard layout - User name:", name);
    console.log("Dashboard layout - User role:", role);
    
    setUserName(name || "User");
    setUserRole(role || "USER");
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar userName={userName} userRole={userRole} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
              <p className="text-sm text-gray-500">
                {pathname === "/dashboard" && "Overview"}
                {pathname === "/dashboard/bookings" && "Manage your reservations"}
                {pathname === "/dashboard/rooms" && "View all meeting rooms"}
                {pathname === "/dashboard/users" && "Manage system users"}
                {pathname === "/dashboard/settings" && "Account settings"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}