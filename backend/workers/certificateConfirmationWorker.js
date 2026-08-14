const cron = require("node-cron");
const { notifyCertificateAutoConfirmed } = require("../services/emailService");

const LOG = "[certificateConfirmationWorker]";

async function autoConfirmCertificatesOnce(models) {
  const { Op } = models.Sequelize;
  const now = new Date();

  const candidates = await models.Certificate.findAll({
    where: {
      status: "issued",
      confirmation_deadline: { [Op.lte]: now },
    },
    attributes: ["id", "title", "student_wallet_address"],
  });

  if (candidates.length === 0) return;

  console.log(`${LOG} auto-confirming ${candidates.length} certificate(s)`);

  for (const certificate of candidates) {
    await models.Certificate.update(
      { status: "confirmed", confirmation_deadline: null },
      { where: { id: certificate.id } }
    );

    const studentUser = await models.User.findOne({
      where: { wallet_address: certificate.student_wallet_address.toLowerCase() },
      attributes: ["email", "name", "lastname"],
    });

    if (studentUser?.email) {
      notifyCertificateAutoConfirmed({
        to: studentUser.email,
        studentName: [studentUser.name, studentUser.lastname].filter(Boolean).join(" ") || null,
        certificateTitle: certificate.title || null,
      }).catch((err) =>
        console.error(`${LOG} email failed (id=${certificate.id}):`, err.message)
      );
    }

    console.log(`${LOG} auto-confirmed certificate id=${certificate.id}`);
  }
}

function scheduleCertificateConfirmation(options = {}) {
  const models = options.models || require("../models");

  // Runs every hour at minute 10 (offset from classExpiryWorker at :05 and
  // classReminderWorker at :00)
  cron.schedule("10 * * * *", async () => {
    try {
      await autoConfirmCertificatesOnce(models);
    } catch (err) {
      console.error(`${LOG} unexpected error:`, err.message);
    }
  });

  console.log(`${LOG} scheduled (hourly)`);
}

module.exports = { scheduleCertificateConfirmation, autoConfirmCertificatesOnce };
