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
    const { student_wallet_address, nameStudent, professor, courseName, imageUri } = req.body;

    if (!student_wallet_address || !nameStudent || !professor || !courseName || !imageUri) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalizamos wallets a minúsculas
    const studentWalletLower = student_wallet_address.toLowerCase();
    const professorLower = professor.toLowerCase();

    // Verificamos existencia de student e issuer
    const studentExists = await Student.findOne({ where: { wallet_address: studentWalletLower } });
    const issuerExists = await Issuer.findOne({ where: { wallet_address: professorLower } });

    if (!studentExists) return res.status(404).json({ error: "Student not found" });
    if (!issuerExists) return res.status(404).json({ error: "Issuer not found" });

    const professorName = issuerExists.organization_name;

    // Fecha actual
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${hoy.getMonth() + 1}-${hoy.getDate()}`;

    // Generamos URI para IPFS / Pinata
    const uri = {
      name: nameStudent,
      course: courseName,
      professor: professorName,
      date: fecha,
      imageCID: imageUri,
    };

    const pinataRes = await fetch("https://hack-chain-app.onrender.com/api/certificates/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uri)
    });

    let pinataData;
    try {
      pinataData = await pinataRes.json();
    } catch (e) {
      console.error("Failed to parse Pinata response:", e);
      return res.status(500).json({ error: "Invalid response from Pinata" });
    }

    const tokenUri = pinataData.cid;

    // Creamos certificado en DB
    const certificate = await Certificate.create({
      student_wallet_address: studentWalletLower,
      issuer_wallet_address: professorLower,
      title: courseName,
      description: `Certificado de ${courseName} otorgado a ${nameStudent}`,
      certificate_hash,
      token_id,
      issue_date: fecha,
    });

    // Incrementamos contador de certificados del issuer
    await Issuer.increment(
      { certificates_issued: 1 },
      { where: { wallet_address: professorLower } }
    );

    return res.json({
      success: true,
      certificate: {
        id: certificate.id,
        student_wallet_address: certificate.student_wallet_address,
        issuer_wallet_address: certificate.issuer_wallet_address,
        courseName: certificate.title,
        tokenUri,
        issue_date: certificate.issue_date
      }
    });

  } catch (err) {
    console.error("Error creating certificate:", err);
    return res.status(500).json({ error: "Failed to create certificate" });
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
