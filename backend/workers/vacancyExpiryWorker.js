const cron = require("node-cron");
const { Op } = require("sequelize");
const { closeVacancyRecord } = require("../usecases/vacancies/closeVacancy");
const { notifyTalentVacancyApplicationUpdate } = require("../services/emailService");

const LOG = "[vacancyExpiryWorker]";

/**
 * Closes every open vacancy whose closing_date has passed (RF-07, RN-02) and
 * marks its unanswered applications as cerrada_sin_respuesta (RF-07, RN-08),
 * notifying each affected talent (RF-21). Reuses closeVacancyRecord so manual
 * and automatic closes never diverge.
 */
async function closeExpiredVacanciesOnce(models) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const candidates = await models.Vacancy.findAll({
    where: { status: "abierta", closing_date: { [Op.lte]: todayStr } },
  });

  if (candidates.length === 0) return;

  console.log(`${LOG} closing ${candidates.length} expired vacancy(ies)`);

  for (const vacancy of candidates) {
    const affectedApplications = await closeVacancyRecord(vacancy, models);

    for (const application of affectedApplications) {
      const studentUser = await models.User.findOne({
        where: { wallet_address: application.student_wallet_address.toLowerCase() },
        attributes: ["email", "name"],
      });

      if (studentUser?.email) {
        notifyTalentVacancyApplicationUpdate({
          to: studentUser.email,
          studentName: studentUser.name || null,
          position: vacancy.position,
          company: vacancy.company,
          status: "cerrada_sin_respuesta",
        }).catch((err) =>
          console.error(`${LOG} email failed (application id=${application.id}):`, err.message)
        );
      }
    }

    console.log(`${LOG} closed vacancy id=${vacancy.id} slug=${vacancy.slug}`);
  }
}

function scheduleVacancyExpiry(options = {}) {
  const models = options.models || require("../models");

  // Runs every hour at minute 15 — 0/5/10 are already taken by other workers.
  cron.schedule("15 * * * *", async () => {
    try {
      await closeExpiredVacanciesOnce(models);
    } catch (err) {
      console.error(`${LOG} unexpected error:`, err.message);
    }
  });

  console.log(`${LOG} scheduled (hourly)`);
}

module.exports = { scheduleVacancyExpiry, closeExpiredVacanciesOnce };
