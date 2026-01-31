const opensea = require("@api/opensea");
const express = require("express");
const router = express.Router();
opensea.auth(process.env.OPENSEA_API_KEY);
const CONTRACT_ADDRESS = "0x8D21aC87475eC2EE80fB149E376035F5E29DCa7C".toLowerCase();

// Collection /api/opensea/collection/:slug
router.get("/collection/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { data } = await opensea.get_collection({ slug: slug, accept: '*/*' });
    res.status(200).json(data);
  } catch (error) {
    console.error("OpenSea error: ", error);
    res.status(500).json({
      message: "Error fetching collection from OpenSea",
      error: error?.message
    });
  }
});

// Certificates by account /api/opensea/certificates/
router.post("/certificates/", async (req, res) => {
  try {
    const { address } = req.body;
    const slug = "firstversion";
    const { data } = await opensea.get_nfts_by_account({
      limit: 20,
      chain: 'polygon',
      address,
      accept: '*/*'
    });
    const certificates = data.nfts.filter(nft => nft.collection === slug);
    res.status(200).json(certificates);
  } catch (error) {
    console.error("OpenSea error: ", error);
    res.status(500).json({
      message: "Error fetching certificates",
      error: error?.message
    });
  }
});

// Single certificate OpenSea URL (by tokenId)
router.get("/certificate/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    const openseaUrl = `https://opensea.io/assets/matic/${CONTRACT_ADDRESS}/${tokenId}`;

    res.status(200).json({
      contract_address: CONTRACT_ADDRESS,
      token_id: tokenId,
      opensea_url: openseaUrl
    });
  } catch (error) {
    console.error("OpenSea URL error:", error);
    res.status(500).json({
      message: "Error generating OpenSea URL",
      error: error?.message
    });
  }
});



module.exports = router;

// Slug -> hack-certificate-196949664
// Slug 2 -> First version