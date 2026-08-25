const { markApplicationViewed } = require("./markApplicationViewed");

/**
 * Application detail for the owning recruiter (RF-24): shared certificates
 * and message. Opening it for the first time transitions enviada → vista.
 * Returns a result object — never throws on business errors.
 */
async function getApplicationDetail({ models, applicationId, recruiterWallet }) {
  if (!models || !applicationId || !recruiterWallet) {
    throw new TypeError("getApplicationDetail requires { models, applicationId, recruiterWallet }");
  }

  return markApplicationViewed({ models, applicationId, recruiterWallet });
}

module.exports = { getApplicationDetail };
