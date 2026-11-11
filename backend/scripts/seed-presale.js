// backend/scripts/seed-presale.js
//
// Carga datos de prueba de la preventa para poder recorrer /presale con la
// pagina poblada, sin tener que tocar SQL a mano.
//
//   npm run seed:presale -- 0xTuWalletAqui
//   SEED_WALLET=0x... npm run seed:presale
//
// Deja:
//   - un usuario (filas en `users` Y en `students`: el login por wallet llama a
//     findUserByWallet, que busca en las tablas de rol y devuelve null si falta
//     la segunda, y la ruta revienta con un 500 que parece un bug del front)
//   - para tu wallet: dos aportes validados, uno pendiente y uno rechazado,
//     para ver los cuatro estados del panel individual
//   - 24 contribuidores mas, validados, para que la lista publica tenga con que
//     paginar y buscar
//
// Es idempotente: borra lo que haya sembrado antes (se reconoce por el prefijo
// de tx_hash) y lo vuelve a crear. No toca nada que no haya puesto el.
const SEED_TX_PREFIX = "0xseed";

// Mismos precios que frontend/src/utils/presale.ts y routes/presale.js.
const PHASES = {
  1: { price: 0.00003 },
  2: { price: 0.00005 },
  3: { price: 0.00008 },
};

const hackFor = (usdt, phaseId) => Math.floor(usdt / PHASES[phaseId].price);

/** tx_hash determinista y reconocible: 0xseed + relleno hasta 66 caracteres. */
const seedTxHash = (n) =>
  SEED_TX_PREFIX + String(n).padStart(2, "0").repeat(30).slice(0, 66 - SEED_TX_PREFIX.length);

/**
 * @param {object} deps modelos ya inicializados (User, Student, PresaleContribution, Sequelize)
 * @param {string} wallet direccion del comprador de prueba
 */
async function seedPresale({ User, Student, PresaleContribution, Sequelize }, wallet) {
  const { Op } = Sequelize;
  const crypto = require("crypto");
  const owner = wallet.toLowerCase();

  // --- usuario ---
  const [user, createdUser] = await User.findOrCreate({
    where: { wallet_address: owner },
    defaults: {
      wallet_address: owner,
      role: "student",
      name: "Comprador",
      lastname: "De Prueba",
      nonce: crypto.randomBytes(16).toString("hex"),
      is_active: true,
      email_verified: false,
    },
  });
  // Sin nonce no se puede pedir el desafio de firma.
  if (!createdUser && !user.nonce) {
    await user.update({ nonce: crypto.randomBytes(16).toString("hex") });
  }

  const [, createdStudent] = await Student.findOrCreate({
    where: { wallet_address: owner },
    defaults: { wallet_address: owner },
  });

  // --- aportes ---
  const removed = await PresaleContribution.destroy({
    where: { tx_hash: { [Op.like]: `${SEED_TX_PREFIX}%` } },
  });

  const rows = [];
  let n = 0;

  // Los cuatro estados, sobre la wallet que se esta probando.
  rows.push(
    { phase_id: 1, usdt: 30, status: "validated" },
    { phase_id: 2, usdt: 50, status: "validated" },
    { phase_id: 2, usdt: 25, status: "pending" },
    { phase_id: 3, usdt: 40, status: "rejected", reason: "El comprobante no corresponde a la dirección oficial." },
  ).length;

  const own = rows.map((r) => ({
    wallet_address: owner,
    phase_id: r.phase_id,
    usdt_amount: r.usdt,
    hack_amount: hackFor(r.usdt, r.phase_id),
    tx_hash: seedTxHash(n++),
    proof_cid: `bafkreiseed${n}`,
    proof_uri: `ipfs://bafkreiseed${n}`,
    status: r.status,
    rejection_reason: r.reason ?? null,
    validated_at: r.status === "validated" ? new Date() : null,
  }));

  // Relleno del registro publico: 24 direcciones distintas, todas validadas,
  // suficientes para ver el paginado (10 por pagina) y probar el buscador.
  const others = Array.from({ length: 24 }, (_, i) => {
    const phaseId = (i % 3) + 1;
    const usdt = 20 + i * 5;
    return {
      wallet_address: "0x" + (i + 10).toString(16).padStart(2, "0").repeat(20),
      phase_id: phaseId,
      usdt_amount: usdt,
      hack_amount: hackFor(usdt, phaseId),
      tx_hash: seedTxHash(n++),
      proof_cid: `bafkreiseed${n}`,
      proof_uri: `ipfs://bafkreiseed${n}`,
      status: "validated",
      validated_at: new Date(),
    };
  });

  const created = await PresaleContribution.bulkCreate([...own, ...others]);

  return {
    wallet: owner,
    createdUser,
    createdStudent,
    removed,
    ownContributions: own.length,
    otherContributors: others.length,
    total: created.length,
  };
}

async function main() {
  require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

  const wallet = process.argv[2] || process.env.SEED_WALLET;
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    console.error(
      "Falta la wallet. Uso:\n" +
      "  npm run seed:presale -- 0xTuWalletDe40Hex\n" +
      "  SEED_WALLET=0x... npm run seed:presale"
    );
    process.exit(1);
  }

  const db = require("../models");
  const result = await seedPresale(db, wallet);

  console.log(`Wallet sembrada:     ${result.wallet}`);
  console.log(`  usuario:           ${result.createdUser ? "creado" : "ya existía"}`);
  console.log(`  fila de student:   ${result.createdStudent ? "creada" : "ya existía"}`);
  console.log(`  aportes previos:   ${result.removed} borrados`);
  console.log(`  aportes propios:   ${result.ownContributions} (2 validados, 1 pendiente, 1 rechazado)`);
  console.log(`  otros validados:   ${result.otherContributors}`);
  console.log(`\nEntrá a /presale, conectá esa wallet y firmá.`);

  await db.sequelize.close();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error("Seed de preventa falló:", err);
    process.exit(1);
  });
}

module.exports = { seedPresale, seedTxHash, hackFor, SEED_TX_PREFIX };
