"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Video,
  User,
  Plus,
  X,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Edit,
  Save
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string;
}

interface Booking {
  id: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  room?: Room;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  
  const [formData, setFormData] = useState({
    roomId: "",
    startTime: "",
    endTime: "",
  });
  
  const [editFormData, setEditFormData] = useState({
    roomId: "",
    startTime: "",
    endTime: "",
  });
  
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("userRole");
    setUserRole(role || "USER");
    
    fetchBookings();
    fetchRooms();
  }, []);

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      console.log("🔵 Token found:", token ? `Yes (length: ${token.length})` : "No");
      console.log("🔵 User role:", userRole);
      
      if (!token) {
        setError("Please login to view bookings");
        setLoading(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const url = `${baseUrl}/api/bookings`;
      console.log("🔵 Fetching from URL:", url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔵 Response status:", response.status);
      
      const responseText = await response.text();
      console.log("🔵 Response body:", responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("🔴 Failed to parse JSON:", e);
        throw new Error("Invalid response from server");
      }

      if (response.status === 401 || response.status === 403) {
        console.error("🔴 Auth error:", result);
        setError(result.message || "Session expired. Please login again.");
        toast.error("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch bookings");
      }

      if (result.success && result.data) {
        setBookings(result.data);
        console.log(`✅ Fetched ${result.data.length} bookings`);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("🔴 Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };
  
 const fetchRooms = async () => {
  setFetchingRooms(true);
  try {
    const token = getToken();
    if (!token) {
      setFetchingRooms(false);
      return;
    }
    
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
        // Filter out soft-deleted rooms (isDeleted === true)
        const activeRooms = result.data.filter((room: any) => !room.isDeleted);
        setRooms(activeRooms);
        console.log(`✅ Fetched ${activeRooms.length} active rooms out of ${result.data.length} total`);
      }
    }
  } catch (err) {
    console.error("Error fetching rooms:", err);
  } finally {
    setFetchingRooms(false);
  }
};

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomId || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const startDateTime = new Date(formData.startTime);
    const endDateTime = new Date(formData.endTime);
    
    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    if (startDateTime < new Date()) {
      toast.error("Cannot book a room in the past");
      return;
    }

    setCreatingBooking(true);
    try {
      const token = getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: formData.roomId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Booking created successfully!");
        setShowCreateModal(false);
        setFormData({ roomId: "", startTime: "", endTime: "" });
        fetchBookings();
      } else {
        toast.error(result.message || "Failed to create booking");
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    
    const formatForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setEditFormData({
      roomId: booking.roomId,
      startTime: formatForInput(startTime),
      endTime: formatForInput(endTime),
    });
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.roomId || !editFormData.startTime || !editFormData.endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const startDateTime = new Date(editFormData.startTime);
    const endDateTime = new Date(editFormData.endTime);
    
    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    if (startDateTime < new Date()) {
      toast.error("Cannot edit a booking to a past time");
      return;
    }

    if (!editingBooking) return;

    setUpdatingBooking(true);
    try {
      const token = getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/bookings/${editingBooking.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: editFormData.roomId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Booking updated successfully!");
        setShowEditModal(false);
        setEditingBooking(null);
        setEditFormData({ roomId: "", startTime: "", endTime: "" });
        fetchBookings();
      } else {
        toast.error(result.message || "Failed to update booking");
      }
    } catch (err) {
      console.error("Error updating booking:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update booking");
    } finally {
      setUpdatingBooking(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      const token = getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/api/bookings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Booking cancelled successfully");
        fetchBookings();
      } else {
        toast.error(result.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookings();
    await fetchRooms();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (now >= start && now <= end) return { label: "In Progress", color: "bg-green-100 text-green-700" };
    return { label: "Completed", color: "bg-gray-100 text-gray-700" };
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const canEditOrCancel = (startTime: string) => {
    return new Date(startTime) > new Date();
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Bookings</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            My Bookings
          </h1>
          <p className="text-gray-600 mt-2">Manage your room reservations</p>
          {userRole === "ADMIN" && (
            <p className="text-xs text-blue-600 mt-1">Admin View - Showing all bookings</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            New Booking
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-800">{bookings.length}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming</p>
              <p className="text-3xl font-bold text-gray-800">
                {bookings.filter(b => new Date(b.startTime) > new Date()).length}
              </p>
            </div>
            <Clock className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available Rooms</p>
              <p className="text-3xl font-bold text-gray-800">{rooms.length}</p>
            </div>
            <Video className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Your Reservations</h2>
        </div>
        
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">No bookings yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Start by reserving a room to see it here.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Book a Room
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bookings.map((booking) => {
              const status = getStatus(booking.startTime, booking.endTime);
              const canModify = canEditOrCancel(booking.startTime);
              return (
                <div key={booking.id} className="p-6 hover:bg-gray-50 transition group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {booking.room?.name || "Unknown Room"}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-500" />
                          <span>{formatDate(booking.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-500" />
                          <span>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                        {booking.room?.capacity && (
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-blue-500" />
                            <span>Capacity: {booking.room.capacity} people</span>
                          </div>
                        )}
                        {/* Show user ID for admin view */}
                        {userRole === "ADMIN" && booking.userId && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <User size={12} />
                            <span>User ID: {booking.userId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span className="text-sm">View</span>
                      </button>
                      {canModify && (
                        <>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition flex items-center gap-1"
                          >
                            <Edit size={16} />
                            <span className="text-sm">Edit</span>
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            <span className="text-sm">Cancel</span>
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
      </div>

      {/* Create Booking Modal (same as before) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Book a Room</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateBooking} className="space-y-4">
             <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Select Room *</label>
  <select
    value={formData.roomId}
    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required
  >
    <option value="">Choose a room...</option>
    {rooms.map((room) => (
      <option key={room.id} value={room.id}>
        {room.name} (Capacity: {room.capacity}) 
{Array.isArray(room.equipment) 
  ? room.equipment.join(', ') 
  : String(room.equipment)}
      </option>
    ))}
  </select>
  {rooms.length === 0 && !fetchingRooms && (
    <p className="text-sm text-amber-600 mt-1">No active rooms available for booking.</p>
  )}
</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  min={getMinDateTime()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  min={formData.startTime || getMinDateTime()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creatingBooking}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-2 rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingBooking ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar size={18} />
                      Create Booking
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal - keep as before */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Edit Booking</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Room *</label>
                <select
                  value={editFormData.roomId}
                  onChange={(e) => setEditFormData({ ...editFormData, roomId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a room...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  min={getMinDateTime()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="datetime-local"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  min={editFormData.startTime || getMinDateTime()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updatingBooking}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingBooking ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Update Booking
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Booking Modal - keep as before */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-full p-2">
                    <Video size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedBooking.room?.name || "Unknown Room"}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={18} className="text-blue-500" />
                    <span>{formatDate(selectedBooking.startTime)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock size={18} className="text-blue-500" />
                    <span>
                      {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                    </span>
                  </div>
                  
                  {selectedBooking.room?.capacity && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Users size={18} className="text-blue-500" />
                      <span>Capacity: {selectedBooking.room.capacity} people</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">Booking ID</p>
                <p className="text-sm font-mono text-gray-600">{selectedBooking.id}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="text-sm text-gray-600">{formatDate(selectedBooking.createdAt)} at {formatTime(selectedBooking.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              {canEditOrCancel(selectedBooking.startTime) && (
                <>
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      handleEditBooking(selectedBooking);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Booking
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      handleCancelBooking(selectedBooking.id);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Cancel Booking
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}