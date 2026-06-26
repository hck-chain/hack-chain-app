const cron = require("node-cron");
const { notifyClassReminder } = require("../services/emailService");

const LOG = "[classReminderWorker]";

async function sendRemindersOnce(models) {
  const { Op } = models.Sequelize;
  const now = new Date();

  // Find confirmed classes starting between now+23h and now+25h.
  // We query by date range in SQL, then filter by exact time in JS to avoid
  // SQL string interpolation (times are stored as "HH:MM" strings, not timestamps).
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const dateFrom    = windowStart.toISOString().slice(0, 10);
  const dateTo      = windowEnd.toISOString().slice(0, 10);

  const candidates = await models.ClassRequest.findAll({
    where: {
      status: 'confirmed',
      reminder_sent: false,
      requested_date: { [Op.between]: [dateFrom, dateTo] },
    },
    include: [
      {
        model: models.User,
        as: 'student',
        attributes: ['email', 'name', 'lastname'],
      },
    ],
    attributes: ['id', 'student_wallet_address', 'issuer_wallet_address', 'requested_date', 'start_time', 'duration_minutes', 'class_name'],
  });

  // Filter to exact 23–25h window using JS (times assumed UTC-consistent)
  const toRemind = candidates.filter(r => {
    const [h, m] = r.start_time.split(':').map(Number);
    const classTs = new Date(
      `${r.requested_date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
    ).getTime();
    return classTs >= windowStart.getTime() && classTs <= windowEnd.getTime();
  });

  if (toRemind.length === 0) return;

  console.log(`${LOG} ${toRemind.length} reminder(s) to send`);

  for (const request of toRemind) {
    // Mark sent BEFORE sending to prevent double-send if email call throws
    await models.ClassRequest.update({ reminder_sent: true }, { where: { id: request.id } });

    const educatorUser = await models.User.findOne({
      where: { wallet_address: request.issuer_wallet_address.toLowerCase() },
      attributes: ['email', 'name'],
    });

    const studentName = [request.student?.name, request.student?.lastname]
      .filter(Boolean).join(' ') || null;
    const educatorName = educatorUser?.name || null;

    const sharedArgs = {
      className: request.class_name || null,
      requestedDate: request.requested_date,
      startTime: request.start_time,
      durationMinutes: request.duration_minutes,
    };

    const sends = [];

    if (request.student?.email) {
      sends.push(
        notifyClassReminder({
          to: request.student.email,
          recipientName: studentName,
          counterpartName: educatorName,
          role: 'student',
          ...sharedArgs,
        }).catch(err => console.error(`${LOG} talent email failed (id=${request.id}):`, err.message))
      );
    }

    if (educatorUser?.email) {
      sends.push(
        notifyClassReminder({
          to: educatorUser.email,
          recipientName: educatorName,
          counterpartName: studentName,
          role: 'educator',
          ...sharedArgs,
        }).catch(err => console.error(`${LOG} educator email failed (id=${request.id}):`, err.message))
      );
    }

    await Promise.all(sends);
    console.log(`${LOG} reminders sent for class_request id=${request.id}`);
  }
}

function scheduleClassReminder(options = {}) {
  const models = options.models || require("../models");

  // Runs every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      await sendRemindersOnce(models);
    } catch (err) {
      console.error(`${LOG} unexpected error:`, err.message);
    }
  });

  console.log(`${LOG} scheduled (hourly)`);
}

module.exports = { scheduleClassReminder, sendRemindersOnce };
