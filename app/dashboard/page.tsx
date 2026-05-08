"use client";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  CalendarCheck,
  Clock as ClockIcon,
  ChevronRight,
  ArrowRight,
  User,
  Building2,
  Coffee,
  CheckCircle2,
  XCircle,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Booking {
  id: string;
  userId: string;
  roomId: string;
  room: { 
    id: string;
    name: string; 
    capacity: number;
    equipment: string;
  };
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string | string[];
  isDeleted?: boolean;
}

interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  ongoingBookings: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  bookingRate: number;
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    ongoingBookings: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    bookingRate: 0
  });
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User";
    const role = localStorage.getItem("userRole") || "USER";
    setUserName(name);
    setUserRole(role);
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      fetchDashboardData();
    }
  }, [router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBookings(),
        fetchRooms()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBookings(result.data);
          return result.data;
        }
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
    return [];
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return [];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const activeRooms = result.data.filter((room: Room) => !room.isDeleted);
          setRooms(activeRooms);
          return activeRooms;
        }
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
    return [];
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const calculateRoomStatus = (roomId: string, bookings: Booking[]) => {
    const now = new Date();
    const currentBooking = bookings.find(booking => 
      booking.roomId === roomId &&
      new Date(booking.startTime) <= now &&
      new Date(booking.endTime) >= now
    );
    return currentBooking ? 'occupied' : 'available';
  };

  useEffect(() => {
    const calculateStats = async () => {
      const currentBookings = bookings;
      const currentRooms = rooms;
      
      const now = new Date();
      
      // Calculate booking stats
      const upcoming = currentBookings.filter(b => new Date(b.startTime) > now);
      const ongoing = currentBookings.filter(b => 
        new Date(b.startTime) <= now && new Date(b.endTime) >= now
      );
      const completed = currentBookings.filter(b => new Date(b.endTime) < now);
      
      // Calculate room stats
      const occupiedRooms = currentRooms.filter(room => 
        calculateRoomStatus(room.id, currentBookings) === 'occupied'
      ).length;
      
      const availableRooms = currentRooms.filter(room => 
        calculateRoomStatus(room.id, currentBookings) === 'available'
      ).length;
      
      const bookingRate = currentRooms.length > 0 
        ? (occupiedRooms / currentRooms.length) * 100 
        : 0;

      setStats({
        totalBookings: currentBookings.length,
        upcomingBookings: upcoming.length,
        completedBookings: completed.length,
        ongoingBookings: ongoing.length,
        totalRooms: currentRooms.length,
        availableRooms: availableRooms,
        occupiedRooms: occupiedRooms,
        bookingRate: Math.round(bookingRate)
      });
    };

    calculateStats();
  }, [bookings, rooms]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusColor = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return { bg: "bg-blue-100", text: "text-blue-700", label: "Upcoming" };
    if (now >= start && now <= end) return { bg: "bg-green-100", text: "text-green-700", label: "Ongoing" };
    return { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" };
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings
      .filter(b => new Date(b.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = userName.split(' ')[0];
  const upcomingBookings = getUpcomingBookings();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            {getGreeting()}, {firstName}! 👋 Welcome back to your workspace.
          </p>
          {userRole === "ADMIN" && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              <User size={12} />
              Admin Access
            </span>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition disabled:opacity-50"
        >
          <Activity size={18} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Bookings Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Bookings</p>
              <p className="text-4xl font-bold mt-2">{stats.totalBookings}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <CalendarCheck size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
            <TrendingUp size={14} />
            <span>All time reservations</span>
          </div>
        </div>

        {/* Upcoming Bookings Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Upcoming</p>
              <p className="text-4xl font-bold mt-2">{stats.upcomingBookings}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <ClockIcon size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-100 text-sm">
            <Calendar size={14} />
            <span>Scheduled bookings</span>
          </div>
        </div>

        {/* Ongoing Bookings Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Ongoing</p>
              <p className="text-4xl font-bold mt-2">{stats.ongoingBookings}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <Video size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-amber-100 text-sm">
            <Activity size={14} />
            <span>In progress now</span>
          </div>
        </div>

        {/* Rooms Available Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Rooms Available</p>
              <p className="text-4xl font-bold mt-2">{stats.availableRooms}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <Building2 size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-purple-100 text-sm">
            <CheckCircle2 size={14} />
            <span>Out of {stats.totalRooms} total rooms</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Room Utilization Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Room Utilization</h3>
            <Users size={20} className="text-blue-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Current Occupancy</span>
                <span className="font-semibold">{stats.bookingRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.bookingRate}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Available</span>
                <span className="font-semibold text-gray-800">{stats.availableRooms}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Occupied</span>
                <span className="font-semibold text-gray-800">{stats.occupiedRooms}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.completedBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.upcomingBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.ongoingBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Ongoing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalRooms}</p>
              <p className="text-xs text-gray-500 mt-1">Total Rooms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h2>
              <p className="text-sm text-gray-500 mt-1">Your scheduled room reservations</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/bookings')}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition"
            >
              View all
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              <Calendar className="text-gray-400" size={48} />
            </div>
            <p className="text-gray-600 text-lg font-medium">No upcoming bookings</p>
            <p className="text-gray-400 text-sm mt-1 text-center">
              Start by reserving a room to see it here.
            </p>
            <button
              onClick={() => router.push('/dashboard/bookings')}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Video size={18} />
              Book a Room
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingBookings.map((booking) => {
              const status = getStatusColor(booking.startTime, booking.endTime);
              return (
                <div 
                  key={booking.id} 
                  className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all group cursor-pointer"
                  onClick={() => router.push(`/dashboard/bookings`)}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                          {booking.room?.name || "Unknown Room"}
                        </h3>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        {booking.room?.capacity && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            <Users size={12} />
                            {booking.room.capacity} seats
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-blue-400" />
                          <span>{formatDate(booking.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-blue-400" />
                          <span>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                        {booking.room?.equipment && (
                          <div className="flex items-center gap-1.5">
                            <Video size={14} className="text-blue-400" />
                            <span className="truncate max-w-md">
                              {typeof booking.room.equipment === 'string' 
                                ? JSON.parse(booking.room.equipment).slice(0, 2).join(', ')
                                : booking.room.equipment.slice(0, 2).join(', ')}
                              {booking.room.equipment && JSON.parse(booking.room.equipment).length > 2 && '...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/bookings`);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium shadow-sm hover:shadow flex items-center gap-1 group/btn"
                      >
                        View Details
                        <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="bg-white rounded-full p-2 shadow-sm">
            <Coffee size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">Pro Tip</h4>
            <p className="text-sm text-gray-600">
              Book rooms at least 1 hour in advance to ensure availability. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}