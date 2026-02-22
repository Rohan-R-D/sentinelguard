require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { MONAD_RPC_URL, PRIVATE_KEY } = process.env;

function getAccounts() {
  if (!PRIVATE_KEY) return [];
  const trimmed = PRIVATE_KEY.trim();
  if (!trimmed) return [];
  const withPrefix = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  return [withPrefix];
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    monadTestnet: {
      url: MONAD_RPC_URL || "",
      accounts: getAccounts()
    }
  }
};
