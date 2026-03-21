// backend/routes/issuers.js
const express = require("express");
const router = express.Router();
const { Issuer, Student, User, Certificate } = require("../models");
const { authorizeIssuer } = require("../services/authorizeIssuer.js");

// GET /api/issuers
router.get("/", async (req, res) => {
  try {
    const issuers = await Issuer.findAll({
      include: [{
        model: User,
        attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
      }]
    });

    res.json({
      issuers: issuers.map(issuer => ({
        id: issuer.id,
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        user: issuer.User,
        created_at: issuer.created_at
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuers" });
  }
});

// POST /api/issuers/authorize
router.post("/authorize", async (req, res) => {
  try {
    const { issuer } = req.body;
    if (!issuer) return res.status(400).json({ error: "Issuer address required" });

    const txHash = await authorizeIssuer(issuer);
    res.json({ succes: true, txHash });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
//|| !certificate_hash || !token_id)
// POST /api/issuers/mint
router.post("/mint", async (req, res) => {
  try {
    const {
      studentWalletAddress,
      professor,
      tokenUri
    } = req.body;

    if (!studentWalletAddress || !professor || !tokenUri) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const student = await Student.findOne({
      where: { wallet_address: studentWalletAddress.toLowerCase() }
    });

    const issuer = await Issuer.findOne({
      where: { wallet_address: professor.toLowerCase() }
    });

    if (!student) return res.status(404).json({ error: "Student not found" });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    return res.json({
      ok: true,
      tokenUri
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mint validation failed" });
  }
});

// GET /api/issuers/:wallet_address
router.get("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const issuer = await Issuer.findOne({
      where: { wallet_address },
      include: [
        {
          model: User,
          attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
        },
        {
          model: Certificate,
          attributes: ['id', 'title', 'description', 'issue_date', 'is_revoked', 'created_at']
        }
      ]
    });

    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    res.json({
      issuer: {
        id: issuer.id,
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        user: issuer.User,
        certificates: issuer.Certificates,
        created_at: issuer.created_at
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuer" });
  }
});

// PUT /api/issuers/:wallet_address
router.put("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { organization_name } = req.body;

    const issuer = await Issuer.findOne({ where: { wallet_address } });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    await issuer.update({ organization_name });

    res.json({ message: "Issuer updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issuer" });
  }
});

// POST /api/issuers/increment-certificates
router.post("/increment-certificates", async (req, res) => {
  try {
    const { issuerWallet } = req.body;
    if (!issuerWallet) return res.status(400).json({ error: "issuerWallet required" });

    await Issuer.increment(
      { certificates_issued: 1 },
      { where: { wallet_address: issuerWallet.toLowerCase() } }
    );

    res.json({ success: true });

  } catch (error) {
    console.error("Increment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/issuers/:wallet/certificates-count
router.get("/:wallet/certificates-count", async (req, res) => {
  try {
    const { wallet } = req.params;

    const issuer = await Issuer.findOne({
      where: { wallet_address: wallet.toLowerCase() },
      attributes: ["certificates_issued"],
    });

    res.json({
      total: issuer?.certificates_issued || 0,
    });

  } catch (e) {
    console.error("Error fetching certificates:", e);
    res.status(500).json({ total: 0 });
  }
});

module.exports = router;
