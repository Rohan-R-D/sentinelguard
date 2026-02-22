# SentinelGuard (Monad)

SentinelGuard is a full-stack Web3 security oracle for Monad:

- Analyzes smart contracts with Slither
- Assigns a security score (0–100)
- Stores scores and IPFS hashes on the Monad blockchain
- Rewards high-security contracts with SGT tokens
- Exposes a minimal dashboard for scanning and viewing scores

## Stack

- Frontend: Next.js, Tailwind CSS, Ethers.js
- Backend: FastAPI, Web3.py, Slither CLI, Pinata (IPFS)
- Blockchain: Solidity, Hardhat, Monad Testnet

## Quick start

1. Copy `.env.example` to `.env` and fill in values.
2. Install Node dependencies and compile contracts:

   ```bash
   npm install
   npm run compile
   ```

3. Deploy contracts to Monad testnet:

   ```bash
   npm run deploy:monad
   ```

   Copy `SentinelRegistry` and `RewardManager` addresses into `.env` and
   also set `NEXT_PUBLIC_REGISTRY_ADDRESS`.

4. Backend:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`.

## Scan flow

1. User enters a contract address in the dashboard.
2. Frontend first reads from `SentinelRegistry.getScore(address)` via Ethers.js.
3. If an on-chain score exists, it is displayed along with the IPFS link.
4. If no score exists, frontend calls `POST /scan` on the backend.
5. Backend:
   - Fetches source from Etherscan
   - Runs `slither` to generate a JSON report
   - Computes a score:
     - Start from 100
     - Critical: −40
     - High: −25
     - Medium: −10
     - Low: −2
     - If source not verified, cap score at 30
   - Uploads the report JSON to IPFS via Pinata
   - Calls `SentinelRegistry.updateScore(address, score, ipfsHash)` on Monad
   - Calls `RewardManager.reward(address, score)` to send SGT

Risk levels:

- 80–100 → Safe
- 50–79 → Moderate
- <50 → High Risk

