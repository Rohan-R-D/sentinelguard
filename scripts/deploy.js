const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  const initialSupply = hre.ethers.parseUnits("1000000", 18);

  const SecurityToken = await hre.ethers.getContractFactory("SecurityToken");
  const securityToken = await SecurityToken.deploy(initialSupply);
  await securityToken.waitForDeployment();
  const tokenAddress = await securityToken.getAddress();
  console.log("SecurityToken deployed to:", tokenAddress);

  const SentinelRegistry = await hre.ethers.getContractFactory("SentinelRegistry");
  const sentinelRegistry = await SentinelRegistry.deploy(deployer.address);
  await sentinelRegistry.waitForDeployment();
  const registryAddress = await sentinelRegistry.getAddress();
  console.log("SentinelRegistry deployed to:", registryAddress);

  const RewardManager = await hre.ethers.getContractFactory("RewardManager");
  const rewardManager = await RewardManager.deploy(tokenAddress, deployer.address);
  await rewardManager.waitForDeployment();
  const rewardManagerAddress = await rewardManager.getAddress();
  console.log("RewardManager deployed to:", rewardManagerAddress);

  console.log("\nUpdate your .env with:");
  console.log("REGISTRY_ADDRESS=", registryAddress);
  console.log("REWARD_MANAGER_ADDRESS=", rewardManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

