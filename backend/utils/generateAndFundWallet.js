// backend/utils/generateAndFundWallet.js
// Safety-first wallet generator for local/testing use.
//
// - Does NOT write private keys into project-level files by default.
// - Does NOT print private keys unless SHOW_PRIVATE_KEY=true (opt-in).
// - Funding is optional and will run only if FUND_WALLET=true and SENDER_PRIVATE_KEY is set.
// - This script is intended for **local manual use** only (do NOT run in CI or on shared servers).

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

(async () => {
  try {
    const provider = process.env.RPC_URL ? new ethers.JsonRpcProvider(process.env.RPC_URL) : null;
    const senderWallet = (process.env.SENDER_PRIVATE_KEY && provider)
      ? new ethers.Wallet(process.env.SENDER_PRIVATE_KEY, provider)
      : null;

    const newWallet = ethers.Wallet.createRandom();

    console.log("✅ New wallet generated (local/testing):");
    console.log("Address:       ", newWallet.address);
    console.log(">>> IMPORTANT: The private key and mnemonic are sensitive. By default they are NOT printed or saved.");

    // Optionally show the private key/mnemonic (developer opt-in)
    if (process.env.SHOW_PRIVATE_KEY === 'true') {
      console.warn("WARNING: SHOW_PRIVATE_KEY=true — printing private key to stdout. Do NOT commit this output or share it.");
      console.log("Mnemonic:      ", newWallet.mnemonic?.phrase ?? "(none)");
      console.log("Private Key:   ", newWallet.privateKey);
    } else {
      console.log("To reveal private key/mnemonic, set SHOW_PRIVATE_KEY=true in your local environment (NOT recommended).");
    }

    // Optionally save locally outside of repo (developer opt-in)
    if (process.env.SAVE_WALLET_TO_HOME === 'true') {
      try {
        const homeDir = require('os').homedir();
        const outDir = path.join(homeDir, '.hackchain');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
        const outPath = path.join(outDir, `wallet-${Date.now()}.json`);
        const jsonData = {
          address: newWallet.address,
          privateKey: process.env.SHOW_PRIVATE_KEY === 'true' ? newWallet.privateKey : "[HIDDEN]",
          mnemonic: process.env.SHOW_PRIVATE_KEY === 'true' ? newWallet.mnemonic?.phrase ?? null : "[HIDDEN]",
          createdAt: new Date().toISOString()
        };
        fs.writeFileSync(outPath, JSON.stringify(jsonData, null, 2), { mode: 0o600 });
        console.log(`Saved wallet info to ${outPath} (HOME folder). Ensure this file is kept secret.`);
      } catch (err) {
        console.error("Failed to save wallet locally:", err);
      }
    }

    // Funding is optional and controlled by env variable FUND_WALLET=true
    if (process.env.FUND_WALLET === 'true') {
      if (!senderWallet) {
        console.warn("FUND_WALLET=true but SENDER_PRIVATE_KEY or RPC_URL not configured. Skipping funding.");
      } else {
        try {
          const amount = process.env.FUND_AMOUNT || "0.00001"; // default
          console.log(`🚀 Sending ${amount} ETH to ${newWallet.address} (this will wait for confirmation)...`);
          const tx = await senderWallet.sendTransaction({
            to: newWallet.address,
            value: ethers.parseEther(amount)
          });
          const receipt = await tx.wait();
          console.log("✅ Funding transaction confirmed. Hash:", receipt.transactionHash || receipt.hash || tx.hash);
        } catch (err) {
          console.error("Error during funding:", err);
        }
      }
    } else {
      console.log("FUND_WALLET not enabled. Skipping automatic funding.");
    }

    console.log("Done.");
  } catch (err) {
    console.error("Error generating/funding wallet:", err);
  }
})();
