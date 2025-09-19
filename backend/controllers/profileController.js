// backend/controllers/profileController.js
const userService = require("../services/userService");
const { validationResult } = require("express-validator");

/**
 * GET /api/profile/me
 * req.auth should be present (authenticate middleware)
 */
async function getMe(req, res) {
  try {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const result = await userService.getUserByIdAndRole(auth.sub, auth.role);
    if (!result) return res.status(404).json({ error: "User not found" });

    const user = result.user.toJSON ? result.user.toJSON() : { ...result.user };
    if (user.passwordHash) delete user.passwordHash;
    if (user.privateKey) delete user.privateKey;

    return res.json({ user, role: result.modelName });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PUT /api/profile/me
 * Body contains allowed fields depending on role.
 * Uses express-validator in routes to validate basic things (e.g., length).
 */
async function updateMe(req, res) {
  try {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const updates = req.body || {};

    // Can't change role or id — ignore those if provided
    delete updates.role;
    delete updates.id;
    delete updates.passwordHash;
    delete updates.privateKey;
    delete updates.walletAddress; // keep walletAddress immutable via profile

    const updated = await userService.updateUserByIdAndRole(auth.sub, auth.role, updates);
    if (!updated) return res.status(404).json({ error: "User not found" });

    const out = updated.toJSON ? updated.toJSON() : { ...updated };
    if (out.passwordHash) delete out.passwordHash;
    if (out.privateKey) delete out.privateKey;

    return res.json({ message: "Profile updated", user: out });
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getMe,
  updateMe,
};
