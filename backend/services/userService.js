// backend/services/userService.js
const { Student, Issuer, Recruiter } = require("../models");

/**
 * Normaliza el resultado: { modelName: 'student'|'issuer'|'recruiter', user }
 */
async function findUserByEmail(email) {
  if (!email) return null;
  let user = await Student.findOne({ where: { email } });
  if (user) return { modelName: "student", user };

  user = await Issuer.findOne({ where: { email } });
  if (user) return { modelName: "issuer", user };

  user = await Recruiter.findOne({ where: { email } });
  if (user) return { modelName: "recruiter", user };

  return null;
}

function modelForRole(role) {
  if (!role) return null;
  switch (role.toString().toLowerCase()) {
    case "student":
      return Student;
    case "issuer":
    case "educator":
    case "educator": // normalized
      return Issuer;
    case "recruiter":
      return Recruiter;
    default:
      return null;
  }
}

async function getUserByIdAndRole(id, role) {
  const Model = modelForRole(role);
  if (!Model) return null;
  const user = await Model.findByPk(id);
  return user ? { modelName: role.toLowerCase(), user } : null;
}

/**
 * updates object: only updates allowed fields depending on role
 */
async function updateUserByIdAndRole(id, role, updates) {
  const Model = modelForRole(role);
  if (!Model) throw new Error("Invalid role");

  // Allowed fields per role (safe whitelist)
  const allowedByRole = {
    student: ["name", "lastName", "age", "email", "bio", "avatarUrl"],
    issuer: ["name", "email", "bio", "address"],
    recruiter: ["name", "lastName", "email", "bio"],
  };

  const allowed = allowedByRole[role.toLowerCase()] || [];
  const filtered = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) filtered[k] = updates[k];
  }

  // Special: if no updates, return current
  const instance = await Model.findByPk(id);
  if (!instance) return null;

  await instance.update(filtered);
  return instance;
}

module.exports = {
  findUserByEmail,
  getUserByIdAndRole,
  updateUserByIdAndRole,
};
