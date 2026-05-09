// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  message?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}
interface Room {
  id: number;
  name: string;
  equipment: string[]; // ✅ explicitly an array of strings
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'USER' | 'ADMIN';
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("accessToken");
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

//  AUTH FUNCTIONS 

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store user info if available
      if (data.user) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);
      }
      localStorage.setItem("accessToken", data.accessToken);
      
      return {
        success: true,
        accessToken: data.accessToken,
        user: data.user,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Login failed',
        accessToken: '',
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      accessToken: '',
    };
  }
}

export function getUserRole(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("userRole") || "USER";
  }
  return "USER";
}

export function getUserName(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("userName") || "User";
  }
  return "User";
}

export function getUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("userId");
  }
  return null;
}

export async function fetchCurrentUser(token: string): Promise<UserInfo | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

// ============ USER MANAGEMENT FUNCTIONS ============

export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    const token = localStorage.getItem("accessToken");
    console.log("Fetching users with token:", token ? "Present" : "Missing");
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log("Get users response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const data = await response.json();
    console.log("Get users response data:", data);
    
    // Handle different response structures from backend
    if (data.success && data.data) {
      return { success: true, data: data.data, meta: data.meta };
    } else if (data.users) {
      return { success: true, data: data.users };
    } else if (Array.isArray(data)) {
      return { success: true, data: data };
    } else if (data.data && Array.isArray(data.data)) {
      return { success: true, data: data.data };
    }
    
    return { success: false, data: [], message: "Invalid response format" };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { 
      success: false, 
      data: [], 
      message: error instanceof Error ? error.message : 'Failed to fetch users' 
    };
  }
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return { success: true, data: data.data };
    } else if (data.user) {
      return { success: true, data: data.user };
    } else if (data.id) {
      return { success: true, data: data as User };
    }
    
    return { success: false, message: "User not found" };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch user' 
    };
  }
}

export async function updateUser(id: string, userData: UpdateUserData): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return { success: true, data: data.data };
    } else if (data.user) {
      return { success: true, data: data.user };
    } else if (data.id) {
      return { success: true, data: data as User };
    }
    
    return { success: false, message: "Failed to update user" };
  } catch (error) {
    console.error('Error updating user:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update user' 
    };
  }
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: data.message || "User deleted successfully" };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete user' 
    };
  }
}

export async function createUser(userData: CreateUserData): Promise<ApiResponse<User>> {
  try {
    console.log("Creating user with data:", userData);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'USER'
      }),
    });

    console.log("Create user response status:", response.status);
    const data = await response.json();
    console.log("Create user response data:", data);

    if (!response.ok) {
      throw new Error(data.message || `Failed to create user: ${response.status}`);
    }

    if (data.success && data.data) {
      return { success: true, data: data.data, message: data.message };
    } else if (data.user) {
      return { success: true, data: data.user };
    } else if (data.id) {
      return { success: true, data: data as User };
    }
    
    return { success: false, message: data.message || "Failed to create user" };
  } catch (error) {
    console.error('Error creating user:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create user' 
    };
  }
}

// ============ BOOKING FUNCTIONS ============

export async function getBookings(): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

export async function createBooking(bookingData: any): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error('Failed to create booking');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

export async function cancelBooking(id: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel booking');
    }
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
}

// ============ HELPER FUNCTIONS ============

export function logout(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");
  if (typeof window !== 'undefined') {
    window.location.href = "/login";
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem("accessToken");
  }
  return false;
}

export function isAdmin(): boolean {
  return getUserRole() === "ADMIN";
}