const opensea = require("@api/opensea");
const express = require("express");
const router = express.Router();
opensea.auth(process.env.OPENSEA_API_KEY);
//const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS.toLowerCase();
const CONTRACT_ADDRESS = "0x61d2e94543DD498b7FD86450f1fC8135cB60021C";

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
      limit: 200,
      chain: 'polygon',
      address,
      accept: '*/*'
    });

    // Filtrar solo los certificados de tu colección
    let certificates = data.nfts.filter(nft => nft.collection === slug);

    // Ordenar por fecha de creación: más reciente primero
    certificates.sort((a, b) => {
      const dateA = new Date(a.created_at || a.mint_date || 0);
      const dateB = new Date(b.created_at || b.mint_date || 0);
      return dateB - dateA; // descendente
    });

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


router.get("/certificates/:educator", async (req, res) => {
  try {
    const { educator } = req.params;

    const url = `https://api.opensea.io/api/v2/chain/matic/contract/${CONTRACT_ADDRESS}/nfts?limit=200`;

    const response = await fetch(url, {
      headers: {
        "X-API-KEY": process.env.OPENSEA_API_KEY,
      },
    });

    const data = await response.json();

    if (!data?.nfts) {
      return res.json({ total: 0 });
    }

    let total = 0;

    for (const nft of data.nfts) {
      if (!nft.metadata_url) continue;

      const ipfsUrl = nft.metadata_url.replace(
        "ipfs://",
        "https://ipfs.io/ipfs/"
      );

      try {
        const metaRes = await fetch(ipfsUrl);

        const contentType = metaRes.headers.get("content-type") || "";

        // SI NO ES JSON, LO IGNORAMOS
        if (!contentType.includes("application/json")) {
          continue;
        }

        const meta = await metaRes.json();

        const professorAttr = meta.attributes?.find(
          attr => attr.trait_type === "Professor"
        );

        if (
          professorAttr?.value?.trim().toLowerCase() ===
          educator.trim().toLowerCase()
        ) {
          total++;
        }

      } catch (err) {
        console.error("Metadata parse skipped:", ipfsUrl);
      }
    }

    return res.json({ total });
  } catch (error) {
    console.error("OpenSea route error:", error);
    return res.status(500).json({ total: 0 });
  }
});


module.exports = router;

// Slug -> hack-certificate-196949664
// Slug 2 -> First version

