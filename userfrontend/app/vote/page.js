"use client";
import axios from "axios";
import { useState, useEffect } from "react";

function VotingPage() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const load = true;
  const [candidates, setCandidates] = useState([]);
  useEffect(() => {
    const fetchCandidates = async () => {
      const response = await fetch("/api/getcandi");
      const data = await response.json();
      setCandidates(data.candidates);
    }
    fetchCandidates();
    console.log(candidates);
  }, [load]);
  // const candidates = [
  //   { id: 1, name: "Alice Johnson", party: "Party A", image: "https://via.placeholder.com/150" },
  //   { id: 2, name: "Bob Smith", party: "Party B", image: "https://via.placeholder.com/150" },
  //   { id: 3, name: "Charlie Brown", party: "Party C", image: "https://via.placeholder.com/150" },
  //   { id: 4, name: "Diana Prince", party: "Party D", image: "https://via.placeholder.com/150" },
  //   { id: 5, name: "Ethan Hunt", party: "Party E", image: "https://via.placeholder.com/150" },
  // ];

  function modExp(base, exponent, modulus) {
    let result = 1;
    base = base % modulus;
    while (exponent > 0) {
      if (exponent % 2 === 1) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2;
      base = (base * base) % modulus;
    }
    return result;
  }

  function oneHotEncode(vote, numCandidates) {
    let oneHot = new Array(numCandidates).fill(0);
    oneHot[vote] = 1;
    return oneHot;
  }
  function paillierEncrypt(n, g, message, r = 2) {
    console.log("message ", message)
    n = parseInt(n);
    g = parseInt(g);
    r = parseInt(r);
    // const [n, g] = publicKey;
    const nSquared = n * n;
    console.log(nSquared, g, n, r);
    return (modExp(g, message, nSquared) * modExp(r, n, nSquared)) % nSquared;
  }
  const handleVote = async () => {

    if (selectedCandidate !== null) {
      console.log(selectedCandidate)
      alert(`You voted`);
      const n = parseInt(localStorage.getItem("key1"));
      const g = parseInt(localStorage.getItem("key2"));
      const vote = oneHotEncode(selectedCandidate, 4);
      console.log(vote);

      const encrypted = vote.map(bit => paillierEncrypt(n, g, bit));
      console.log("encrypted : ", encrypted);
      // const totalEncryptedVotes = encrypted.slice();

      // for (let candidateIndex = 0; candidateIndex < 4; candidateIndex++) {
      //   totalEncryptedVotes[candidateIndex] =
      //     (totalEncryptedVotes[candidateIndex] * encrypted[candidateIndex]) % (publicKey[0] ** 2);
      // }

      const res = await axios.post('http://127.0.0.1:5500/api/vote', {
        vote: encrypted
      })


    } else {
      alert("Please select a candidate before submitting your vote.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 flex justify-between">
        <h1 className="text-xl font-bold">Voting Room</h1>
        <div className="text-lg">Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</div>
      </nav>
      <div className="flex flex-col items-center mt-10">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Select Your Candidate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.index}
              className={`p-6 bg-white shadow-md rounded-lg cursor-pointer transition transform hover:scale-105 ${selectedCandidate === candidate.index ? 'border-4 border-blue-500' : ''}`}
              onClick={() => setSelectedCandidate(candidate.index)}
            >
              <img src={candidate.image} alt={candidate.name} className="w-full h-40 object-cover rounded-md mb-4" />
              <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
              <p className="text-gray-700">{candidate.party}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => { handleVote() }}
          className="mt-6 mb-16 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
        >
          Submit Vote
        </button>
      </div>
    </div>
  );
}

export default VotingPage;