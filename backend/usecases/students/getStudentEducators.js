/**
 * Returns grouped educators who have issued certificates to the given student wallet.
 * This is a pure data usecase (no auth); callers should enforce authorization if needed.
 *
 * Result: { ok: true, data: { educators: [...] } } or { ok: false, httpStatus, message }
 */
async function getStudentEducators({ models, wallet }) {
  if (!models || !wallet) throw new TypeError("getStudentEducators requires { models, wallet }");

  const { Certificate, Issuer } = models;

  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return { ok: false, httpStatus: 400, message: "Invalid wallet address" };
  }

  const certs = await Certificate.findAll({
    where: { student_wallet_address: wallet.toLowerCase() },
    attributes: ["issuer_wallet_address"],
    include: [
      {
        model: Issuer,
        attributes: [
          "wallet_address",
          "organization_name",
          "photo_url",
          "bio",
          "knowledge_areas",
          "certificates_issued",
        ],
        include: [
          {
            model: models.User,
            attributes: ["name", "lastname", "created_at"],
          },
        ],
      },
    ],
  });

  // Group by issuer and count how many certs this specific student received from each
  const issuerMap = new Map();
  for (const cert of certs) {
    const wa = cert.issuer_wallet_address;
    if (!issuerMap.has(wa)) {
      issuerMap.set(wa, { issuer: cert.Issuer, certs_to_me: 0 });
    }
    issuerMap.get(wa).certs_to_me += 1;
  }

  const educators = Array.from(issuerMap.values()).map(({ issuer, certs_to_me }) => ({
    wallet_address: issuer.wallet_address,
    organization_name: issuer.organization_name,
    name: issuer.User?.name || null,
    lastname: issuer.User?.lastname || null,
    photo_url: issuer.photo_url || null,
    bio: issuer.bio || null,
    knowledge_areas: issuer.knowledge_areas || [],
    certificates_issued: issuer.certificates_issued,
    joined_at: issuer.User?.created_at || null,
    certs_to_me,
  }));

  return { ok: true, data: { educators } };
}

module.exports = { getStudentEducators };