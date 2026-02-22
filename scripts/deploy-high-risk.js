const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("⚠️  WARNING: Deploying HIGH-RISK TEST contract");
  console.log("⚠️  This contract contains intentional vulnerabilities");
  console.log("⚠️  FOR TESTING PURPOSES ONLY - DO NOT USE IN PRODUCTION");
  console.log("\nDeploying contracts with:", deployer.address);

  // Check if we have a token address, otherwise deploy a simple one first
  let tokenAddress = process.env.TOKEN_ADDRESS;
  
  if (!tokenAddress) {
    console.log("\n📝 No token address found, deploying SecurityToken first...");
    const SecurityToken = await hre.ethers.getContractFactory("SecurityToken");
    const securityToken = await SecurityToken.deploy(hre.ethers.parseUnits("1000000", 18));
    await securityToken.waitForDeployment();
    tokenAddress = await securityToken.getAddress();
    console.log("SecurityToken deployed to:", tokenAddress);
  }

  console.log("\n🚀 Deploying HighRiskTest contract...");
  const HighRiskTest = await hre.ethers.getContractFactory("HighRiskTest");
  const highRiskTest = await HighRiskTest.deploy(tokenAddress);
  await highRiskTest.waitForDeployment();
  const highRiskAddress = await highRiskTest.getAddress();

  console.log("\n✅ HighRiskTest deployed to:", highRiskAddress);
  
  console.log("\n📋 Contract Summary:");
  console.log("- Deployer:", deployer.address);
  console.log("- Token Address:", tokenAddress);
  console.log("- HighRiskTest Address:", highRiskAddress);
  
  console.log("\n⚠️  VULNERABILITIES INCLUDED:");
  console.log("- No access control on emergencyWithdraw()");
  console.log("- Reentrancy in deposit()");
  console.log("- Integer overflow/underflow in riskyTransfer()");
  console.log("- Unchecked external call in approveToken()");
  console.log("- tx.origin authentication in privilegedMint()");
  console.log("- Self-destruct without checks");
  console.log("- Arbitrary delegatecall execution");
  
  console.log("\n🔧 Update your .env with:");
  console.log("HIGH_RISK_TEST_ADDRESS=", highRiskAddress);
  console.log("TOKEN_ADDRESS=", tokenAddress);
  
  console.log("\n🧪 To test vulnerabilities, you can:");
  console.log("1. Call emergencyWithdraw() to drain ETH");
  console.log("2. Use reentrancy attacks on deposit()");
  console.log("3. Exploit integer overflow in riskyTransfer()");
  console.log("4. Test delegatecall with malicious contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
