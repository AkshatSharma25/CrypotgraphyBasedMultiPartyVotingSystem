import json
from web3 import Web3
import os
from dotenv import load_dotenv
from solcx import compile_standard, install_solc
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

CORS(app)

# Corrected Solidity Contract Source - Now stores any uint values in arrays
CONTRACT_SOURCE = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ArrayVoting {
    event VoteAdded(uint index);
    
    address public owner;
    bool public votingOpen;
    uint[][] public votes;
    
    constructor() {
        owner = msg.sender;
        votingOpen = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    function addVote(uint[] memory voteData) public {
        require(votingOpen, "Voting is closed");
        require(voteData.length == 4, "Must provide exactly 4 votes"); // Customize length as needed
        
        // No restriction on values - can be any uint
        votes.push(voteData);
        emit VoteAdded(votes.length - 1);
    }
    
    function closeVoting() public onlyOwner {
        votingOpen = false;
    }
    
    function getVoteCount() public view returns (uint) {
        return votes.length;
    }
    
    function getVote(uint index) public view returns (uint[] memory) {
        return votes[index];
    }
}
"""

def compile_contract():
    """Compile the Solidity contract and save to JSON"""
    # First install the compiler if needed
    install_solc('0.8.0')
    
    # Then proceed with compilation
    compiled = compile_standard({
        "language": "Solidity",
        "sources": {"ArrayVoting.sol": {"content": CONTRACT_SOURCE}},
        "settings": {
            "outputSelection": {
                "*": {"*": ["abi", "evm.bytecode.object"]}
            }
        }
    }, solc_version='0.8.0')
    
    with open('ArrayVoting.json', 'w') as file:
        json.dump(compiled, file)
    
    return compiled

class ArrayVotingStorage:
    def __init__(self, contract_address=None):
        # Connect to local Ganache or specified provider
        self.w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
        self.chain_id = int('1337')
        
        # Load account
        private_key = '0x42b52f20de6a1555fbb543396e28e33f5687e08bccb0045ae3d992cb44dbcc59'
        if not private_key:
            raise ValueError("PRIVATE_KEY not set in .env")
        if private_key.startswith('0x'):
            private_key = private_key[2:]
        self.account = self.w3.eth.account.from_key(private_key)

        # Compile contract if needed
        if not os.path.exists('ArrayVoting.json'):
            print("Compiling contract...")
            compile_contract()
        
        with open('ArrayVoting.json', 'r') as f:
            contract_json = json.load(f)
        
        # Get contract data
        contract_data = contract_json['contracts']['ArrayVoting.sol']['ArrayVoting']
        self.contract_abi = contract_data['abi']
        self.bytecode = contract_data['evm']['bytecode']['object']
        
        if contract_address:
            self.contract_address = contract_address
            self.contract = self.w3.eth.contract(
                address=contract_address,
                abi=self.contract_abi
            )
        else:
            self.contract_address = None
            self.contract = None
    
    def deploy_contract(self):
        """Deploy the voting contract to the blockchain"""
        print("\nChecking account balance...")
        balance = self.w3.eth.get_balance(self.account.address)
        print(f"Account balance: {self.w3.from_wei(balance, 'ether')} ETH")
        
        contract = self.w3.eth.contract(
            abi=self.contract_abi,
            bytecode=self.bytecode
        )
        
        transaction = contract.constructor().build_transaction({
            'chainId': self.chain_id,
            'gas': 2000000,
            'gasPrice': self.w3.to_wei('20', 'gwei'),
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
        })
        
        print("\nEstimating gas...")
        try:
            gas_estimate = self.w3.eth.estimate_gas(transaction)
            print(f"Estimated gas: {gas_estimate}")
        except Exception as e:
            print(f"Gas estimation failed: {e}")
        
        print("\nSigning transaction...")
        signed_txn = self.w3.eth.account.sign_transaction(
            transaction, 
            private_key=self.account.key
        )
        
        print("Sending transaction...")
        # Handle different web3.py versions
        try:
            if hasattr(signed_txn, 'rawTransaction'):
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        except AttributeError:
            # For web3.py >= 6.0.0
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
        print("Waiting for receipt...")
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        self.contract_address = tx_receipt.contractAddress
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        return tx_receipt
    
    def store_vote(self, vote_array):
        """Store a vote (as an array of integers) on the blockchain"""
        print(f"\nPreparing to store vote: {vote_array}")

        try:
            # Try the standard approach first
            print("Building transaction (standard method)...")
            transaction = self.contract.functions.addVote(
                vote_array  # Directly pass the array
            ).build_transaction({
                'chainId': self.chain_id,
                'gas': 300000,
                'gasPrice': self.w3.to_wei('20', 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
        except Exception as e:
            print(f"Standard method failed: {e}. Trying manual ABI encoding...")
            # Fallback: Manually encode the ABI using the function object
            encoded_vote = self.contract.functions.addVote(vote_array).encode_abi()
            transaction = {
                'to': self.contract.address,
                'data': encoded_vote,
                'chainId': self.chain_id,
                'gas': 300000,
                'gasPrice': self.w3.to_wei('20', 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            }

        # Rest of the code remains the same...
        print("Estimating gas for vote storage...")
        try:
            gas_estimate = self.w3.eth.estimate_gas(transaction)
            print(f"Vote gas estimate: {gas_estimate}")
            transaction['gas'] = int(gas_estimate * 1.2)  # Add 20% buffer
        except Exception as e:
            print(f"Vote gas estimation failed: {e}")
            # Keep the original gas limit

        print("Signing transaction...")
        signed_txn = self.w3.eth.account.sign_transaction(
            transaction, 
            private_key=self.account.key
        )

        print("Sending transaction...")
        try:
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        except AttributeError:
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

        print("Waiting for receipt...")
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        print(f"Transaction status: {'Success' if receipt.status == 1 else 'Failed'}")
        print(f"New vote count: {self.contract.functions.getVoteCount().call()}")
        return receipt
    
    def close_voting(self):
        """Close the voting period"""
        transaction = self.contract.functions.closeVoting().build_transaction({
            'chainId': self.chain_id,
            'gas': 200000,
            'gasPrice': self.w3.to_wei('20', 'gwei'),
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
        })
        
        signed_txn = self.w3.eth.account.sign_transaction(
            transaction, 
            private_key=self.account.key
        )
        
        # Handle different web3.py versions
        try:
            if hasattr(signed_txn, 'rawTransaction'):
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        except AttributeError:
            # For web3.py >= 6.0.0
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
        return self.w3.eth.wait_for_transaction_receipt(tx_hash)
    
    def get_all_votes(self):
        """Retrieve all votes from the blockchain as arrays of integers"""
        vote_count = self.contract.functions.getVoteCount().call()
        votes = []
        
        for i in range(vote_count):
            vote_array = self.contract.functions.getVote(i).call()
            votes.append(vote_array)
        
        return votes
    
    def inspect_votes(self):
        """Debugging method to print all votes"""
        vote_count = self.contract.functions.getVoteCount().call()
        print(f"\nStored votes ({vote_count} total):")
        for i in range(vote_count):
            vote_array = self.contract.functions.getVote(i).call()
            print(f"Vote {i}: {vote_array}")


# Create global instance of the voting storage
voting_storage = None
parts = []
threshold = 3
users = {}
votes = []
public_key = None

import random

from sympy import gcdex

def extended_gcd(a, b):
    """Extended Euclidean Algorithm"""
    if a == 0:
        return b, 0, 1
    else:
        gcd, x, y = extended_gcd(b % a, a)
        return gcd, y - (b // a) * x, x

# -------------------- Modular Inverse -------------------- #
def mod_inverse(a, m):
    """Find modular inverse using Extended Euclidean Algorithm"""
    g, x, _ = extended_gcd(a, m)
    if g != 1:
        raise Exception("Modular inverse does not exist")
    return x % m

# -------------------- Lagrange Interpolation -------------------- #
def lagrange_interpolation(shares, prime=2**31 - 1):
    """Reconstruct the secret using Lagrange interpolation"""
    secret = 0
    for i, (x_i, y_i) in enumerate(shares):
        numerator = denominator = 1
        for j, (x_j, _) in enumerate(shares):
            if i != j:
                numerator = (numerator * (-x_j)) % prime
                denominator = (denominator * (x_i - x_j)) % prime

        denominator_inv = mod_inverse(denominator, prime)
        term = (y_i * numerator * denominator_inv) % prime
        secret = (secret + term) % prime
    return secret

# -------------------- Paillier Decryption -------------------- #
def paillier_decrypt(lambda_n, mu, ciphertext, n):
    """Decrypts a message using Paillier encryption"""
    n_sq = n * n
    L = lambda x: (x - 1) // n  # L function: (x-1) / n
    return (L(pow(ciphertext, lambda_n, n_sq)) * mu) % n

# -------------------- Compute Election Results -------------------- #
def calculate_res(votes, parts):
    prime = 2**31 - 1
    num_candidates = len(votes[0])

    # -------------------- Homomorphic Tallying -------------------- #
    total_encrypted_votes = votes[0].copy()
    for voter_index in range(1, len(votes)):
        for candidate_index in range(num_candidates):
            total_encrypted_votes[candidate_index] *= votes[voter_index][candidate_index]
        
    print(total_encrypted_votes)

    # -------------------- Secret Reconstruction -------------------- #
    reconstructed_lambda = lagrange_interpolation(parts, prime)
    print(reconstructed_lambda)

    # Compute `n` (Paillier modulus)
    n = 323 # Approximate n if not given

    # Compute `mu`
    g = n + 1  # g is typically chosen as n + 1
    mu = mod_inverse(reconstructed_lambda, n)
    print(mu)
    # -------------------- Decrypt Votes -------------------- #
    final_counts = [paillier_decrypt(reconstructed_lambda, mu, enc_vote, n) for enc_vote in total_encrypted_votes]

    # -------------------- Determine the Winner -------------------- #
    winner_index = final_counts.index(max(final_counts))

    # -------------------- Print Results -------------------- #
    print(f"Number of voters: {len(votes)}")
    print(f"Decrypted Vote Counts: {final_counts}")
    print(f"Winner: Candidate {winner_index}")

    print("\nElection details:")
    min_votes = min(final_counts)

    adjusted_counts = [count - min_votes for count in final_counts]

    # Determine the winner again
    winner_index = adjusted_counts.index(max(adjusted_counts))

    # Print the adjusted results
    for i, count in enumerate(adjusted_counts):
        print(f"Candidate {i}: {count} votes")
    print(f"\nWinner: Candidate {winner_index} with {max(adjusted_counts)} votes")


# Create route to initialize/deploy the contract
@app.route('/api/init', methods=['POST'])
def initialize_contract():
    global voting_storage
    print("starting init")
    
    try:
        data = request.get_json()
        contract_address = data.get('contract_address')
        print(f"Contract address: {contract_address}")
        
        # Create voting storage instance
        voting_storage = ArrayVotingStorage(contract_address)
        
        # If no contract address provided, deploy a new contract
        if not contract_address:
            print("Deploying new contract...")
            receipt = voting_storage.deploy_contract()
            return jsonify({
                'status': 'success',
                'contract_address': receipt.contractAddress,
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed,
                'message': 'Contract deployed successfully'
            })
        else:
            # Check if the contract exists
            print("Checking existing contract...")
            try:
                is_open = voting_storage.contract.functions.votingOpen().call()
                return jsonify({
                    'status': 'success',
                    'contract_address': contract_address,
                    'voting_open': is_open,
                    'vote_count': voting_storage.contract.functions.getVoteCount().call(),
                    'message': 'Connected to existing contract'
                })
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': f'Failed to connect to contract: {str(e)}'
                }), 400
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Initialization error: {str(e)}'
        }), 500

@app.route('/api/publickey', methods=['POST'])
def get_public_key():
    global voting_storage
    global public_key
    if not voting_storage:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    data = request.get_json()
    if not data or 'public_key' not in data:
        return jsonify({
            'status': 'error',
            'message': 'No public key provided'
        }), 400
    public_key = data.get('public_key')

    return jsonify({
        'status':'success'
    })


@app.route('/api/login', methods=['POST'])
def get_public_key2():
    global voting_storage
    global public_key
    global users

    if not voting_storage:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    data = request.get_json()
    if not data or 'login' not in data or 'password' not in data:
        return jsonify({
            'status': 'error',
            'message': 'No public key provided'
        }), 400
    
    login = data.get('login')
    password = data.get('password')
    print(f"Login: {login}, Password: {password}")
    if(login not in users):
        users[login] = password

    if(users[login] != password):
        return jsonify({
            'status': 'error',
            'message': 'Wrong login or password'
        }), 400


    return jsonify({
        'status': 'success',
        'public_key': public_key
    })

@app.route('/api/sharepart', methods=['POST'])
def share_part():
    global voting_storage
    global parts
    global votes
    
    if not voting_storage or not public_key:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    data = request.get_json()
    if not data or 'part' not in data:
        return jsonify({
            'status': 'error',
            'message': 'No part provided'
        }), 400

    parts.append(data.get('part'))
    if len(parts) >= threshold:
        print("Threshold reached, calculating result...")
        result = calculate_res(votes, parts)
        return jsonify({
            'status':'success',
            'result': votes,
            'shares': parts,
            'message': 'result has beeen declared'
        }), 200

    return jsonify({
        'status': 'success',
        'message': 'Part shared successfully',
    })

# Create route to add a vote
@app.route('/api/vote', methods=['POST'])
def add_vote():
    global voting_storage
    global votes
    
    if not voting_storage or not voting_storage.contract:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    try:
        data = request.get_json()
        vote_array = data.get('vote')
        
        if not vote_array:
            return jsonify({
                'status': 'error',
                'message': 'No vote data provided'
            }), 400
        
        # Submit the vote to the blockchain
        receipt = voting_storage.store_vote(vote_array)
        votes.append(vote_array)
        # votes.append(vote_array)
        
        return jsonify({
            'status': 'success',
            'tx_hash': receipt.transactionHash.hex(),
            'block_number': receipt.blockNumber,
            'gas_used': receipt.gasUsed,
            'vote_count': voting_storage.contract.functions.getVoteCount().call(),
            'message': 'Vote stored successfully',
            'count': len(votes)
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Vote submission error: {str(e)}'
        }), 500

# Create route to close voting
@app.route('/api/close', methods=['GET'])
def close_voting():
    global voting_storage
    
    if not voting_storage or not voting_storage.contract:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    try:
        res = calculate_res(votes, parts)
        # receipt = voting_storage.close_voting()
        
        return jsonify({
            'status': 'success',
            # 'tx_hash': receipt.transactionHash.hex(),
            'voting_open': voting_storage.contract.functions.votingOpen().call(),
            'message': 'Voting closed successfully',
            'result': res
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to close voting: {str(e)}'
        }), 500

# @app.route('/api/publickey', methods=['GET'])
# def get_public_key:
#     global public_key
#     global voting_storage

#     if not voting_storage or not public_key:
#         return jsonify({
#             'status': 'error',
#             'message': 'Contract not initialized. Call /api/init first.'
#         }), 400

# Create route to get all votes
@app.route('/api/votes', methods=['GET'])
def get_votes():
    global voting_storage
    
    if not voting_storage or not voting_storage.contract:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    try:
        votes = voting_storage.get_all_votes()
        
        return jsonify({
            'status': 'success',
            'vote_count': len(votes),
            'votes': votes,
            'voting_open': voting_storage.contract.functions.votingOpen().call()
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve votes: {str(e)}'
        }), 500

# Create route to get contract status
@app.route('/api/status', methods=['GET'])
def get_status():
    global voting_storage
    
    if not voting_storage or not voting_storage.contract:
        return jsonify({
            'status': 'error',
            'message': 'Contract not initialized. Call /api/init first.'
        }), 400
    
    try:
        return jsonify({
            'status': 'success',
            'contract_address': voting_storage.contract_address,
            'voting_open': voting_storage.contract.functions.votingOpen().call(),
            'vote_count': voting_storage.contract.functions.getVoteCount().call(),
            'owner': voting_storage.contract.functions.owner().call()
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get status: {str(e)}'
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5500)