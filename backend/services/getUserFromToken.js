// Usa require si tu backend es CommonJS
const { Student, Issuer, Recruiter } = require("../models");

async function getUserFromToken(authPayload) {
  // 1. Aseguramos minúsculas
  const wallet = authPayload.wallet.toLowerCase();
  const role = authPayload.role;

  let found = null;

  // 2. Buscamos según el rol
  // Usamos el modelo correspondiente
  const models = {
    student: Student,
    issuer: Issuer,
    recruiter: Recruiter
  };

  const Model = models[role];
  if (!Model) return null;

  // 3. En Postgres, es mejor buscar así para evitar líos de mayúsculas
  found = await Model.findOne({
    where: {
      wallet_address: wallet // Asegúrate que en la DB también estén en minúsculas
    }
  });

  if (!found) return null;

  // 4. Retornamos la estructura que el frontend espera en /me
  return {
    modelName: role,
    user: found.toJSON ? found.toJSON() : found
  };
}

module.exports = { getUserFromToken };