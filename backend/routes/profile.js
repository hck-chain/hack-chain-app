// backend/routes/profile.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const profileController = require("../controllers/profileController");

/**
 * GET /api/profile/me
 */
router.get("/me", authenticate, profileController.getMe);

/**
 * PUT /api/profile/me
 * Validaciones básicas:
 * - name (opcional) min 1
 * - lastName (opcional) min 1
 * - age (opcional) numeric
 * - bio (opcional) max 500 chars
 */
router.put(
  "/me",
  authenticate,
  [
    body("name").optional().isString().isLength({ min: 1 }).withMessage("Invalid name"),
    body("lastName").optional().isString().isLength({ min: 1 }).withMessage("Invalid lastName"),
    body("age").optional().isInt({ min: 0 }).withMessage("Invalid age"),
    body("bio").optional().isString().isLength({ max: 500 }).withMessage("Bio too long"),
    body("email").optional().isEmail().withMessage("Invalid email"),
  ],
  profileController.updateMe
);

/**
 * alias para settings
 */
router.get("/settings", authenticate, profileController.getMe);
router.put("/settings", authenticate, [
  body("name").optional().isString().isLength({ min: 1 }),
  body("lastName").optional().isString().isLength({ min: 1 }),
  body("bio").optional().isString().isLength({ max: 500 }),
], profileController.updateMe);

module.exports = router;
