const VALID_STATUSES = ["confirmed", "cancelled", "completed"];

// Meeting links are always plain web URLs — no ipfs: needed here, unlike
// payment proofs.
const ALLOWED_MEETING_URL_SCHEMES = ["http:", "https:"];

// Matches any URL scheme prefix (e.g. "https:", "ftp:", "javascript:"). Used
// only to detect the ABSENCE of a scheme — a bad scheme still falls through
// to isSafeMeetingUrl's allowlist check untouched.
const SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

// Educators commonly paste meeting links copied from a calendar invite body
// (e.g. "meet.google.com/abc-defg-hij") without the "https://" prefix —
// default to https instead of rejecting a legitimate link outright.
function normalizeMeetingUrl(url) {
  return SCHEME_RE.test(url) ? url : `https://${url}`;
}

function isSafeMeetingUrl(url) {
  try {
    return ALLOWED_MEETING_URL_SCHEMES.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * Educator updates the status of a class request they own. When confirming
 * (or re-confirming, to edit it later), they may attach a meeting link
 * (Meet/Zoom/Teams/etc.) that the talent uses to join the session.
 */
async function updateClassRequestStatus({ models, requestId, issuerWallet, status, cancellationReason, meetingUrl }) {
  if (!models || !issuerWallet) {
    throw new TypeError("updateClassRequestStatus requires { models, issuerWallet }");
  }

  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, code: "INVALID_STATUS", httpStatus: 400 };
  }

  if (meetingUrl && status !== "confirmed") {
    return { ok: false, code: "MEETING_URL_REQUIRES_CONFIRMED", httpStatus: 400 };
  }

  const normalizedMeetingUrl = meetingUrl ? normalizeMeetingUrl(String(meetingUrl).trim()) : meetingUrl;

  if (normalizedMeetingUrl && !isSafeMeetingUrl(normalizedMeetingUrl)) {
    return { ok: false, code: "INVALID_MEETING_URL", httpStatus: 400 };
  }

  const record = await models.ClassRequest.findOne({
    where: {
      id: requestId,
      issuer_wallet_address: issuerWallet.toLowerCase(),
    },
  });

  if (!record) {
    return { ok: false, code: "REQUEST_NOT_FOUND", httpStatus: 404 };
  }

  // Captured before the update — lets the caller tell a real pending->confirmed
  // transition apart from a re-save (e.g. editing the meeting link on an
  // already-confirmed request), which needs a different notification.
  const previousStatus = record.status;
  const previousMeetingUrl = record.meeting_url;

  const updateData = { status };
  if (status === "cancelled" && cancellationReason) {
    updateData.cancellation_reason = String(cancellationReason).slice(0, 500);
  }
  if (status === "confirmed" && meetingUrl !== undefined) {
    updateData.meeting_url = normalizedMeetingUrl || null;
  }
  await record.update(updateData);

  return {
    ok: true,
    data: {
      id: record.id,
      status: record.status,
      meeting_url: record.meeting_url,
      previous_status: previousStatus,
      meeting_url_changed: record.meeting_url !== previousMeetingUrl,
    },
  };
}

module.exports = { updateClassRequestStatus };
