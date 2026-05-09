"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getUserRole,
  User as ApiUser,  // Renamed to ApiUser to avoid conflict with lucide-react's User icon
  UpdateUserData,
  CreateUserData
} from "@/services/api";
import { 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  User,  // Keep this as the icon component
  Mail, 
  Shield, 
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  RefreshCw,
  Plus,
  Lock
} from "lucide-react";

// Type alias for clarity
type User = ApiUser;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({ name: "", email: "", role: "USER" });
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    role: "USER"
  });
  const [addingUser, setAddingUser] = useState(false);
  
  const role = getUserRole();
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    if (isAdmin) {
      console.log("Fetching users list...");
      const result = await getUsers();
      console.log("Users API response:", result);
      
      if (result.success && result.data) {
        setUsers(result.data);
      } else if (Array.isArray(result)) {
        setUsers(result);
      } else {
        setUsers([]);
      }
    } else {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          const result = await getUserById(decoded.id);
          
          if (result.success && result.data) {
            setCurrentUser(result.data);
          } else {
            // Handle case where response might be directly the user object
            const responseData = result as any;
            if (responseData.id && responseData.name && responseData.email) {
              setCurrentUser(responseData as User);
            }
          }
        } catch (err) {
          console.error("Error decoding token:", err);
        }
      }
    }
  } catch (error: any) {
    console.error("Error fetching users:", error);
    setError(error.message || "Failed to load users");
    toast.error(error.message || "Failed to load users");
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ 
      name: user.name, 
      email: user.email,
      role: user.role 
    });
  };

  const handleUpdate = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const result = await updateUser(editingUser!.id, editForm);
      
      toast.success("User updated successfully");
      
      if (isAdmin) {
        await fetchData();
      } else {
        if (result.success && result.data) {
          setCurrentUser(result.data);
        }
        localStorage.setItem("userName", editForm.name || "");
        localStorage.setItem("userEmail", editForm.email || "");
        if (editForm.role) {
          localStorage.setItem("userRole", editForm.role);
        }
      }
      
      setEditingUser(null);
      setViewingUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      await deleteUser(id);
      toast.success("User deleted successfully");
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleAddUser = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (addForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setAddingUser(true);
    try {
      const result = await createUser(addForm);
      
      if (result.success) {
        toast.success("User created successfully");
        setShowAddModal(false);
        setAddForm({ name: "", email: "", password: "", role: "USER" });
        await fetchData();
      } else {
        toast.error(result.message || "Failed to create user");
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setAddingUser(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
    }
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Users</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Regular User View - Personal Profile
  if (!isAdmin && currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">View and manage your account information</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex justify-center -mt-16 mb-6">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-full p-4">
                  <User className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {editingUser ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                  >
                    <Check size={18} /> Save Changes
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                  >
                    <X size={18} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <User className="text-blue-600" size={22} />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
                      <p className="font-semibold text-gray-800 text-lg">{currentUser.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <Mail className="text-blue-600" size={22} />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email Address</p>
                      <p className="font-semibold text-gray-800 text-lg">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <Shield className="text-blue-600" size={22} />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        currentUser.role === "ADMIN" 
                          ? "bg-purple-100 text-purple-700" 
                          : "bg-green-100 text-green-700"
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                  {currentUser.createdAt && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <Calendar className="text-blue-600" size={22} />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                        <p className="font-semibold text-gray-800">{formatDateTime(currentUser.createdAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(currentUser)}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-3 rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Pencil size={18} /> Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin View - All Users Table
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Manage all users in the system</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            Add User
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

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-full p-2">
                        <User size={16} className="text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.role === "ADMIN" 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {user.role}
                    </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {formatDate(user.createdAt)}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewingUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit User"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Add your first user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter user's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as 'USER' | 'ADMIN' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddUser}
                disabled={addingUser}
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-2 rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingUser ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Create User
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal for Admin */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'USER' | 'ADMIN' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg transition font-medium"
              >
                Update User
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingUser(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
              <button
                onClick={() => setViewingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-full p-4">
                  <User size={48} className="text-white" />
                </div>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
                <p className="font-semibold text-gray-800 text-lg">{viewingUser.name}</p>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email Address</p>
                <p className="font-semibold text-gray-800 text-lg">{viewingUser.email}</p>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  viewingUser.role === "ADMIN" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-green-100 text-green-700"
                }`}>
                  {viewingUser.role}
                </span>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                <p className="font-semibold text-gray-800">{formatDateTime(viewingUser.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setViewingUser(null);
                  handleEdit(viewingUser);
                }}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Pencil size={16} /> Edit User
              </button>
              <button
                onClick={() => setViewingUser(null)}
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