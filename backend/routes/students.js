// backend/routes/students.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const buildRateLimitStore = require("../lib/rateLimitStore");
const { Student, User, Certificate, Issuer } = require("../models");
const { authenticate } = require("../middleware/auth");
const { validateDeletionMessage, deleteStudentAccount } = require("../services/studentService");
const { getPublicStudentProfile } = require("../usecases/students/getPublicStudentProfile");
const { getOwnStudentProfile } = require("../usecases/students/getOwnStudentProfile");
const { updateOwnStudentProfile } = require("../usecases/students/updateOwnStudentProfile");
const { updateStudentPhoto } = require("../usecases/students/updateStudentPhoto");
const { registerStudentProfileShare } = require("../usecases/students/registerStudentProfileShare");
const { getStudentEducators } = require("../usecases/students/getStudentEducators");

// GET /api/students/me — own full profile (authenticated).
// Must be registered before /:wallet_address to avoid param capture.
router.get("/me", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only talent accounts can access this endpoint" });
  }

  try {
    const result = await getOwnStudentProfile({ models: { Student, User }, wallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/students/me error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/students/me — update own profile.
// Must be registered before /:wallet_address to avoid param capture.
router.patch("/me", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only talent accounts can update this profile" });
  }

  try {
    const result = await updateOwnStudentProfile({
      models: { Student },
      wallet: req.auth.wallet,
      bio: req.body.bio,
      knowledgeAreas: req.body.knowledge_areas,
      fieldOfStudy: req.body.field_of_study,
      githubUrl: req.body.github_url,
      linkedinUrl: req.body.linkedin_url,
      twitterUrl: req.body.twitter_url,
      instagramUrl: req.body.instagram_url,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("PATCH /api/students/me error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /api/students/:wallet_address/public — public profile (no auth, no email exposed)
router.get("/:wallet_address/public", async (req, res) => {
  try {
    const result = await getPublicStudentProfile({
      models: { Student, User, Certificate, Issuer },
      walletAddress: req.params.wallet_address,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/students/:wallet_address/public error:", err);
    return res.status(500).json({ error: "Failed to fetch student profile" });
  }
});

// GET /api/students
router.get("/", authenticate, async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'wallet_address', 'name', 'lastname', 'is_active', 'created_at']
        },
        {
          model: Certificate,
          as: "certificates",
          attributes: ['id']  // Solo necesitamos contar
        }
      ]
    });

    const result = students.map(student => ({
      id: student.id,
      wallet_address: student.wallet_address,
      field_of_study: student.field_of_study || "N/A",
      user: student.User || null,
      total_certificates: student.certificates.length,
      created_at: student.created_at
    }));

    res.json({ students: result });

  } catch (err) {
    console.error("Failed to fetch students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET /api/students/:wallet_address — public profile (privacy-focused)
router.get("/:wallet_address", async (req, res) => {
  try {
    const wallet = req.params.wallet_address;

    const result = await getPublicStudentProfile({ models: { Student, User, Certificate, Issuer }, walletAddress: wallet });
    if (!result.ok) return res.status(result.httpStatus || 500).json({ error: result.message });

    return res.json(result.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// GET /api/students/:wallet_address/educators
// Returns the list of educators who have issued certificates to this student.
// Only the student themselves can access this endpoint.
router.get("/:wallet_address/educators", authenticate, async (req, res) => {
  try {
    const wallet = req.params.wallet_address.toLowerCase();

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (req.auth.wallet.toLowerCase() !== wallet) {
      return res.status(403).json({ error: "Forbidden: cannot access another student's educators" });
    }

    const agg = await getStudentEducators({ models: { Certificate, Issuer, User }, wallet });
    if (!agg.ok) return res.status(agg.httpStatus || 500).json({ error: agg.message });

    const { educators } = agg.data;
    return res.json({ educators });

  } catch (err) {
    console.error("Failed to fetch student educators:", err);
    res.status(500).json({ error: "Failed to fetch educators" });
  }
});

// PUT /api/students/:wallet_address
router.put("/:wallet_address", authenticate, async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { field_of_study } = req.body;

    if (req.auth.wallet.toLowerCase() !== wallet_address.toLowerCase()) {
      return res.status(403).json({ error: "Cannot modify another student's profile" });
    }

    const student = await Student.findOne({ where: { wallet_address } });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    await student.update({ field_of_study });

    res.json({ message: "Student updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// DELETE /api/students/me — hard delete own account (requires wallet signature)
router.delete("/me", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "student") {
      return res.status(403).json({ error: "Only student accounts can be deleted via this endpoint" });
    }

    const wallet = req.auth.wallet.toLowerCase();
    const { signature, message } = req.body;

    if (!signature || !message) {
      return res.status(400).json({ error: "signature and message are required" });
    }

    const validation = validateDeletionMessage(message, signature, wallet);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    await deleteStudentAccount(wallet);
    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("delete student error:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// 60 requests/min per IP — public endpoint, mirrors issuers' shareLimiter.
// Redis-backed store so the limit is shared across instances.
const shareLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRateLimitStore("/api/students/share"),
});

// POST /api/students/:wallet/share — public, increments the profile share counter.
router.post("/:wallet/share", shareLimiter, async (req, res) => {
  try {
    const result = await registerStudentProfileShare({ models: { Student }, walletAddress: req.params.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("POST /api/students/:wallet/share error:", err);
    return res.status(500).json({ error: "Failed to register share" });
  }
});

// PATCH /api/students/me/photo — update own profile photo (ipfs:// URI only)
router.patch("/me/photo", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only student accounts can update this profile" });
  }

  try {
    const result = await updateStudentPhoto({ models: { Student }, wallet: req.auth.wallet, photoUrl: req.body.photo_url });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("Failed to update student photo:", err);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

module.exports = router;
