"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router=useRouter();
  const handleLogin = () => {
    if (username === "admin" && password === "password123") {
      alert("Login successful");
      // Redirect to admin dashboard or perform authentication logic
      localStorage.setItem("checkme",true);
      router.push("/");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-gray-200 to-gray-400">
      <div className="bg-white p-8 rounded-lg shadow-2xl text-center w-96">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition text-lg"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;