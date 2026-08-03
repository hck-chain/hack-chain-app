const { getStudentEducators } = require('./getStudentEducators');

/**
 * Returns a public view of a student's profile suitable for public pages.
 * Reuses getStudentEducators for the educators aggregation.
 * Returns { ok: true, data: { student: { ... }, educators: [...] } } on success
 */
async function getPublicStudentProfile({ models, walletAddress }) {
  if (!models || !walletAddress) throw new TypeError('getPublicStudentProfile requires { models, walletAddress }');

  const { Student, User, Certificate } = models;

  const wallet = String(walletAddress).toLowerCase();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return { ok: false, httpStatus: 400, message: 'Invalid wallet address' };
  }

  const student = await Student.findOne({
    where: { wallet_address: wallet },
    include: [
      {
        model: User,
        attributes: ['name', 'lastname', 'created_at'], // intentionally exclude email
      },
    ],
  });

  if (!student) {
    return { ok: false, httpStatus: 404, message: 'Student not found' };
  }

  const totalCertificates = await Certificate.count({ where: { student_wallet_address: wallet } });

  // Reuse educational aggregation usecase
  const educatorsAgg = await getStudentEducators({ models, wallet });
  if (!educatorsAgg.ok) {
    // Propagate error but don't expose internals
    return { ok: false, httpStatus: educatorsAgg.httpStatus || 500, message: educatorsAgg.message || 'Failed to aggregate educators' };
  }

  // Build a privacy-first public view: only expose minimal fields
  const studentPublic = {
    // No name, wallet or exact registration date to protect privacy
    field_of_study: student.field_of_study || null,
    photo_url: student.photo_url || null,
    total_certificates: totalCertificates,
  };

  return { ok: true, data: { student: studentPublic, educators: educatorsAgg.data.educators } };
}

module.exports = { getPublicStudentProfile };