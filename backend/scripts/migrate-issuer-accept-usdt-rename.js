// One-off data migration: class_settings.accept_usdc -> class_settings.accept_usdt.
// The field always meant "accepts stablecoin"; the rest of the system
// (class_requests.currency default, payment docs) already treats USDT as
// canonical. This just renames the key inside existing JSONB blobs so no
// read-site code needs a legacy fallback.
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize, Issuer } = require("../models");

async function run() {
  const issuers = await Issuer.findAll({ where: {} });
  let renamed = 0;

  for (const issuer of issuers) {
    const settings = issuer.class_settings;
    if (!settings || typeof settings !== "object") continue;
    if (!Object.prototype.hasOwnProperty.call(settings, "accept_usdc")) continue;
    if (Object.prototype.hasOwnProperty.call(settings, "accept_usdt")) continue;

    const { accept_usdc, ...rest } = settings;
    await issuer.update({ class_settings: { ...rest, accept_usdt: accept_usdc } });
    renamed += 1;
    console.log(`Renamed accept_usdc -> accept_usdt for issuer ${issuer.wallet_address}`);
  }

  console.log(`Migration complete. ${renamed} issuer(s) updated.`);
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
