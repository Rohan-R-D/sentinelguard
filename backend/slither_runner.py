import json
import os
import subprocess
import tempfile
from typing import Any, Dict, Tuple

import requests


ETHERSCAN_API_URL = "https://api.etherscan.io/api"
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")


def fetch_source_code(contract_address: str) -> Tuple[str, bool]:
    if not ETHERSCAN_API_KEY:
        raise RuntimeError("ETHERSCAN_API_KEY is not set")

    params = {
        "module": "contract",
        "action": "getsourcecode",
        "address": contract_address,
        "apikey": ETHERSCAN_API_KEY,
    }
    resp = requests.get(ETHERSCAN_API_URL, params=params, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") != "1" or not data.get("result"):
        return "", False

    result = data["result"][0]
    source_code = result.get("SourceCode") or ""
    verified = bool(source_code)

    return source_code, verified


def run_slither_analysis(contract_address: str) -> Tuple[Dict[str, Any], bool]:
    source_code, verified = fetch_source_code(contract_address)

    if not verified:
        return {
            "unverified": True,
            "contractAddress": contract_address,
            "message": "Source code not verified on Etherscan",
        }, False

    with tempfile.TemporaryDirectory() as tmpdir:
        source_path = os.path.join(tmpdir, "Contract.sol")
        with open(source_path, "w", encoding="utf-8") as f:
            f.write(source_code)

        report_path = os.path.join(tmpdir, "report.json")

        cmd = [
            "slither",
            source_path,
            "--json",
            report_path,
        ]
        subprocess.run(cmd, check=True)

        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)

    return report, verified

