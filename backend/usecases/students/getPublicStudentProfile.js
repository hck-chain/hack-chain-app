/**
 * Returns a public view of a student's profile suitable for public pages.
 * Does NOT include the educators list — that requires authentication and
 * ownership check (see GET /:wallet_address/educators).
 * Returns { ok: true, data: { student: { ... } } } on success
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
  // Public count a recruiter relies on: revoked certificates and ones still
  // reserved (status 'pending', never minted on-chain) must not inflate it.
  // Revoking only flips is_revoked and leaves status as 'issued', so both apply.
  const totalCertificates = await Certificate.count({
    where: { student_wallet_address: wallet, is_revoked: false, status: 'issued' },
  });
  // Build a privacy-first public view: only expose minimal fields
  const studentPublic = {
    // No name, wallet or exact registration date to protect privacy
    field_of_study: student.field_of_study || null,
    photo_url: student.photo_url || null,
    total_certificates: totalCertificates,
  };
  return { ok: true, data: { student: studentPublic } };
}
module.exports = { getPublicStudentProfile };