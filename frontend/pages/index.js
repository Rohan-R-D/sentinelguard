import { useState } from "react";
import { JsonRpcProvider, Contract, formatEther, parseEther } from "ethers";
import axios from "axios";

const REGISTRY_ABI = [
  {
    inputs: [{ internalType: "address", name: "contractAddr", type: "address" }],
    name: "getScore",
    outputs: [
      { internalType: "uint8", name: "score", type: "uint8" },
      { internalType: "string", name: "ipfsHash", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
const monadRpc = process.env.NEXT_PUBLIC_MONAD_RPC;
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function computeRiskLevel(score) {
  if (score >= 80) return "Safe";
  if (score >= 50) return "Moderate";
  return "High Risk";
}

function riskColor(score) {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/60";
  if (score >= 50) return "bg-amber-500/20 text-amber-300 border-amber-500/60";
  return "bg-rose-500/20 text-rose-300 border-rose-500/60";
}

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [score, setScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const ipfsUrl = ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : "";

  // Connect wallet function
  async function connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        const web3Provider = new JsonRpcProvider(monadRpc);
        const web3Signer = await web3Provider.getSigner();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(web3Signer.address);
        setWalletConnected(true);
        setError("");
      } else {
        setError("MetaMask is not installed. Please install MetaMask to use this feature.");
      }
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
  }

  // Disconnect wallet function
  function disconnectWallet() {
    setWalletConnected(false);
    setAccount("");
    setProvider(null);
    setSigner(null);
  }

  async function checkRegistry(address) {
    if (!registryAddress || !monadRpc) {
      return null;
    }

    const provider = new JsonRpcProvider(monadRpc);
    const registry = new Contract(registryAddress, REGISTRY_ABI, provider);

    const [storedScore, storedHash] = await registry.getScore(address);

    if (!storedHash) {
      return null;
    }

    return {
      score: Number(storedScore),
      ipfsHash: storedHash
    };
  }

  async function handleScan(e) {
    e.preventDefault();
    setError("");
    setScore(null);
    setRiskLevel("");
    setIpfsHash("");
    setSource("");

    const addr = contractAddress.trim();
    if (!addr) {
      setError("Enter a contract address");
      return;
    }

    // Validate Ethereum address format
    if (!addr.startsWith('0x') || addr.length !== 42) {
      setError("Invalid contract address format");
      return;
    }

    setLoading(true);

    try {
      // Check if contract exists on Monad (with error handling)
      let contractExists = false;
      try {
        const tempProvider = new JsonRpcProvider(monadRpc);
        const code = await tempProvider.getCode(addr);
        contractExists = code !== '0x';
      } catch (rpcError) {
        console.log('RPC check failed, proceeding with scan:', rpcError.message);
        contractExists = true; // Assume contract exists if RPC fails
      }
      
      if (!contractExists) {
        setError("No contract found at this address on Monad testnet");
        setLoading(false);
        return;
      }

      const existing = await checkRegistry(addr);
      if (existing) {
        const level = computeRiskLevel(existing.score);
        setScore(existing.score);
        setRiskLevel(level);
        setIpfsHash(existing.ipfsHash);
        setSource("monad");
        return;
      }

      const response = await axios.post(`${backendUrl}/scan`, {
        contract_address: addr
      });

      const data = response.data;
      setScore(data.score);
      setRiskLevel(data.risk_level);
      setIpfsHash(data.ipfs_hash);
      setSource("backend");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        setError("Invalid contract address or contract not found");
      } else if (err.response?.status === 500) {
        setError("Backend error. Please try again later.");
      } else {
        setError("Scan failed. Check backend and RPC configuration.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            SentinelGuard
          </h1>
          <p className="text-sm text-slate-400">
            Security scoring oracle for Monad smart contracts. Enter any contract address to scan.
          </p>
          
          {/* Wallet Connection Section */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              {walletConnected ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Wallet not connected"}
            </div>
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded-md transition"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={disconnectWallet}
                className="text-xs bg-rose-500 hover:bg-rose-400 text-white px-3 py-1 rounded-md transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </header>

        <form
          onSubmit={handleScan}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/40"
        >
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Contract address
          </label>
          <input
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x... (Any Monad contract address)"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/60"
          />

          <p className="text-xs text-slate-500">
            Enter any contract address on Monad testnet to analyze its security vulnerabilities.
          </p>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>

          {source && (
            <p className="mt-2 text-xs text-slate-500">
              Source: {source === "monad" ? "Monad registry" : "Backend + Slither"}
            </p>
          )}
        </form>

        {score !== null && (
          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Security score
                </p>
                <p className="mt-1 text-3xl font-semibold text-slate-50">
                  {score}/100
                </p>
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs font-medium ${riskColor(
                  score
                )}`}
              >
                {computeRiskLevel(score)}
              </div>
            </div>

            {ipfsUrl && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Slither report (IPFS)
                </p>
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
                >
                  {ipfsUrl}
                </a>
              </div>
            )}
          </section>
        )}

        <footer className="pt-4">
          <p className="text-[11px] text-slate-500">
            Scores are heuristic and based on Slither findings. Always review reports before
            production deployments.
          </p>
        </footer>
      </div>
    </div>
  );
}

