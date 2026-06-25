const cron = require("node-cron");
const { notifyTalentClassRequestUpdate } = require("../services/emailService");

const LOG = "[classExpiryWorker]";
const EXPIRY_REASON = "Sistema: solicitud vencida — el educador no respondió a tiempo.";

async function expirePendingRequestsOnce(models) {
  const { Op } = models.Sequelize;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Fetch pending requests whose date is in the past. We include today so that
  // the JS time check can catch classes from earlier today.
  const candidates = await models.ClassRequest.findAll({
    where: {
      status: "pending",
      requested_date: { [Op.lte]: todayStr },
    },
    include: [
      {
        model: models.User,
        as: "student",
        attributes: ["email", "name", "lastname"],
      },
    ],
    attributes: [
      "id",
      "requested_date",
      "start_time",
      "duration_minutes",
      "class_name",
      "issuer_wallet_address",
    ],
  });

  // Keep only classes whose start time has already passed (JS filter avoids
  // SQL string manipulation on time fields stored as "HH:MM").
  const expired = candidates.filter((r) => {
    const [h, m] = r.start_time.split(":").map(Number);
    const classTs = new Date(
      `${r.requested_date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
    ).getTime();
    return classTs < now.getTime();
  });

  if (expired.length === 0) return;

  console.log(`${LOG} expiring ${expired.length} pending request(s)`);

  for (const request of expired) {
    await models.ClassRequest.update(
      { status: "cancelled", cancellation_reason: EXPIRY_REASON },
      { where: { id: request.id } }
    );

    const educatorUser = await models.User.findOne({
      where: { wallet_address: request.issuer_wallet_address.toLowerCase() },
      attributes: ["name"],
    });

    const studentName = [request.student?.name, request.student?.lastname]
      .filter(Boolean)
      .join(" ") || null;

    if (request.student?.email) {
      notifyTalentClassRequestUpdate({
        to: request.student.email,
        studentName,
        educatorName: educatorUser?.name || null,
        className: request.class_name || null,
        requestedDate: request.requested_date,
        startTime: request.start_time,
        durationMinutes: request.duration_minutes,
        requestId: request.id,
        status: "expired",
        cancellationReason: null,
      }).catch((err) =>
        console.error(`${LOG} email failed (id=${request.id}):`, err.message)
      );
    }

    console.log(`${LOG} expired class_request id=${request.id}`);
  }
}

function scheduleClassExpiry(options = {}) {
  const models = options.models || require("../models");

  // Runs every hour at minute 5 (offset from the reminder worker at minute 0)
  cron.schedule("5 * * * *", async () => {
    try {
      await expirePendingRequestsOnce(models);
    } catch (err) {
      console.error(`${LOG} unexpected error:`, err.message);
    }
  });

  console.log(`${LOG} scheduled (hourly)`);
}

module.exports = { scheduleClassExpiry, expirePendingRequestsOnce };
