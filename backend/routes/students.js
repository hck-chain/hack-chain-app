// backend/routes/students.js
const express = require("express");
const router = express.Router();
const { Student, User, Certificate, Issuer } = require("../models");
const { authenticate } = require("../middleware/auth");
const { validateDeletionMessage, deleteStudentAccount } = require("../services/studentService");

// GET /api/students
router.get("/", authenticate, async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
        },
        {
          model: Certificate,
          as: "certificates", // 🔑 Usa el alias correcto
          attributes: ['id']  // Solo necesitamos contar
        }
      ]
    });

    const result = students.map(student => ({
      id: student.id,
      wallet_address: student.wallet_address,
      field_of_study: student.field_of_study || "N/A",
      user: student.User || null,
      total_certificates: student.certificates.length, // 🔹 Cantidad de certificados
      created_at: student.created_at
    }));

    res.json({ students: result });

  } catch (err) {
    console.error("Failed to fetch students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});


// GET /api/students/:wallet_address
router.get("/:wallet_address", authenticate, async (req, res) => {
  try {
    const { wallet_address } = req.params;

    // 1️⃣ Buscar el estudiante con su usuario
    const student = await Student.findOne({
      where: { wallet_address },
      include: [
        {
          model: User,
          attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 2️⃣ Contar certificados directamente
    const totalCertificates = await Certificate.count({
      where: { student_wallet_address: wallet_address }
    });

    // 3️⃣ Responder con toda la info
    res.json({
      student: {
        id: student.id,
        wallet_address: student.wallet_address,
        field_of_study: student.field_of_study,
        user: student.User,
        total_certificates: totalCertificates, // ✅ número correcto
        created_at: student.created_at
      }
    });

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

    const certs = await Certificate.findAll({
      where: { student_wallet_address: wallet },
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
              model: User,
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

    res.json({ educators });

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

module.exports = router;
