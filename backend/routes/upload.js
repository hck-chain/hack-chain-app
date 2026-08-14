const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const sharp = require("sharp");
const { PinataSDK } = require("pinata");
const { authenticate } = require("../middleware/auth");
const { validateImageBuffer } = require("../utils/validateImageBuffer");

const router = express.Router();

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — payment proof screenshots

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const uploadProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROOF_FILE_SIZE },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Try again in an hour." },
  keyGenerator: (req) => req.auth.wallet,
});

const proofUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Try again in an hour." },
  keyGenerator: (req) => req.auth.wallet,
});

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

// POST /api/upload/image
router.post(
  "/image",
  authenticate,
  uploadLimiter,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const validation = validateImageBuffer(req.file.buffer);
      if (!validation.valid) {
        return res.status(415).json({ error: validation.reason });
      }

      const optimized = await sharp(req.file.buffer)
        .resize(400, 400, { fit: "cover", position: "centre" })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const result = await pinata.upload.public.file(
        new Blob([optimized], { type: "image/jpeg" }),
        {
          pinataMetadata: { name: req.file.originalname },
        }
      );

      return res.json({
        cid: result.cid,
        uri: `ipfs://${result.cid}`,
      });
    } catch (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File exceeds the 2 MB limit" });
      }
      console.error("Upload image error:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// POST /api/upload/payment-proof — screenshot of a class-payment transfer.
// No resize: a cropped-to-square proof screenshot would be unreadable, so
// this skips the sharp() step the avatar route above uses.
router.post(
  "/payment-proof",
  authenticate,
  proofUploadLimiter,
  uploadProof.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const validation = validateImageBuffer(req.file.buffer);
      if (!validation.valid) {
        return res.status(415).json({ error: validation.reason });
      }

      const result = await pinata.upload.public.file(
        new Blob([req.file.buffer], { type: req.file.mimetype }),
        {
          pinataMetadata: { name: `payment-proof-${req.auth.wallet}` },
        }
      );

      return res.json({
        cid: result.cid,
        uri: `ipfs://${result.cid}`,
      });
    } catch (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File exceeds the 10 MB limit" });
      }
      console.error("Upload payment proof error:", err);
      res.status(500).json({ error: "Failed to upload payment proof" });
    }
  }
);

module.exports = router;
