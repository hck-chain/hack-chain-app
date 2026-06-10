// backend/harjoot/adapters/incentivesPayoutAdapter.js
const { ethers } = require("ethers");
const config = require("../config/referrals");

class IncentivesPayoutAdapterError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "IncentivesPayoutAdapterError";
    if (cause) this.cause = cause;
  }
}

function createRealAdapter({ rpcUrl, privateKey, tokenAddress }) {
  if (!rpcUrl || !privateKey || !tokenAddress) {
    throw new TypeError("createRealAdapter requires rpcUrl, privateKey, and tokenAddress");
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Minimal ERC20 ABI just for transfer
  const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
  const contract = new ethers.Contract(tokenAddress, abi, wallet);

  return {
    async transferHack(toAddress, amountWei) {
      try {
        // Send the transaction
        const tx = await contract.transfer(toAddress, amountWei);
        return { txHash: tx.hash };
      } catch (err) {
        throw new IncentivesPayoutAdapterError(`Transfer failed: ${err.message || err}`, err);
      }
    }
  };
}

function createMockAdapter() {
  const queue = [];

  return {
    async transferHack(toAddress, amountWei) {
      const next = queue.shift();
      if (next && next.type === "error") throw next.value;
      
      // Simulate network delay
      await new Promise(r => setTimeout(r, 10));
      return { txHash: `0xmocktxhash_${Date.now()}_${Math.floor(Math.random()*1000)}` };
    },
    __setNextError(err) {
      queue.push({ type: "error", value: err });
    },
    __reset() {
      queue.length = 0;
    }
  };
}

let cached = null;

function isMockMode() {
  const v = process.env.CHAIN_USE_MOCK;
  return v === "true" || v === "1";
}

function createIncentivesPayoutAdapter() {
  if (cached) return cached;

  if (isMockMode()) {
    console.log("[incentivesPayoutAdapter] using mock adapter (CHAIN_USE_MOCK=true)");
    cached = createMockAdapter();
    return cached;
  }

  if (!process.env.POLYGON_RPC_URL) {
    throw new IncentivesPayoutAdapterError("POLYGON_RPC_URL required for real adapter");
  }
  if (!config.poolPrivateKey) {
    throw new IncentivesPayoutAdapterError("INCENTIVES_POOL_PRIVATE_KEY required for real adapter");
  }
  if (!config.chain.hackTokenAddress) {
    throw new IncentivesPayoutAdapterError("HACK_TOKEN_ADDRESS required for real adapter");
  }

  cached = createRealAdapter({
    rpcUrl: process.env.POLYGON_RPC_URL,
    privateKey: config.poolPrivateKey,
    tokenAddress: config.chain.hackTokenAddress
  });
  
  return cached;
}

function __resetForTests() {
  cached = null;
}

module.exports = {
  createIncentivesPayoutAdapter,
  createRealAdapter,
  createMockAdapter,
  IncentivesPayoutAdapterError,
  __resetForTests
};
