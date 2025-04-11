# 🗳️ Multi-Party Voting System – Hack This Future Winner 🏆

A secure, decentralized, and privacy-preserving voting platform built using **Shamir's Secret Sharing**, **Homomorphic Encryption**, and **Web3 Blockchain**.

Built during **Hack This Future 2025**, this project aims to modernize and secure electronic voting using cutting-edge cryptography and distributed systems. The ppt file is attached for reference...

---

## 🚀 Architecture Overview

This project consists of **3 frontend applications** and a **central Python backend**:

### 📱 Frontend Apps
1. **User App**  
   - Cast votes securely using one-time blind signatures  
   - Votes are **homomorphically encrypted** and **directly stored on-chain**  
   - Users remain anonymous — even the backend can't see who voted for whom  

2. **Admin App**  
   - Generates cryptographic keypairs (public/private) for each election  
   - Splits the private key using **Shamir's Secret Sharing**  
   - Securely distributes shares to 5 Authority instances  

3. **Authority App** (×5 instances)  
   - Each runs independently and holds one share of the private key  
   - At least **3 out of 5 instances** must collaborate to reconstruct the private key  
   - The reconstructed key is used **only once**, to decrypt the homomorphically tallied result  

---

### 🧠 Backend
- Built in **Python**, acts as the **main coordinator**
- Handles:
  - Verifying and accepting votes
  - Encrypting them using **Homomorphic Encryption**
  - Storing encrypted votes **directly on the blockchain**
  - Tallying votes homomorphically without decryption
- At no point does the backend know who voted for whom

---

## 🔐 Key Features

- ✅ **End-to-end voter anonymity**  
- ✅ **Blind signatures** prevent vote duplication  
- ✅ **One-hot encoded ballots** support secure homomorphic addition  
- ✅ **Votes are immutable** and stored on-chain — no tampering possible  
- ✅ **Private key reconstruction requires quorum (3 of 5 authorities)**  
- ✅ **Backend tallies encrypted votes, not raw ones**

---

## 🛠️ Tech Stack

| Layer         | Tech                        |
|---------------|-----------------------------|
| Frontend      | `Next.js` (React), Web3.js  |
| Backend       | `Python` (FastAPI + PyCrypto) |
| Blockchain    | `Ethereum`, `Solidity`, `Web3.py` |
| Crypto        | Shamir’s Secret Sharing, Paillier Homomorphic Encryption, One-Hot Encoding |

---

## ⚙️ How It Works

```mermaid
graph TD
A[Admin Frontend] -->|Generate Key| B[Private Key]
B -->|Split with SSS| C1[Authority #1]
B --> C2[Authority #2]
B --> C3[Authority #3]
B --> C4[Authority #4]
B --> C5[Authority #5]
U[User Frontend] -->|Blind Sign & Encrypt| D[Blockchain Smart Contract]
D -->|Encrypted Vote Tally| E[Python Backend]
C1 -->|Share for Decryption| F[Key Reconstruction (3/5 quorum)]
F --> E
