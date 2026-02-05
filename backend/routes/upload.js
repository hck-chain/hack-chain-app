const express = require("express");
const multer = require("multer");
const { PinataSDK } = require("pinata");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.GATEWAY_URL,
});

// POST /api/upload/image
router.post("/image", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const result = await pinata.upload.public.file(
            new Blob([req.file.buffer]),
            {
                pinataMetadata: {
                    name: req.file.originalname,
                },
            }
        );

        return res.json({
            cid: result.cid,
            uri: `ipfs://${result.cid}`,
        });
    } catch (err) {
        console.error("Upload image error:", err);
        res.status(500).json({ error: "Failed to upload image" });
    }
});

module.exports = router;
