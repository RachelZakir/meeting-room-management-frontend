"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // ✅ FIXED: Hardcode the URL temporarily to test
      const baseUrl = "https://meeting-room-management-backend.onrender.com";
      
      console.log("API URL:", baseUrl); // Debug log
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", response.status); // Debug log
      
      const result = await response.json();
      console.log("Login response:", result);
      
      if (response.ok && result.success) {
        localStorage.setItem("accessToken", result.accessToken);
        
        if (result.user) {
          localStorage.setItem("userId", result.user.id);
          localStorage.setItem("userName", result.user.name);
          localStorage.setItem("userEmail", result.user.email);
          localStorage.setItem("userRole", result.user.role);
          
          console.log("User data stored:", {
            name: result.user.name,
            role: result.user.role,
            email: result.user.email
          });
        }
        
        toast.success(`Welcome ${result.user?.name || email.split('@')[0]}!`);
        router.push("/dashboard");
      } else {
        setError(result.message || "Login failed. Please check your credentials.");
        toast.error(result.message || "Login failed");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "An error occurred during login. Please try again.");
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 mb-4">
            <User className="text-white" size={40} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-400 mt-2">Sign in to manage your bookings</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-gray-400 text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-blue-400 hover:text-blue-300 font-medium transition"
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}