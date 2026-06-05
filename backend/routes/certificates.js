const express = require("express");
const { PinataSDK } = require("pinata");
const router = express.Router();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

const { body, validationResult } = require("express-validator");
const db = require("../models");
const { Certificate, Student, Issuer, User, sequelize } = require("../models");
const { authenticate } = require("../middleware/auth");
const emailService = require("../services/emailService");
const paymentService = require("../services/paymentService");
const { inviteTalent } = require("../harjoot/usecases/inviteTalent");
const { precheckCertificate } = require("../harjoot/usecases/precheckCertificate");

// Lowercased 0x-prefixed Ethereum address.
function isHexWallet(value) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

// ===========================================================================
// Harjoot integration — SKELETON routes (DS Sections 4 and 5).
// Implementation pending: the Harjoot partner API is not available yet.
// Each handler returns 501 until implemented.
// See documents/harjoot-integration-handoff.md for the full contract.
//
// Services these routes will use (add the requires when implementing):
//   ../services/harjootService    ../services/paymentService
//   ../middleware/harjootAccess   ../services/issuerService
// ===========================================================================

/**
 * POST /api/certificates/precheck
 * DS Section 4 — pre-issuance check. Body: { studentWallet }.
 * Verifies (1) the educator is approved (decision 7) and (2) the talent is a
 * registered user (decision 5). Returns the HACK amount to pay plus the
 * Treasury / HACK token addresses, or an error code the form can act on.
 * Error codes: EDUCATOR_NOT_APPROVED | TALENT_NOT_FOUND.
 */
router.post(
  "/precheck",
  authenticate,
  [body("studentWallet").custom(isHexWallet).withMessage("studentWallet must be a 0x-prefixed 40-hex address")],
  async (req, res) => {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only issuers can issue certificates" });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: "validation_failed", details: errors.array() });
    }

    try {
      const educator = await User.findByPk(req.auth.sub);
      if (!educator || educator.role !== "issuer") {
        // Token says issuer but DB disagrees — treat as auth failure rather than 500.
        return res.status(403).json({ error: "Only issuers can issue certificates" });
      }

      const result = await precheckCertificate({
        models: db,
        paymentService,
        educator,
        studentWallet: req.body.studentWallet,
      });

      if (!result.ok) {
        if (result.reason === "EDUCATOR_NOT_APPROVED") {
          return res.status(403).json({ error: "EDUCATOR_NOT_APPROVED" });
        }
        if (result.reason === "TALENT_NOT_FOUND") {
          return res.status(404).json({ error: "TALENT_NOT_FOUND" });
        }
        return res.status(400).json({ error: result.reason || "PRECHECK_FAILED" });
      }

      // bigint cannot be serialized by JSON.stringify; expose the decimal
      // string and let the frontend reconstruct a BigInt if it needs to.
      return res.status(200).json({
        ok: true,
        price: {
          amountHack: result.price.amountHackString,
          userPriceUsdCents: result.price.userPriceUsdCents,
          treasuryAddress: result.price.treasuryAddress,
          hackTokenAddress: result.price.hackTokenAddress,
        },
        talent: result.talent,
      });
    } catch (err) {
      console.error("[/precheck] error:", err && err.message);
      return res.status(500).json({ error: "PRECHECK_FAILED" });
    }
  },
);

/**
 * POST /api/certificates/issue
 * DS Section 4 — full certificate issuance (multipart/form-data).
 * NOTE: the DS labels this "POST /api/certificates", but that path is already
 * used for Pinata metadata upload. It is mapped to /issue here; renaming or
 * merging the two is an OPEN DECISION (see the handoff doc).
 * Fields: title, description, issue_date, studentWallet, pdfFile, paymentTxHash.
 * Flow: verify HACK payment -> hash PDF -> pin to IPFS -> Harjoot upload
 *       (hash_only) -> mint soulbound NFT -> persist -> queue treasury transfer.
 */
router.post("/issue", authenticate, (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only issuers can issue certificates" });
  }
  // TODO(impl): DS Section 4 issuance. Requires the harjootAccess middleware,
  //  multer for the PDF upload, paymentService.verifyHackPayment(),
  //  harjootService.uploadCertificate(), the on-chain mint adapter, and an
  //  INSERT into `treasury_transfers_queue`.
  return res
    .status(501)
    .json({ error: "Not implemented — see documents/harjoot-integration-handoff.md" });
});

/**
 * POST /api/certificates/invite-talent
 * DS Section 5 — invite an unregistered talent by email. Typically called
 * after Section 4's precheck returns TALENT_NOT_FOUND. Dedupes per
 * (educator, wallet) so re-clicks don't spam the invitee.
 *
 * Body: { studentWallet, email, message? }
 * Returns: 200 { invitation } | 409 INVITE_ALREADY_PENDING
 *          | 403 EDUCATOR_NOT_APPROVED | 422 validation
 */
router.post(
  "/invite-talent",
  authenticate,
  [
    body("studentWallet").custom(isHexWallet).withMessage("studentWallet must be a valid 0x-prefixed Ethereum address"),
    body("email").isEmail().withMessage("email must be a valid address").isLength({ max: 255 }),
    body("message").optional({ nullable: true }).isString().isLength({ max: 2000 }),
  ],
  async (req, res) => {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only issuers can invite talents" });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const educator = await User.findByPk(req.auth.sub);
      if (!educator) {
        return res.status(404).json({ error: "Educator not found" });
      }
      if (educator.educator_approval_status !== "approved") {
        return res.status(403).json({ error: "EDUCATOR_NOT_APPROVED" });
      }

      const result = await inviteTalent({
        models: db,
        emailService,
        educator,
        studentWallet: req.body.studentWallet,
        email: req.body.email,
        message: req.body.message,
      });

      if (!result.ok) {
        if (result.reason === "INVITE_ALREADY_PENDING") {
          return res.status(409).json({
            error: "INVITE_ALREADY_PENDING",
            invitation: { id: result.invitation.id, status: result.invitation.status },
          });
        }
        return res.status(400).json({ error: result.reason || "Failed to invite talent" });
      }

      return res.json({
        message: "Talent invited",
        invitation: {
          id: result.invitation.id,
          student_wallet_address: result.invitation.student_wallet_address,
          email: result.invitation.email,
          status: result.invitation.status,
        },
      });
    } catch (err) {
      console.error("POST /api/certificates/invite-talent error:", err);
      return res.status(500).json({ error: "Failed to invite talent" });
    }
  },
);

// POST /api/certificates: Upload certificate metadata to Pinata
router.post("/", authenticate, async (req, res) => {
  if (req.auth.role !== 'issuer') {
    return res.status(403).json({ error: "Only issuers can upload certificate metadata" });
  }
  try {
    const { name, course, professor, date, imageCID } = req.body;

    if (!name || !course || !professor || !date || !imageCID) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const metadata = {
      name: `Certificate for ${name}`,
      description: "",
      //image: `ipfs://${imageCID}`,
      image: imageCID.startsWith('ipfs://') ? imageCID : `ipfs://${imageCID}`,
      attributes: [
        { trait_type: "Student", value: name },
        { trait_type: "Course", value: course },
        { trait_type: "Professor", value: professor },
        { trait_type: "Date", value: date },
      ],
    };

    const result = await pinata.upload.public.json(metadata, {
      //  pinataMetadata: { name: `Certificate-${name}` },
      pinataMetadata: { name: `Certificate-${name}-${course}`.replace(/\s+/g, '-').toLowerCase() },
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
    const certificate_url = `https://opensea.io/item/polygon/0x61d2e94543DD498b7FD86450f1fC8135cB60021C/${token_id}`;
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

// POST /api/certificates/database optimizado
router.post("/database", authenticate, async (req, res) => {
  if (req.auth.role !== 'issuer') {
    return res.status(403).json({ error: "Only issuers can create certificates" });
  }

  try {
    const {
      student_wallet_address, issuer_wallet_address, title,
      description, certificate_hash, blockchain_tx_hash,
      token_id, issue_date
    } = req.body;

    if (!issuer_wallet_address || !issuer_wallet_address.startsWith("0x")) {
      return res.status(400).json({
        error: "Dato inválido",
        details: `Se esperaba una wallet (0x...), pero se recibió: "${issuer_wallet_address}"`
      });
    }

    // 1. Validaciones básicas
    if (!student_wallet_address || !issuer_wallet_address || !title) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 2. Normalización inmediata
    const cleanIssuerWallet = issuer_wallet_address.toLowerCase().trim();
    const cleanStudentWallet = student_wallet_address.toLowerCase().trim();

    if (req.auth.wallet.toLowerCase() !== cleanIssuerWallet) {
      return res.status(403).json({ error: "Issuer wallet must match authenticated wallet" });
    }

    // 3. Búsqueda optimizada (asumiendo que los datos en DB ya están en minúsculas)
    const issuer = await Issuer.findOne({
      where: { wallet_address: cleanIssuerWallet }
    });

    if (!issuer) {
      return res.status(404).json({
        error: "Emisor no autorizado",
        details: `La wallet ${cleanIssuerWallet} no está registrada como emisor permitido.`
      });
    }

    // 4. Creación del certificado
    const certificate = await Certificate.create({
      student_wallet_address: cleanStudentWallet,
      issuer_wallet_address: cleanIssuerWallet,
      title,
      description: description || "Certificado Tokenizado HackChain",
      certificate_hash,
      blockchain_tx_hash,
      issue_date,
      token_id,
      is_revoked: false
    });

    res.status(201).json({
      message: "Certificado sincronizado con éxito",
      id: certificate.id
    });

  } catch (error) {
    console.error("Error en la sincronización de DB:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/certificates/database
router.get("/database", authenticate, async (req, res) => {
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

// PUT /api/certificates/database/:id/revoke
router.put("/database/:id/revoke", authenticate, async (req, res) => {
  if (req.auth.role !== 'issuer') {
    return res.status(403).json({ error: "Only issuers can revoke certificates" });
  }

  try {
    const { id } = req.params;

    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    if (certificate.issuer_wallet_address.toLowerCase() !== req.auth.wallet.toLowerCase()) {
      return res.status(403).json({ error: "Cannot revoke a certificate issued by another issuer" });
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
