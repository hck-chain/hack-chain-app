// backend/routes/issuers.js
const express = require("express");
const router = express.Router();
const { Issuer, Student, User, Certificate } = require("../models");
const students = require("../models/students");
const { getUserFromToken } = require("../middleware/auth.js")

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

    if (!issuer) {
      return res.status(404).json({ error: "Issuer not found" });
    }

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
    if (!issuer) {
      return res.status(404).json({ error: "Issuer not found" });
    }

    await issuer.update({ organization_name });

    res.json({ message: "Issuer updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issuer" });
  }
});

// POST api/issuers/mint
router.post("/mint", async (req, res) => {
  try {
    const { walletStudent, nameStudent, professor, courseName, imageUri } = req.body;
    if (!walletStudent || !nameStudent || !professor || !courseName || !imageUri) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const walletExists = await Student.findOne({ where: { wallet_address: walletStudent } });
    const professorExists = await Issuer.findOne({ where: { wallet_address: professor.toLowerCase() } });
    if (!professorExists) {
      throw new Error(`No se encontró un issuer con la wallet ${professor}`);
    }
    const professorName = professorExists.organization_name;

    if (walletExists) {

      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${hoy.getMonth() + 1}-${hoy.getDate()}`;

      const uri = {
        "name": nameStudent,
        "course": courseName,
        "professor": professorName,
        "date": `${fecha}`,
        "imageCID": imageUri,
      };
      const pinata = await fetch("http://localhost:3001/api/certificates/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uri)
      });

      let data;
      try {
        data = await pinata.json();
      } catch (e) {
        console.error("Failed to parse Pinata response:", e);
        return res.status(500).json({ error: "Invalid response from Pinata" });
      }
      const tokenUri = `ipfs://${data.cid}`;

      return res.json({
        walletStudent,
        nameStudent,
        courseName,
        tokenUri
      });
    } else {
      return res.status(404).json({ error: "Student not found" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Incorrect data" })
  }
});

module.exports = router;
