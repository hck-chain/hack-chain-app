const crypto = require("crypto");

// Creates the User row and its role profile for a caller who already proved control of a
// Privy DID. Returns a result object — never throws on business errors.

const ROLE_REQUIRED_FIELDS = {
  student: ["name", "lastname"],
  issuer: ["organization_name"],
  recruiter: ["name", "lastname", "company_name"],
};

function validateRoleFields(role, fields) {
  const missing = ROLE_REQUIRED_FIELDS[role].filter((f) => !fields[f]);
  if (missing.length > 0) {
    return {
      ok: false,
      code: "MISSING_ROLE_FIELDS",
      httpStatus: 400,
      message: `Missing required fields for ${role}: ${missing.join(", ")}`,
    };
  }
  if (fields.name && fields.name.length > 50) {
    return { ok: false, code: "NAME_TOO_LONG", httpStatus: 400, message: "name must be at most 50 characters" };
  }
  if (fields.lastname && fields.lastname.length > 50) {
    return { ok: false, code: "LASTNAME_TOO_LONG", httpStatus: 400, message: "lastname must be at most 50 characters" };
  }
  if (fields.organization_name && fields.organization_name.length > 255) {
    return { ok: false, code: "ORGANIZATION_NAME_TOO_LONG", httpStatus: 400, message: "organization_name must be at most 255 characters" };
  }
  if (fields.company_name && fields.company_name.length > 255) {
    return { ok: false, code: "COMPANY_NAME_TOO_LONG", httpStatus: 400, message: "company_name must be at most 255 characters" };
  }
  return null;
}

/**
 * @param {object} deps
 * @param {object} deps.models          full db object (needs sequelize + User/Student/Issuer/Recruiter)
 * @param {object} deps.privyService    verifyIdentityToken(token)
 * @param {function} deps.authorizeIssuer  on-chain authorization for issuers
 * @param {string} deps.did             DID already verified from the registration token
 * @param {string} deps.identityToken
 * @param {string} deps.role
 * @param {object} deps.fields          { name, lastname, organization_name, company_name, field_of_study }
 */
async function completeRegistration({
  models,
  privyService,
  authorizeIssuer,
  did,
  identityToken,
  role,
  fields = {},
}) {
  if (!models || !privyService || !authorizeIssuer) {
    throw new TypeError("completeRegistration requires { models, privyService, authorizeIssuer }");
  }
  if (!did) {
    throw new TypeError("completeRegistration requires a verified did");
  }

  const { User, Student, Issuer, Recruiter, sequelize } = models;

  if (!ROLE_REQUIRED_FIELDS[role]) {
    return { ok: false, code: "INVALID_ROLE", httpStatus: 400, message: "Invalid role" };
  }

  const fieldError = validateRoleFields(role, fields);
  if (fieldError) return fieldError;

  if (!identityToken) {
    return {
      ok: false,
      code: "IDENTITY_TOKEN_REQUIRED",
      httpStatus: 400,
      message: "identity_token is required",
    };
  }

  const identity = await privyService.verifyIdentityToken(identityToken);
  if (!identity) {
    return {
      ok: false,
      code: "INVALID_PRIVY_TOKEN",
      httpStatus: 401,
      message: "Invalid or expired Privy session",
    };
  }

  // The identity token must belong to the same DID the registration token was issued for,
  // otherwise a caller could register a profile against someone else's identity.
  if (identity.did !== did) {
    return {
      ok: false,
      code: "TOKEN_MISMATCH",
      httpStatus: 401,
      message: "Invalid or expired Privy session",
    };
  }

  // Registering twice is a retry, not an error: return the row that already exists.
  const existing = await User.findOne({ where: { privy_did: did } });
  if (existing) {
    return { ok: true, data: { user: existing, alreadyRegistered: true } };
  }

  if (!identity.embeddedWallet) {
    // Privy provisions the embedded wallet asynchronously. wallet_address is NOT NULL, so
    // the row cannot be created yet — the client retries with a fresh identity token.
    return {
      ok: false,
      code: "WALLET_NOT_READY",
      httpStatus: 503,
      message: "Embedded wallet is not ready yet, retry shortly",
    };
  }

  const email = identity.email ? identity.email.toLowerCase().trim() : null;
  if (!email) {
    return {
      ok: false,
      code: "EMAIL_REQUIRED",
      httpStatus: 400,
      message: "The Privy account must have an email address linked",
    };
  }

  const wallet = identity.embeddedWallet.toLowerCase();

  const walletTaken = await User.findOne({ where: { wallet_address: wallet } });
  if (walletTaken) {
    return {
      ok: false,
      code: "WALLET_ALREADY_REGISTERED",
      httpStatus: 409,
      message: "This wallet already belongs to another account",
    };
  }

  // The email comes from verified Privy claims, so telling the caller an account already
  // exists is not an enumeration oracle: they demonstrably control that address.
  const emailTaken = await User.findOne({ where: { email } });
  if (emailTaken) {
    return {
      ok: false,
      code: "ACCOUNT_EXISTS",
      httpStatus: 409,
      message: "An account already exists for this email. Log in with the method you used to register.",
      data: { login_method: emailTaken.privy_did ? "privy" : "wallet" },
    };
  }

  let createdUser;
  try {
    await sequelize.transaction(async (t) => {
      createdUser = await User.create(
        {
          wallet_address: wallet,
          integrated_wallet_address: wallet,
          privy_did: did,
          role,
          name: fields.name || null,
          lastname: fields.lastname || null,
          email,
          // Privy already verified the address before issuing the identity token.
          email_verified: true,
          nonce: crypto.randomBytes(16).toString("hex"),
          is_active: true,
          educator_approval_status: role === "issuer" ? "pending_approval" : null,
        },
        { transaction: t }
      );

      if (role === "student") {
        await Student.create(
          { wallet_address: wallet, field_of_study: fields.field_of_study || null },
          { transaction: t }
        );
      } else if (role === "issuer") {
        await Issuer.create(
          { wallet_address: wallet, organization_name: fields.organization_name },
          { transaction: t }
        );
        // Same ordering as POST /api/users/register: if the on-chain call throws, the
        // transaction rolls back and no half-registered issuer is left behind.
        await authorizeIssuer(wallet);
      } else if (role === "recruiter") {
        await Recruiter.create(
          { wallet_address: wallet, company_name: fields.company_name },
          { transaction: t }
        );
      }
    });
  } catch (err) {
    console.error("[privy] complete-registration failed:", err.message);
    return {
      ok: false,
      code: "REGISTRATION_FAILED",
      httpStatus: 500,
      message: "Could not complete registration",
    };
  }

  return { ok: true, data: { user: createdUser, alreadyRegistered: false } };
}

module.exports = { completeRegistration };
