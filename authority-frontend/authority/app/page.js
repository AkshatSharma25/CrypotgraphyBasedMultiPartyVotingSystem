"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function HomePage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  useEffect(()=>{
    const check=localStorage.getItem("check");
  if(!check){
    router.push("/login")
  }
  })
  
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl text-center w-96">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to SecureVote</h1>
        <p className="text-gray-600 mb-6">
          Your trusted, secure, and verifiable online voting system.
        </p>
        <button
          onClick={() => router.push("/share")}
          className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition text-lg mb-4"
        >
          Get Started
        </button>
        
        {message && <p className="text-center text-red-500 mt-4">{message}</p>}
      </div>
    </div>
  );
}

export default HomePage;
