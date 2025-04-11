"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
function HomePage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [votes, setvotes] = useState([]);
  const [shares, setshares] = useState([]);
  useEffect(() => {
    // const check = localStorage.getItem("check");
    var n = localStorage.getItem("key1");
    const g = localStorage.getItem("key2");
    // if (!n) {
    //   const fetch = async () => {
    //     const res = await axios.post("http://127.0.0.1:5500/api/login", { login: "admin", password: "admin" });
    //     console.log(res);
    //     console.log(res.data.public_key[0]);
    //     localStorage.setItem("key1", res.data.storedValue);
    //   }

    //   fetch();
    // }
    // if (!check) {
    //   router.push("/login")
    // }
  }, [])

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

  function extendedGCD(a, b) {
    if (a === 0) return { gcd: b, x: 0, y: 1 };
    const { gcd, x, y } = extendedGCD(b % a, a);
    return { gcd, x: y - (b / a) * x, y: x };
  }

  function modInverse(a, m) {
    const { gcd, x } = extendedGCD(a, m);
    if (gcd !== 1) throw new Error("Modular inverse does not exist");
    return ((x % m) + m) % m;
  }


  function lagrangeInterpolation(shares, prime) {
    let secret = 0;
    for (let i = 0; i < shares.length; i++) {
      let [x_i, y_i] = shares[i];
      let numerator = 1, denominator = 1;

      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          let [x_j, _] = shares[j];
          numerator = (numerator * (-x_j)) % prime;
          denominator = (denominator * (x_i - x_j)) % prime;
        }
      }

      let denominatorInv = modInverse(denominator, prime);
      let term = (y_i * numerator * denominatorInv) % (prime);
      secret = (secret + term) % (prime);
    }
    return secret;
  }


  // function paillierDecrypt(privateKey, ciphertext, n) {
  //   const [lambda_n, mu, n] = privateKey;
  //   const nSquared = n * n;
  //   const L = x => (x - 1) / n;  // L function: (x-1)/n
  //   return (L(modExp(ciphertext, privateKey, nSquared)) * mu) % n;
  // }

  // useEffect(() => {
  //   const fetch = async () => {
  //     const res = await axios.post("http://127.0.0.1:5500/api/login", { login: "admin", password: "admin" });
  //     // console.log(res);
  //     n = res.data.public_key[0];
  //     localStorage.setItem("key1", res.data.public_key[0]);
  //   }
  //   fetch();
  // }, [])

  const calculate = () => {
    // if (shares.length < 3)
    //   return;
    // const totalEncryptedVotes = votes[0].slice();
    // for (let voterIndex = 1; voterIndex < votes.length; voterIndex++) {
    //   for (let candidateIndex = 0; candidateIndex < 4; candidateIndex++) {
    //     totalEncryptedVotes[candidateIndex] =
    //       (totalEncryptedVotes[candidateIndex] * votes[voterIndex][candidateIndex]) % (n ** 2);
    //   }
    // }

    // const prime = 2147483647;
    // const key = lagrangeInterpolation(shares, prime)
    // console.log(key);
    // const n = parseInt(localStorage.getItem("key1"))


    // const finalCounts = totalEncryptedVotes.map((encVote) => paillierDecrypt(key, encVote, n));
    // console.log("Final Counts: ", finalCounts);
    // const winnerIndex = finalCounts.indexOf(Math.max(...finalCounts.map(Number)));

    // console.log(`Number of voters: 4`);
    // console.log(`Decrypted Vote Counts: ${finalCounts.map(Number)}`);
    // console.log(`Winner: Candidate ${winnerIndex} with ${finalCounts[winnerIndex]} votes`);
    // console.log("\nElection details:");
    // finalCounts.forEach((count, i) => console.log(`Candidate ${i}: ${count} votes`));
  }

  const handleSubmitKey = async () => {
    const key = await axios.get("/api/authdata")
    console.log(key.data.storedValue);
    const res = await axios.post("http://127.0.0.1:5500/api/sharepart", { part: key.data.storedValue });
    console.log(res);
    setvotes(res.data.result);
    setshares(res.data.shares);
    console.log(res.data.shares);
    if (Array.isArray(res.data.shares))
      console.log("yes ");

    // compute_res();
    // if (!res.data && !res.data.shares && res.data.shares.length < 3)
    //   return;
    // let n = parseInt(localStorage.getItem("key1"));

    // console.log("N: ", n);
    // const totalEncryptedVotes = res.data.result[0].slice();
    // for (let voterIndex = 1; voterIndex < res.data.result.length; voterIndex++) {
    //   for (let candidateIndex = 0; candidateIndex < 4; candidateIndex++) {
    //     totalEncryptedVotes[candidateIndex] =
    //       (totalEncryptedVotes[candidateIndex] * res.data.result[voterIndex][candidateIndex]) % (n ** 2);
    //   }
    // }

    // const prime = 2147483647;
    // const key2 = lagrangeInterpolation(res.data.shares, prime)
    // console.log(key2);



    // const finalCounts = totalEncryptedVotes.map((encVote) => paillierDecrypt(key2, encVote, n));
    // console.log("Final Counts: ", finalCounts);
    // const winnerIndex = finalCounts.indexOf(Math.max(...finalCounts.map(Number)));

    // console.log(`Number of voters: 4`);
    // console.log(`Decrypted Vote Counts: ${finalCounts.map(Number)}`);
    // console.log(`Winner: Candidate ${winnerIndex} with ${finalCounts[winnerIndex]} votes`);
    // console.log("\nElection details:");
    // finalCounts.forEach((count, i) => console.log(`Candidate ${i}: ${count} votes`));
    // if (!key) {
    //   setMessage("Please share your key first!");
    //   return;
    // }
  }
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl text-center w-96">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Share your secret key</h1>
        <p className="text-gray-600 mb-6">
          Share your key for voting count
        </p>
        <button
          onClick={() => { handleSubmitKey() }}
          className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition text-lg mb-4"
        >
          Share Key
        </button>

        {message && <p className="text-center text-red-500 mt-4">{message}</p>}
      </div>
    </div>
  );
}

export default HomePage;
