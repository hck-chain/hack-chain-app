const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/image", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const formData = new FormData();
        formData.append("file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const response = await axios.post(
            "https://uploads.pinata.cloud/v3/files",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${process.env.PINATA_JWT}`,
                },
            }
        );

        const cid = response.data.data.cid;

        res.json({
            success: true,
            cid,
            ipfsUrl: `ipfs://${cid}`,
            gatewayUrl: `${process.env.GATEWAY_URL}/ipfs/${cid}`,
        });
    } catch (error) {
        console.error("Pinata upload error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to upload image" });
    }
});

module.exports = router;
