"use client";
import { React, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
function AdminHome() {
  const router = useRouter();
  const render = true;
  useEffect(() => {
    const checkme = localStorage.getItem("checkme");
    if (!checkme) {
      router.push("/login");
    }
  }, [render]);
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4 text-center text-xl font-bold">
        Admin Dashboard
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome, Admin!</h1>
        <p className="text-lg text-gray-700 mb-8">Manage the voting system efficiently.</p>
        <button onClick={() => {
          router.push("/createcandidate");
        }} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-lg">
          create room
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        &copy; {new Date().getFullYear()} Voting System. All rights reserved.
      </footer>
    </div>
  );
}

export default AdminHome;