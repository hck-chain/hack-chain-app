const express = require("express");
const { PinataSDK } = require("pinata");
const router = express.Router();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

const { Certificate, Student, Issuer } = require("../models");
const { GEOGRAPHY } = require("sequelize");

// POST /api/certificates: Upload certificate metadata to Pinata
router.post("/", async (req, res) => {
  try {
    const { name, course, professor, date, imageCID } = req.body;

    if (!name || !course || !professor || !date || !imageCID) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const metadata = {
      name: `Certificate for ${name}`,
      description: "HackChain Tokenized Certificate",
      image: `ipfs://${imageCID}`,
      attributes: [
        { trait_type: "Student", value: name },
        { trait_type: "Course", value: course },
        { trait_type: "Professor", value: professor },
        { trait_type: "Date", value: date },
      ],
    };

    const result = await pinata.upload.public.json(metadata, {
      pinataMetadata: { name: `Certificate-${name}` },
    });

    res.json({
      cid: result.cid,
      uri: `ipfs://${result.cid}`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload metadata" });
  }
});


// POST /api/certificates/link
router.post("/link", async (req, res) => {
  try {
    const { token_id } = req.body;
    if (!token_id) {
      return res.status(400).json({ error: "Token ID is required" });
    }
    const certificate_url = `https://opensea.io/item/polygon/0x8d21ac87475ec2ee80fb149e376035f5e29dca7c/${token_id}`;
    const verified = await fetch(certificate_url, {
      method: "GET"
    })
    if (verified.ok) {
      return res.status(201).json({
        message: "Link created",
        link: certificate_url
      });
    } else {
      return res.status(verified.status).json({
        error: "Certificate not found"
      })
    }
  } catch (error) {
    console.error("Error creating link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

// POST /api/certificates/verify
router.post("/verify", async (req, res) => {
  try {
    const { link } = req.body;
    const verified = await fetch(link, {
      method: "GET"
    });
    if (verified.ok) {
      return res.status(200).json({
        message: "This certificate is authentic",
        authenticity: true
      });
    } else {
      return res.status(verified.status).json({
        error: "This certificate is not authentic",
        authenticity: false
      })
    }
  } catch (error) {
    console.error("Error checking certificate authenticity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

// GET /api/certificates/:cid: Fetch certificate metadata from Pinata
router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid) return res.status(400).json({ error: "CID is required" });
    const file = await pinata.gateways.public.get(cid);
    res.json(file.data);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Metadata not found" });
  }
});

// POST /api/certificates/database
router.post("/database", async (req, res) => {
  try {
    let {
      student_wallet_address,
      issuer_wallet_address,
      title,
      description,
      certificate_hash,
      blockchain_tx_hash,
      token_id,
      issue_date
    } = req.body;

    // 1. Validaciones iniciales
    if (!student_wallet_address || !issuer_wallet_address || !title || !issue_date) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 2. Limpieza profunda de las wallets (Minúsculas y sin espacios)
    // El .trim() elimina saltos de línea o espacios invisibles que rompen la búsqueda
    const clean_issuer_wallet = issuer_wallet_address.toLowerCase().trim();
    const clean_student_wallet = student_wallet_address.toLowerCase().trim();

    // 3. Log de depuración (Míralo en los logs de Render)
    console.log(`Verificando emisor en DB: [${clean_issuer_wallet}]`);

    // 4. Búsqueda del emisor
    // Usamos Sequelize.where con LOWER y TRIM para que la búsqueda sea idéntica a la DB
    const issuer = await Issuer.findOne({
      where: sequelize.where(
        sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('wallet_address'))),
        clean_issuer_wallet
      )
    });

    if (!issuer) {
      // Si falla, listamos lo que hay en la DB para entender por qué
      const allIssuers = await Issuer.findAll({ attributes: ['wallet_address'], raw: true });
      console.error("❌ Emisor no encontrado. Wallets en DB:", allIssuers.map(i => i.wallet_address));

      return res.status(404).json({
        error: "Issuer not found",
        details: "La wallet del profesor no está registrada o tiene caracteres invisibles."
      });
    }

    // 5. Crear el certificado utilizando las wallets ya limpias
    const certificate = await Certificate.create({
      student_wallet_address: clean_student_wallet,
      issuer_wallet_address: clean_issuer_wallet,
      title,
      description: description || "Tokenized HackChain Certificate",
      certificate_hash,
      blockchain_tx_hash,
      issue_date,
      token_id,
      is_revoked: false
    });

    // 6. Respuesta exitosa
    res.status(201).json({
      message: "Certificate created successfully",
      certificate: {
        id: certificate.token_id,
        issuer_wallet_address: certificate.issuer_wallet_address,
        title: certificate.title,
        blockchain_tx_hash: certificate.blockchain_tx_hash,
        token_id: certificate.token_id,
        issue_date: certificate.issue_date,
        created_at: certificate.created_at
      }
    });

  } catch (error) {
    console.error("Error creating certificate:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// GET /api/certificates/database
router.get("/database", async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      include: [{
        model: Issuer,
        include: [{
          model: User,
          attributes: ['name', 'lastname', 'email']
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      certificates: certificates.map(cert => ({
        id: cert.id,
        issuer_wallet_address: cert.issuer_wallet_address,
        title: cert.title,
        description: cert.description,
        certificate_hash: cert.certificate_hash,
        blockchain_tx_hash: cert.blockchain_tx_hash,
        issue_date: cert.issue_date,
        is_revoked: cert.is_revoked,
        created_at: cert.created_at,
        issuer: cert.Issuer
      }))
    });

  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/certificates/database/:id
router.get("/database/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findByPk(id, {
      include: [{
        model: Issuer,
        include: [{
          model: User,
          attributes: ['name', 'lastname', 'email']
        }]
      }]
    });

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json({
      certificate: {
        id: certificate.id,
        issuer_wallet_address: certificate.issuer_wallet_address,
        title: certificate.title,
        description: certificate.description,
        certificate_hash: certificate.certificate_hash,
        blockchain_tx_hash: certificate.blockchain_tx_hash,
        token_id: certificate.token_id,
        issue_date: certificate.issue_date,
        is_revoked: certificate.is_revoked,
        created_at: certificate.created_at,
        issuer: certificate.Issuer
      }
    });

  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/certificates/database/:id/revoke
router.put("/database/:id/revoke", async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    await certificate.update({ is_revoked: true });

    res.json({
      message: "Certificate revoked successfully",
      certificate: {
        id: certificate.id,
        is_revoked: certificate.is_revoked
      }
    });

  } catch (error) {
    console.error("Error revoking certificate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router; 