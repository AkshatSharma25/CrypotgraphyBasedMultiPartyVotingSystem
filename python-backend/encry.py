import random

# ---------------------- Paillier Key Generation ---------------------- #
def generate_paillier_keys():
    p, q = 17, 19  # Small prime numbers (should be large in real scenarios)
    n = p * q
    lambda_n = (p - 1) * (q - 1)  # Carmichael's totient function
    g = n + 1  # Simplified choice of g
    mu = pow(lambda_n, -1, n)  # Modular inverse of lambda_n mod n
    return (n, g), (lambda_n, mu, n)

# ---------------------- Paillier Encryption ---------------------- #
def paillier_encrypt(public_key, message, r=2):
    """Encrypts a message using Paillier encryption"""
    n, g = public_key
    return (pow(g, message, n * n) * pow(r, n, n * n)) % (n * n)

# ---------------------- Paillier Decryption ---------------------- #
def paillier_decrypt(private_key, ciphertext):
    """Decrypts a message using Paillier encryption"""
    lambda_n, mu, n = private_key
    n_sq = n * n
    L = lambda x: (x - 1) // n  # L function: (x-1)/n
    return (L(pow(ciphertext, lambda_n, n_sq)) * mu) % n

# ---------------------- One-Hot Encoding ---------------------- #
def one_hot_encode(vote, num_candidates):
    """Creates a one-hot encoded vector for a vote"""
    one_hot = [0] * num_candidates
    one_hot[vote] = 1
    return one_hot

# ---------------------- Secret Sharing ---------------------- #
def evaluate_polynomial(coefficients, x, prime):
    """Evaluate polynomial at x under modulo prime"""
    result = 0
    for coef in reversed(coefficients):
        result = (result * x + coef) % prime
    return result

def generate_shares(secret, threshold, n_shares, prime):
    """Generate secret shares using Shamir's Secret Sharing"""
    coefficients = [secret] + [random.randint(1, prime - 1) for _ in range(threshold - 1)]
    return [(i + 1, evaluate_polynomial(coefficients, i + 1, prime)) for i in range(n_shares)]

def mod_inverse(a, m):
    """Find modular inverse using Extended Euclidean Algorithm"""
    g, x, _ = extended_gcd(a, m)
    if g != 1:
        raise Exception("Modular inverse does not exist")
    return x % m

def extended_gcd(a, b):
    """Extended Euclidean Algorithm"""
    if a == 0:
        return b, 0, 1
    else:
        gcd, x, y = extended_gcd(b % a, a)
        return gcd, y - (b // a) * x, x

def lagrange_interpolation(shares, prime):
    """Reconstruct the secret using Lagrange interpolation"""
    x_values, y_values = zip(*shares)
    secret = 0

    for i, (x_i, y_i) in enumerate(shares):
        numerator, denominator = 1, 1
        for j, (x_j, _) in enumerate(shares):
            if i != j:
                numerator = (numerator * (-x_j)) % prime
                denominator = (denominator * (x_i - x_j)) % prime

        denominator_inv = mod_inverse(denominator, prime)
        term = (y_i * numerator * denominator_inv) % prime
        secret = (secret + term) % prime

    return secret

# ---------------------- Main Voting System ---------------------- #
num_voters = 5
num_candidates = 3

# Generate Paillier keys
public_key, private_key = generate_paillier_keys()

# Simulate votes and encrypt them
votes = []
for _ in range(num_voters):
    vote = random.randint(0, num_candidates - 1)
    one_hot_vote = one_hot_encode(vote, num_candidates)
    encrypted_vote = [paillier_encrypt(public_key, bit) for bit in one_hot_vote]
    votes.append(encrypted_vote)

# Aggregate votes (Homomorphic addition)
total_encrypted_votes = votes[0][:]
for voter_index in range(1, num_voters):
    for candidate_index in range(num_candidates):
        total_encrypted_votes[candidate_index] = (
            total_encrypted_votes[candidate_index] * votes[voter_index][candidate_index]
        ) % (public_key[0] ** 2)

# Generate secret shares for key reconstruction
p, q = 17, 19
lambda_n = (p - 1) * (q - 1)
prime = 2**31 - 1
threshold = 3
total_authorities = 5

shares = generate_shares(lambda_n, threshold, total_authorities, prime)

# Reconstruct private key using Lagrange interpolation
collected_shares = shares[:threshold]
reconstructed_lambda = lagrange_interpolation(collected_shares, prime)

# Verify reconstruction
if reconstructed_lambda != lambda_n:
    print("Error: Reconstructed key does not match original.")
else:
    print("Successfully reconstructed private key!")

# Decrypt votes
final_counts = [paillier_decrypt(private_key, enc_vote) for enc_vote in total_encrypted_votes]

# Determine winner
winner_index = final_counts.index(max(final_counts))

# Output results
print(f"Number of voters: {num_voters}")
print(f"Decrypted Vote Counts: {final_counts}")
print(f"Winner: Candidate {winner_index} with {max(final_counts)} votes")
print("\nElection details:")
for i, count in enumerate(final_counts):
    print(f"Candidate {i}: {count} votes")