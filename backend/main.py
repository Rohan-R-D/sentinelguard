from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

from slither_runner import run_slither_analysis
from score_engine import calculate_score, risk_level_from_score
from ipfs_uploader import upload_report_to_ipfs
from monad_updater import update_score_on_chain, send_reward


app = FastAPI(
    title="SentinelGuard Backend",
    version="1.0.0",
    description="Slither-powered security oracle for Monad smart contracts.",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    contract_address: str


class ScanResponse(BaseModel):
    score: int
    risk_level: str
    ipfs_hash: str


@app.post("/scan", response_model=ScanResponse)
async def scan_contract(payload: ScanRequest) -> ScanResponse:
    try:
        report, verified = run_slither_analysis(payload.contract_address)
        score = calculate_score(report, verified=verified)
        risk_level = risk_level_from_score(score)
        ipfs_hash = upload_report_to_ipfs(report)

        # Only update on-chain if registry is configured
        if os.getenv("REGISTRY_ADDRESS") and os.getenv("REGISTRY_ADDRESS") != "0xREGISTRY_ADDRESS_ON_MONAD":
            try:
                update_score_on_chain(payload.contract_address, score, ipfs_hash)
            except Exception as e:
                print(f"Failed to update on-chain score: {e}")

        # Only send rewards if reward manager is configured
        if os.getenv("REWARD_MANAGER_ADDRESS") and os.getenv("REWARD_MANAGER_ADDRESS") != "0xREWARD_MANAGER_ADDRESS_ON_MONAD":
            try:
                send_reward(payload.contract_address, score)
            except Exception as e:
                print(f"Failed to send rewards: {e}")

        return ScanResponse(
            score=score,
            risk_level=risk_level,
            ipfs_hash=ipfs_hash,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

