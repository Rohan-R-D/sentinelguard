import os
from typing import Optional

from web3 import Web3


MONAD_RPC_URL = os.getenv("MONAD_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
REGISTRY_ADDRESS = os.getenv("REGISTRY_ADDRESS")
REWARD_MANAGER_ADDRESS = os.getenv("REWARD_MANAGER_ADDRESS")


REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "contractAddr", "type": "address"},
            {"internalType": "uint8", "name": "score", "type": "uint8"},
            {"internalType": "string", "name": "ipfsHash", "type": "string"},
        ],
        "name": "updateScore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


REWARD_MANAGER_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "recipient", "type": "address"},
            {"internalType": "uint8", "name": "score", "type": "uint8"},
        ],
        "name": "reward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


def _get_web3() -> Web3:
    if not MONAD_RPC_URL:
        raise RuntimeError("MONAD_RPC_URL is not set")
    w3 = Web3(Web3.HTTPProvider(MONAD_RPC_URL))
    if not w3.is_connected():
        raise RuntimeError("Could not connect to Monad RPC")
    return w3


def _get_account(w3: Web3):
    if not PRIVATE_KEY:
        raise RuntimeError("PRIVATE_KEY is not set")
    return w3.eth.account.from_key(PRIVATE_KEY)


def update_score_on_chain(contract_address: str, score: int, ipfs_hash: str) -> str:
    if not REGISTRY_ADDRESS:
        raise RuntimeError("REGISTRY_ADDRESS is not set")

    w3 = _get_web3()
    account = _get_account(w3)

    registry = w3.eth.contract(
        address=w3.to_checksum_address(REGISTRY_ADDRESS),
        abi=REGISTRY_ABI,
    )

    tx = registry.functions.updateScore(
        w3.to_checksum_address(contract_address),
        int(score),
        ipfs_hash,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gasPrice": w3.eth.gas_price,
            "chainId": w3.eth.chain_id,
        }
    )

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()


def send_reward(recipient_address: str, score: int) -> Optional[str]:
    if not REWARD_MANAGER_ADDRESS:
        return None

    w3 = _get_web3()
    account = _get_account(w3)

    reward_manager = w3.eth.contract(
        address=w3.to_checksum_address(REWARD_MANAGER_ADDRESS),
        abi=REWARD_MANAGER_ABI,
    )

    tx = reward_manager.functions.reward(
        w3.to_checksum_address(recipient_address),
        int(score),
    ).build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gasPrice": w3.eth.gas_price,
            "chainId": w3.eth.chain_id,
        }
    )

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()

