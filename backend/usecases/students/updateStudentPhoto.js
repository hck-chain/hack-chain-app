const IPFS_URI_RE = /^ipfs:\/\/[a-zA-Z0-9]+$/;

/**
 * Updates the authenticated student's profile photo (ipfs:// URI only).
 * Returns a result object — never throws on business errors.
 */
async function updateStudentPhoto({ models, wallet, photoUrl }) {
  if (!models || !wallet) {
    throw new TypeError("updateStudentPhoto requires { models, wallet }");
  }

  if (photoUrl === undefined) {
    return { ok: false, code: "PHOTO_URL_REQUIRED", httpStatus: 400, message: "photo_url is required" };
  }

  if (photoUrl !== null && (typeof photoUrl !== "string" || !IPFS_URI_RE.test(photoUrl))) {
    return { ok: false, code: "INVALID_PHOTO_URL", httpStatus: 400, message: "photo_url must be a valid ipfs:// URI" };
  }

  const student = await models.Student.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!student) {
    return { ok: false, code: "STUDENT_NOT_FOUND", httpStatus: 404, message: "Student not found" };
  }

  await student.update({ photo_url: photoUrl });

  return { ok: true, data: { photo_url: student.photo_url } };
}

module.exports = { updateStudentPhoto };