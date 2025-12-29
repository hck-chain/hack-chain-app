const opensea = require("@api/opensea");
const express = require("express");
const router = express.Router();
opensea.auth(process.env.OPENSEA_API_KEY);

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

// Certificates by account /api/opensea/collection/:slug
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
    const certificates = data.nfts.filter(nft => nft.collection === slug)
    res.status(200).json(certificates);
  } catch (error) {
    console.error("OpenSea error: ", error);
    res.status(500).json({
      message: "Error fetching certificates",
      error: error?.message
    });
  }
});

module.exports = router;

// Slug -> hack-certificate-196949664
// Slug 2 -> First version