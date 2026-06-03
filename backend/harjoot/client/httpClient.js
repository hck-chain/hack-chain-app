// backend/harjoot/client/httpClient.js
//
// Real Harjoot client — wraps axios with the auth header, request/response
// logging (with sanitization), an inline retry on transient failures, and
// error mapping to the typed HarjootError hierarchy.
//
// Public surface: createHttpClient(config) returns a frozen object exposing
// the 5 in-scope Harjoot endpoints (see DS sections 0, 2, 3, 4, 13).
//
// Reference: client-integration-guide.pdf, hackchain-harjoot-integration-gaps.pdf.

const axios = require("axios");
const defaultConfig = require("../config");
const { HarjootError, mapAxiosErrorToHarjootError } = require("./errors");

const LOG_PREFIX = "[harjoot]";

// HackChain stores roles as student/issuer/recruiter; Harjoot expects the
// user-facing segment talent/educator/recruiter.
const ROLE_TO_SEGMENT = Object.freeze({
  student: "talent",
  issuer: "educator",
  recruiter: "recruiter",
});

// Headers that must never reach the log output.
const SENSITIVE_HEADERS = new Set(["x-api-key", "authorization"]);

function sanitizeHeaders(headers) {
  if (!headers) return {};
  const safe = {};
  for (const key of Object.keys(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) continue;
    safe[key] = headers[key];
  }
  return safe;
}

function toSegment(role) {
  const segment = ROLE_TO_SEGMENT[role];
  if (!segment) {
    throw new TypeError(`Unknown HackChain role: ${role}`);
  }
  return segment;
}

// Pick only the fields Harjoot needs in /access/activate. Prevents leaking
// passwordHash, internal flags, etc., if a caller passes the full User row.
function pickUserPayload(user) {
  return {
    id: user.id,
    wallet_address: user.wallet_address,
    role: user.role,
    name: user.name ?? null,
    lastname: user.lastname ?? null,
    email: user.email ?? null,
  };
}

function buildAxiosInstance(config) {
  const instance = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeoutMs,
    headers: { "x-api-key": config.api.apiKey },
  });

  instance.interceptors.request.use((reqConfig) => {
    console.log(
      `${LOG_PREFIX} ${(reqConfig.method || "get").toUpperCase()} ${reqConfig.url}`,
      { headers: sanitizeHeaders(reqConfig.headers) },
    );
    return reqConfig;
  });

  instance.interceptors.response.use(
    (response) => {
      console.log(`${LOG_PREFIX} ${response.status} ${response.config.url}`);
      return response;
    },
    async (axiosError) => {
      const reqConfig = axiosError.config || {};
      reqConfig._retryCount = reqConfig._retryCount || 0;

      const isNetworkError = !axiosError.response;
      const isServerError = axiosError.response && axiosError.response.status >= 500;
      const retryable = isNetworkError || isServerError;

      if (retryable && reqConfig._retryCount < config.api.maxRetries) {
        reqConfig._retryCount += 1;
        const delay = config.api.retryBaseDelayMs * reqConfig._retryCount;
        console.warn(
          `${LOG_PREFIX} retry ${reqConfig._retryCount}/${config.api.maxRetries}` +
            ` in ${delay}ms — ${axiosError.message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance(reqConfig);
      }

      const mapped = mapAxiosErrorToHarjootError(axiosError);
      console.error(`${LOG_PREFIX} ${mapped.name} — ${mapped.message}`);
      throw mapped;
    },
  );

  return instance;
}

/**
 * Create a Harjoot HTTP client bound to the given configuration.
 *
 * @param {typeof defaultConfig} [config]
 * @returns {{
 *   getPartnerInfo(): Promise<object>,
 *   activateAccess(role: string, user: object, profile: object): Promise<object>,
 *   checkAccess(walletAddress: string, role: string): Promise<object>,
 *   uploadCertificate(payload: object): Promise<object>,
 *   notifyPayment(verificationIds: string[], usdtTxHash: string): Promise<object>,
 * }}
 */
function createHttpClient(config = defaultConfig) {
  const http = buildAxiosInstance(config);

  return Object.freeze({
    /**
     * DS Section 0 — partner health check.
     * GET /partners/me
     */
    async getPartnerInfo() {
      const response = await http.get("/partners/me");
      return response.data;
    },

    /**
     * DS Section 2 — register the user in Harjoot and create a membership.
     * POST /access/activate
     *
     * @param {"student"|"issuer"|"recruiter"} role  HackChain role.
     * @param {object} user     Full HackChain User row (sanitized internally).
     * @param {object} profile  Role-specific profile fields.
     */
    async activateAccess(role, user, profile) {
      const segment = toSegment(role);
      const body = {
        segment,
        external_user_id: String(user.id),
        user: pickUserPayload(user),
      };
      if (role === "student") body.student = profile;
      else if (role === "issuer") body.issuer = profile;
      else body.recruiter = profile;

      const response = await http.post("/access/activate", body);
      return response.data;
    },

    /**
     * DS Section 3 — confirm the user still has an active membership.
     * GET /access/status?wallet_address=...&segment=...
     */
    async checkAccess(walletAddress, role) {
      const segment = toSegment(role);
      const response = await http.get("/access/status", {
        params: { wallet_address: walletAddress, segment },
      });
      return response.data;
    },

    /**
     * DS Section 4 — store the certificate proof in Harjoot.
     * POST /certificates/upload
     *
     * Callers are responsible for assembling the full payload according to the
     * spec: idempotency_key, processing.mode, issuer, student, certificate,
     * document. See documents/client-integration-guide.pdf §4.
     */
    async uploadCertificate(payload) {
      const response = await http.post("/certificates/upload", payload);
      return response.data;
    },

    /**
     * DS Section 13 — notify Harjoot of a settled USDT payment.
     *
     * The exact endpoint and payload are still TBD with Harjoot's team
     * (DS TODO 6). This method throws a typed not-implemented error until the
     * contract is defined; the worker logs it and marks the transfer as
     * sent_but_not_notified for ops to reconcile.
     */
    async notifyPayment(_verificationIds, _usdtTxHash) {
      throw new HarjootError(
        "Harjoot payment notification endpoint is not yet defined (DS TODO 6)",
        { status: 501, code: "HARJOOT_PAYMENT_NOTIFY_NOT_CONFIGURED" },
      );
    },
  });
}

module.exports = { createHttpClient, ROLE_TO_SEGMENT };
