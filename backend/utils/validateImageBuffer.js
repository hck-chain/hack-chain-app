const ALLOWED_TYPES = {
  jpeg: { mime: "image/jpeg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png:  { mime: "image/png",  magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  webp: {
    mime: "image/webp",
    magic: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
};

/**
 * Validates a file buffer against allowed image magic bytes.
 * Returns { valid: true, mime } or { valid: false, reason }.
 */
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false, reason: "File is too small or empty" };
  }

  for (const [, type] of Object.entries(ALLOWED_TYPES)) {
    if (type.magic(buffer)) {
      return { valid: true, mime: type.mime };
    }
  }

  return { valid: false, reason: "File type not allowed. Only JPEG, PNG, and WebP are accepted" };
}

module.exports = { validateImageBuffer };
