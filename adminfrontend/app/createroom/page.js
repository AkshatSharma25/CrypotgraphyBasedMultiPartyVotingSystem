"use client"

import React from "react";

import { useState } from "react";

import axios from "axios";
import { useRouter } from "next/navigation";
/* Modular Inverse (not used in share generation but provided for completeness) */

/* Evaluate a polynomial (coefficients given in increasing order)
   using Horner’s method in the finite field defined by prime */
/* Generate shares for a given secret */



function CreateRoom() {

  function getRandomInt(min, max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return min + (array[0] % (max - min + 1));
  }

  function evaluatePolynomial(coefficients, x, prime) {
    let result = 0;
    for (let i = coefficients.length - 1; i >= 0; i--) {
        result = (result * x + coefficients[i]) % (prime);
    }
    return result;
  }


  const router = useRouter();
  function generateShares(secret, threshold, nShares, prime) {
    if (threshold > nShares) throw new Error("Threshold cannot be greater than the number of shares");
  
    const coefficients = [secret];
    for (let i = 1; i < threshold; i++) {
      coefficients.push(getRandomInt(1, Number(prime) - 1));
    }
  
    const shares = [];
    for (let i = 0; i < nShares; i++) {
      const x = i + 1;
      const y = evaluatePolynomial(coefficients, x, prime);
      shares.push([x, y]);
    }
    return shares;
  }
  

  function extendedGCD(a, b) {
    if (a === 0) return { gcd: b, x: 0, y: 1 };
  
    const { gcd, x, y } = extendedGCD(b % a, a);
    return { gcd, x: y - Math.floor(b / a) * x, y: x }; // Ensuring integer division
  }
  
  
  function modInverse(a, m) {
  
    const { gcd, x } = extendedGCD(a, m);
    if (gcd !== 1) throw new Error("Modular inverse does not exist");
    return ((x % m) + m) % m;
  }
  
  function generatePaillierKeys() {
    const p = 17, q = 19;  // Small prime numbers (should be large in real scenarios)
    const n = p * q;
    const lambda_n = (p - 1) * (q - 1);  // Carmichael's totient function
    const g = n + 1;  // Simplified choice of g
    const mu = modInverse(lambda_n, n);  // Modular inverse of lambda_n mod n
    print(`n: ${n}, g: ${g}, lambda_n: ${lambda_n}, mu: ${mu}`);
    return { publicKey: [n, g], privateKey: [lambda_n, mu, n] };
  }

  const handleSendKey = async () => {
    // Simulate Paillier key generation by using fixed small primes.
    // // In a real system you would generate a proper key pair.
    const { publicKey, privateKey } = generatePaillierKeys();

    // const publicKeyN = p * q;
    // const privateKeyLambda = (p - 1) * (q - 1);
    // Use a prime field for secret sharing; using 2**31 - 1 as in the Python code
    const prime = Math.pow(2, 31) - 1;
    console.log("\nPublic Key:", publicKey);
    console.log("Private Key:", privateKey);
    const secretToShare = privateKey[0] % prime;
    const threshold = 3;
    const totalAuthorities = 5;
    const generatedShares = generateShares(secretToShare, threshold, totalAuthorities, prime);
    console.log("Generated Shares:", generatedShares);

    const res1 = await axios.post("http://localhost:4001/api/authdata", { value: generatedShares[0] }, {
      headers: {
        "Content-Type": "application/json",

      }
    })
    const res2 = await axios.post("http://localhost:4002/api/authdata", { value: generatedShares[1] }, {
      headers: {
        "Content-Type": "application/json",

      }
    })
    const res3 = await axios.post("http://localhost:4003/api/authdata", { value: generatedShares[2] }, {
      headers: {
        "Content-Type": "application/json",

      }
    })
    const res4 = await axios.post("http://localhost:4004/api/authdata", { value: generatedShares[3] }, {
      headers: {
        "Content-Type": "application/json",

      }
    })
    const res5 = await axios.post("http://localhost:4005/api/authdata", { value: generatedShares[4] }, {
      headers: {
        "Content-Type": "application/json",
      }
    })
    // console.log(res1, res2, res3, res4, res5);


    const publish = await axios.post("http://127.0.0.1:5500/api/publickey", {
      public_key: publicKey,
      prime: prime
    })
  };






  const launch = () => {
    alert("Room Launched");
    handleSendKey();
    router.push("/done");
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4 text-center text-xl font-bold">
        Create Room
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex flex-col justify-center items-center bg-gradient-to-r from-gray-200 to-gray-400">
        <button
          onClick={launch}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-lg">
          Launch Room
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        &copy; {new Date().getFullYear()} Voting System. All rights reserved.
      </footer>
    </div>
  );
}

export default CreateRoom;