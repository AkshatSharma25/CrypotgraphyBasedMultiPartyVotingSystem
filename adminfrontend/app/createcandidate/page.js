"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
function CreateCandidate() {
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [image, setImage] = useState("");
  const [countCandidates, setCountCandidates] = useState(0);

  const render = true;
  useEffect(() => {
    const countCandidates = localStorage.getItem("countCandidates");
    if (countCandidates) {
      setCountCandidates(countCandidates);
    }
  }, [render]);

  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const index = await axios.get("/api/getindex");
    console.log(index.data.index);
    const response = await axios.post("/api/submit", {
      name: name,
      party: party,
      image: image,
      index: index.data.index,
    });
    console.log(response.data)
    if (response.status === 200) {
      alert("Candidate created successfully");
      localStorage.setItem("countCandidates", countCandidates + 1);
    } else {
      alert("Error creating candidate");
    }
    alert(`Candidate Created: \nName: ${name}\nParty: ${party}\nImage URL: ${image}`);
    // router.push("/");
    setCountCandidates(countCandidates + 1);
    console.log(countCandidates);
    router.replace("/createcandidate");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-gray-200 to-gray-400">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-96">

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create Candidate</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Total Candidates: {countCandidates}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Candidate Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
          />
          <input
            type="text"
            placeholder="Party Name"
            value={party}
            onChange={(e) => setParty(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-lg"
          >
            Create Candidate
          </button>
        </form>
        <button onClick={() => {
          router.push("/createroom");
        }}
          className="w-full mt-2 bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition text-lg"

        >Proceed to Launch</button>
      </div>
    </div>
  );
}

export default CreateCandidate;