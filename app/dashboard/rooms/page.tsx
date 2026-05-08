"use client";
import { useEffect, useState } from "react";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Plus, 
  Wifi, 
  Video, 
  Mic, 
  Tv,
  Users,
  Calendar,
  Loader2,
  LucideIcon,
  AlertCircle,
  Info,
  PenSquare,
  Trash,
  CheckCircle,
  Clock,
  Check,
  X,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[] | string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Booking {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

interface EquipmentOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface RoomStatus {
  status: 'available' | 'occupied' | 'upcoming';
  currentBooking?: Booking;
  nextBooking?: Booking;
  color: string;
  bgColor: string;
  text: string;
  icon: LucideIcon;
}

export default function DashboardRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    equipment: [] as string[]
  });
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const equipmentOptions: EquipmentOption[] = [
    { value: "projector", label: "Projector", icon: Tv },
    { value: "whiteboard", label: "Whiteboard", icon: Tv },
    { value: "wifi", label: "WiFi", icon: Wifi },
    { value: "video-conferencing", label: "Video Conferencing", icon: Video },
    { value: "microphone", label: "Microphone", icon: Mic },
  ];

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "USER";
    setUserRole(role);
    fetchAllData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshAvailability();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRooms(), fetchBookings()]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/rooms`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("accessToken");
        toast.error("Session expired. Please login again.");
        setTimeout(() => window.location.href = "/login", 2000);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch rooms");

      const result = await response.json();
      if (result.success && result.data) {
        const activeRooms = result.data.filter((room: Room) => !room.isDeleted);
        setRooms(activeRooms);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
      toast.error("Failed to load rooms");
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/bookings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBookings(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const refreshAvailability = async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
      setLastUpdate(new Date());
      toast.success("Availability updated", { duration: 2000 });
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const getRoomStatus = (roomId: string): RoomStatus => {
    const now = new Date();
    
    // Find current booking (ongoing)
    const currentBooking = bookings.find(booking => 
      booking.roomId === roomId && 
      new Date(booking.startTime) <= now && 
      new Date(booking.endTime) >= now
    );
    
    if (currentBooking) {
      const endTime = new Date(currentBooking.endTime);
      const timeRemaining = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60));
      
      return {
        status: 'occupied',
        currentBooking,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        text: `Occupied until ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${timeRemaining} min left)`,
        icon: X
      };
    }
    
    // Find next upcoming booking
    const nextBooking = bookings
      .filter(booking => booking.roomId === roomId && new Date(booking.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
    
    if (nextBooking) {
      const startTime = new Date(nextBooking.startTime);
      const timeUntil = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60));
      
      return {
        status: 'upcoming',
        nextBooking,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        text: `Available until ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (next booking in ${timeUntil} min)`,
        icon: Clock
      };
    }
    
    // Available
    return {
      status: 'available',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      text: 'Available now',
      icon: Check
    };
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          capacity: parseInt(formData.capacity),
          equipment: formData.equipment,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("accessToken");
        toast.error("Session expired. Please login again.");
        setTimeout(() => window.location.href = "/login", 2000);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create room");
      }

      toast.success(result.message || "Room created successfully");
      setShowAddModal(false);
      resetForm();
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create room");
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/rooms/${selectedRoom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          capacity: parseInt(formData.capacity),
          equipment: formData.equipment,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("accessToken");
        toast.error("Session expired. Please login again.");
        setTimeout(() => window.location.href = "/login", 2000);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update room");
      }

      toast.success(result.message || "Room updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update room");
    }
  };

 const handleDeleteRoom = async (id: string) => {
  // Add confirmation dialog
  if (!confirm("Are you sure you want to delete this room? This action can be undone.")) return;
  
  setLoading(true); // Show loading state
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please login again");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/rooms/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("accessToken");
      toast.error("Session expired. Please login again.");
      setTimeout(() => window.location.href = "/login", 2000);
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete room");
    }

    toast.success(result.message || "Room deleted successfully");
    
    // Refresh both rooms and bookings to update availability stats
    await Promise.all([fetchRooms(), fetchBookings()]);
    
  } catch (err) {
    console.error(err);
    toast.error(err instanceof Error ? err.message : "Failed to delete room");
  } finally {
    setLoading(false);
  }
};

  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    let equipmentArray: string[] = [];
    
    if (Array.isArray(room.equipment)) {
      equipmentArray = room.equipment;
    } else if (typeof room.equipment === 'string' && room.equipment) {
      try {
        equipmentArray = JSON.parse(room.equipment);
      } catch {
        equipmentArray = [];
      }
    }
    
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      equipment: equipmentArray,
    });
    setShowEditModal(true);
  };

  const openViewModal = (room: Room) => {
    setSelectedRoom(room);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: "",
      equipment: [],
    });
    setSelectedRoom(null);
  };

  const toggleEquipment = (value: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(value)
        ? prev.equipment.filter(e => e !== value)
        : [...prev.equipment, value]
    }));
  };

  const parseEquipment = (equipment: string[] | string | null | undefined): string[] => {
    if (!equipment) return [];
    if (Array.isArray(equipment)) return equipment;
    if (typeof equipment === 'string') {
      try {
        return JSON.parse(equipment);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getEquipmentIcon = (equipment: string): LucideIcon => {
    const option = equipmentOptions.find(opt => opt.value === equipment);
    if (option) return option.icon;
    return Tv;
  };

  const getAvailabilityStats = () => {
    const now = new Date();
    const available = rooms.filter(room => {
      const status = getRoomStatus(room.id);
      return status.status === 'available';
    }).length;
    const occupied = rooms.filter(room => {
      const status = getRoomStatus(room.id);
      return status.status === 'occupied';
    }).length;
    const upcoming = rooms.filter(room => {
      const status = getRoomStatus(room.id);
      return status.status === 'upcoming';
    }).length;
    
    return { available, occupied, upcoming, total: rooms.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Rooms</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchRooms}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = getAvailabilityStats();

  return (
    <div>
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rooms Management</h1>
            <p className="text-gray-600 mt-1">Real-time room availability and booking status</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshAvailability}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            {userRole === "ADMIN" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Room
              </button>
            )}
          </div>
        </div>

        {/* Availability Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Available Now</p>
                <p className="text-3xl font-bold text-green-700">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Currently Occupied</p>
                <p className="text-3xl font-bold text-red-700">{stats.occupied}</p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <X className="text-red-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Upcoming Bookings</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Rooms</p>
                <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Last updated indicator */}
        <div className="text-right text-xs text-gray-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No rooms available.</p>
          {userRole === "ADMIN" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Add your first room
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const equipmentList = parseEquipment(room.equipment);
            const status = getRoomStatus(room.id);
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={room.id} 
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group ${status.bgColor} border-l-4 ${
                  status.status === 'available' ? 'border-l-green-500' :
                  status.status === 'occupied' ? 'border-l-red-500' :
                  'border-l-yellow-500'
                }`}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        status.status === 'available' ? 'bg-green-100 text-green-700' :
                        status.status === 'occupied' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        <StatusIcon size={12} />
                        <span>{status.status === 'available' ? 'Available' : status.status === 'occupied' ? 'Occupied' : 'Upcoming Booking'}</span>
                      </div>
                      {userRole === "ADMIN" && (
                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">ID: {room.id.slice(0, 8)}</p>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{room.name}</h3>
                  
                  {/* Status message */}
                  <div className="mb-4">
                    <p className={`text-sm ${status.color} font-medium`}>
                      {status.text}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Users size={18} className="text-blue-500" />
                      <span className="text-sm">Capacity: <span className="font-semibold">{room.capacity}</span> people</span>
                    </div>
                    
                    {equipmentList.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {equipmentList.map((item: string) => {
                          const Icon = getEquipmentIcon(item);
                          return (
                            <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              <Icon size={12} />
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openViewModal(room)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium text-sm group/btn"
                    >
                      <Eye size={16} className="text-blue-600 group-hover/btn:scale-110 transition-transform" />
                      <span>View Details</span>
                    </button>
                    
                    {userRole === "ADMIN" && (
                      <>
                        <button
                          onClick={() => openEditModal(room)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-700 rounded-lg transition-all duration-200 font-medium text-sm group/edit"
                        >
                          <PenSquare size={16} className="group-hover/edit:rotate-12 transition-transform" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 rounded-lg transition-all duration-200 font-medium text-sm group/delete"
                        >
                          <Trash size={16} className="group-hover/delete:scale-110 transition-transform" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal - Keep as before */}
      {showAddModal && (
        <Modal title="Add New Room" onClose={() => { setShowAddModal(false); resetForm(); }}>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Conference Room A"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Number of people"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment (Optional)</label>
              <div className="flex flex-wrap gap-3">
                {equipmentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.equipment.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleEquipment(option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Room Modal - Keep as before */}
      {showEditModal && selectedRoom && (
        <Modal title="Edit Room" onClose={() => { setShowEditModal(false); resetForm(); }}>
          <form onSubmit={handleUpdateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
              <div className="flex flex-wrap gap-3">
                {equipmentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.equipment.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleEquipment(option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
              >
                Update Room
              </button>
              <button
                type="button"
                onClick={() => { setShowEditModal(false); resetForm(); }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Details Modal with Availability Info */}
      {showViewModal && selectedRoom && (
        <Modal title="Room Details" onClose={() => setShowViewModal(false)}>
          <div className="space-y-4">
            {/* Status Section */}
            <div className={`rounded-lg p-4 ${getRoomStatus(selectedRoom.id).bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = getRoomStatus(selectedRoom.id);
                    const StatusIcon = status.icon;
                    return (
                      <>
                        <StatusIcon className={status.color} size={20} />
                        <span className={`font-semibold ${status.color}`}>
                          {status.status === 'available' ? 'Available Now' : 
                           status.status === 'occupied' ? 'Currently Occupied' : 
                           'Upcoming Booking'}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={refreshAvailability}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{getRoomStatus(selectedRoom.id).text}</p>
            </div>

            <div className="border-b pb-3">
              <label className="text-sm text-gray-500">Room Name</label>
              <p className="text-lg font-semibold text-gray-800">{selectedRoom.name}</p>
            </div>
            
            <div className="border-b pb-3">
              <label className="text-sm text-gray-500">Capacity</label>
              <p className="text-lg font-semibold text-gray-800">{selectedRoom.capacity} people</p>
            </div>
            
            <div className="border-b pb-3">
              <label className="text-sm text-gray-500">Equipment</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {parseEquipment(selectedRoom.equipment).length > 0 ? (
                  parseEquipment(selectedRoom.equipment).map((item: string) => {
                    const Icon = getEquipmentIcon(item);
                    return (
                      <span key={item} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
                        <Icon size={16} />
                        {item}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No equipment listed</p>
                )}
              </div>
            </div>
            
            {selectedRoom.createdAt && (
              <div className="border-b pb-3">
                <label className="text-sm text-gray-500">Created At</label>
                <p className="text-gray-800">{new Date(selectedRoom.createdAt).toLocaleString()}</p>
              </div>
            )}
            
            <button
              onClick={() => setShowViewModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition mt-4"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
