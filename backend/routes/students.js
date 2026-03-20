// backend/routes/students.js
const express = require("express");
const router = express.Router();
const { Student, User, Certificate } = require("../models");

// GET /api/students
router.get("/", async (req, res) => {
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
router.get("/:wallet_address", async (req, res) => {
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



// PUT /api/students/:wallet_address
router.put("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { field_of_study } = req.body;

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

module.exports = router;
