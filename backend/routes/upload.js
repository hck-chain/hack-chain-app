const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { PinataSDK } = require("pinata");
const { authenticate } = require("../middleware/auth");
const { validateImageBuffer } = require("../utils/validateImageBuffer");

const router = express.Router();

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
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

      const result = await pinata.upload.public.file(
        new Blob([req.file.buffer], { type: validation.mime }),
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

module.exports = router;
