/**
 * Returns a student's profile for an authenticated recruiter view.
 * Unlike getPublicStudentProfile, this includes the name and full wallet,
 * since the caller is already authenticated as a recruiter.
 * Returns { ok: true, data: { student: { ... } } } on success
 */
async function getStudentProfileForRecruiter({ models, walletAddress }) {
  if (!models || !walletAddress) throw new TypeError('getStudentProfileForRecruiter requires { models, walletAddress }');
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
  const totalCertificates = await Certificate.count({
    where: { student_wallet_address: wallet, is_revoked: false, status: 'issued' },
  });
  const studentView = {
    wallet_address: student.wallet_address,
    name: student.User ? `${student.User.name || ''} ${student.User.lastname || ''}`.trim() : null,
    field_of_study: student.field_of_study || null,
    photo_url: student.photo_url || null,
    total_certificates: totalCertificates,
    created_at: student.User?.created_at || null,
  };
  return { ok: true, data: { student: studentView } };
}
module.exports = { getStudentProfileForRecruiter };