const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const crypto = require("crypto");
const { User, Student, Issuer, Recruiter } = require("../models");

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { wallet_address, role, name, lastname, email, organization_name, field_of_study, company_name } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    if (!role || !['student', 'issuer', 'recruiter'].includes(role)) {
      return res.status(400).json({ error: "Valid role required (student, issuer, recruiter)" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { wallet_address } });
    if (existingUser) {
      return res.status(409).json({ error: "User already registered" });
    }

    // Generate nonce for wallet verification
    const nonce = crypto.randomBytes(16).toString('hex');

    // Create user
    const newUser = await User.create({
      wallet_address: wallet_address.toLowerCase(),
      role,
      name,
      lastname,
      email,
      nonce,
      is_active: true
    });

    // Create role-specific entry
    let roleSpecificData = null;

    if (role === 'student') {
      roleSpecificData = await Student.create({
        wallet_address,
        field_of_study
      });
    } else if (role === 'issuer') {
      if (!organization_name) {
        return res.status(400).json({ error: "Organization name required for issuers" });
      }
      roleSpecificData = await Issuer.create({
        wallet_address,
        organization_name
      });
    } else if (role === 'recruiter') {
      roleSpecificData = await Recruiter.create({
        wallet_address,
        company_name
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        wallet_address: newUser.wallet_address,
        role: newUser.role,
        name: newUser.name,
        lastname: newUser.lastname,
        email: newUser.email,
        nonce: newUser.nonce,
        is_active: newUser.is_active
      },
      roleData: roleSpecificData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// GET /api/users/:wallet_address
router.get("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const user = await User.findOne({
      where: { wallet_address },
      include: [
        { model: Student, required: false },
        { model: Issuer, required: false },
        { model: Recruiter, required: false }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        role: user.role,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        is_active: user.is_active,
        created_at: user.created_at
      },
      roleData: user.Student || user.Issuer || user.Recruiter || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT /api/users/:wallet_address
router.put("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { name, lastname, email, field_of_study, organization_name, company_name } = req.body;

    const user = await User.findOne({ where: { wallet_address } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user data
    await user.update({
      name: name || user.name,
      lastname: lastname || user.lastname,
      email: email || user.email
    });

    // Update role-specific data
    if (user.role === 'student' && field_of_study !== undefined) {
      await Student.update(
        { field_of_study },
        { where: { wallet_address } }
      );
    } else if (user.role === 'issuer' && organization_name !== undefined) {
      await Issuer.update(
        { organization_name },
        { where: { wallet_address } }
      );
    } else if (user.role === 'recruiter' && company_name !== undefined) {
      await Recruiter.update(
        { company_name },
        { where: { wallet_address } }
      );
    }

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// POST /api/users/:wallet_address/nonce
router.post("/:wallet_address/nonce", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const user = await User.findOne({ where: { wallet_address } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newNonce = crypto.randomBytes(16).toString('hex');
    await user.update({ nonce: newNonce });

    res.json({ nonce: newNonce });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

module.exports = router;