import json
import os
from typing import Any, Dict

import requests


PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY")
PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS"


def upload_report_to_ipfs(report: Dict[str, Any]) -> str:
    if not PINATA_API_KEY or not PINATA_SECRET_KEY:
        raise RuntimeError("Pinata API keys are not configured")

    payload = {
        "pinataContent": report,
        "pinataMetadata": {
            "name": "sentinelguard-slither-report",
        },
    }

    headers = {
        "Content-Type": "application/json",
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_KEY,
    }

    resp = requests.post(
        PINATA_ENDPOINT,
        headers=headers,
        data=json.dumps(payload),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    ipfs_hash = data.get("IpfsHash")
    if not ipfs_hash:
        raise RuntimeError("Could not read IpfsHash from Pinata response")

    return ipfs_hash

