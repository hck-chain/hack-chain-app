// backend/services/ipfsCertificateUploader.js
//
// Pinata-backed implementation of the ipfsUpload port consumed by
// harjoot/usecases/issueCertificate.js.
//
// Two pins per certificate:
//   1. the raw PDF blob          -> pdfCid
//   2. an ERC-721 metadata JSON  -> metadataCid (returned as tokenUri)
//
// Metadata follows the de-facto ERC-721 standard so marketplaces (OpenSea,
// etc.) render the certificate. We do NOT include verificationId or external
// URLs that depend on the Harjoot/Mint stages — those run AFTER this step
// in the orchestrator, so the metadata must be derivable from inputs alone.
//
// The export shape matches the function signature the use case expects:
//   uploadCertificate({ pdfBuffer, pdfFileName, title, description,
//                       studentWallet, certificateHash, issueDate })
//     -> Promise<{ tokenUri, pdfCid, metadataCid }>

const { PinataSDK } = require("pinata");

const LOG_PREFIX = "[ipfsCertificateUploader]";

// Lazy singleton so importing this module never crashes when
// PINATA_JWT is not set (tests). Real callers (route handler) trigger
// the validation when the first upload happens.
let cachedClient = null;

function getPinata() {
  if (cachedClient) return cachedClient;
  if (!process.env.PINATA_JWT) {
    throw new Error(
      "PINATA_JWT is required to upload certificates to IPFS",
    );
  }
  cachedClient = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.GATEWAY_URL,
  });
  return cachedClient;
}

function sanitizeMetadataName(s) {
  // Pinata's pinataMetadata.name field is a free-text label visible in the
  // Pinata dashboard. Strip anything we wouldn't want a partner to see.
  return String(s)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80)
    .toLowerCase();
}

/**
 * @param {object} params
 * @param {Buffer} params.pdfBuffer
 * @param {string} params.pdfFileName
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} params.studentWallet
 * @param {string} params.certificateHash
 * @param {string} params.issueDate                 YYYY-MM-DD
 * @param {object} [params.client]                  Override for tests.
 */
async function uploadCertificate(params) {
  const {
    pdfBuffer, pdfFileName, title, description, studentWallet,
    certificateHash, issueDate,
  } = params;

  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new TypeError("uploadCertificate requires a non-empty pdfBuffer");
  }
  if (!title || typeof title !== "string") {
    throw new TypeError("uploadCertificate requires a title");
  }
  if (!certificateHash || typeof certificateHash !== "string") {
    throw new TypeError("uploadCertificate requires a certificateHash");
  }

  const pinata = params.client || getPinata();
  const labelBase = sanitizeMetadataName(`${title}-${certificateHash.slice(0, 8)}`);

  // 1) Pin the PDF.
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  const pdfResp = await pinata.upload.public.file(pdfBlob, {
    pinataMetadata: { name: `${labelBase}-pdf` },
  });
  const pdfCid = pdfResp && pdfResp.cid;
  if (!pdfCid) {
    throw new Error("Pinata did not return a cid for the PDF upload");
  }

  // 2) Build + pin the ERC-721 metadata.
  const metadata = {
    name: `Certificate: ${title}`,
    description: description || "",
    // For document-style NFTs both `image` (legacy) and `animation_url`
    // (richer media) are honored by marketplaces. We use `image` since
    // the existing repo convention does.
    image: `ipfs://${pdfCid}`,
    attributes: [
      { trait_type: "Student",          value: studentWallet },
      { trait_type: "Course",           value: title },
      { trait_type: "Issue Date",       value: issueDate },
      { trait_type: "Certificate Hash", value: certificateHash },
    ],
  };

  const metaResp = await pinata.upload.public.json(metadata, {
    pinataMetadata: { name: `${labelBase}-meta` },
  });
  const metadataCid = metaResp && metaResp.cid;
  if (!metadataCid) {
    throw new Error("Pinata did not return a cid for the metadata upload");
  }

  const tokenUri = `ipfs://${metadataCid}`;
  console.log(`${LOG_PREFIX} pinned tokenUri=${tokenUri} (pdf=${pdfCid})`);
  return { tokenUri, pdfCid, metadataCid };
}

function __resetForTests() {
  cachedClient = null;
}

module.exports = {
  uploadCertificate,
  __resetForTests,
};
