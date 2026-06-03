// backend/harjoot/client/errors.js
//
// Typed error hierarchy for the Harjoot client.
//
// Each error carries a `status` property that the global error handler in
// backend/index.js maps directly to the HTTP response status — routes do not
// have to translate codes manually.
//
// The `status` reflects what HackChain returns to ITS clients, NOT what
// Harjoot returned to us. For example, Harjoot rejecting our API key (401)
// becomes a 500 here because it is a configuration problem on our side, not
// an auth problem of the end user.

class HarjootError extends Error {
  /**
   * @param {string} message
   * @param {object} [options]
   * @param {number} [options.status=502]      HTTP status to return to our clients.
   * @param {string} [options.code]            Stable error code (e.g. HARJOOT_AUTH).
   * @param {number} [options.upstreamStatus]  HTTP status received from Harjoot, if any.
   * @param {unknown} [options.upstreamBody]   Response body from Harjoot, if any.
   * @param {Error}  [options.cause]           Original error (network, axios).
   */
  constructor(message, { status = 502, code = "HARJOOT_ERROR", upstreamStatus, upstreamBody, cause } = {}) {
    super(message);
    this.name = "HarjootError";
    this.status = status;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
    this.upstreamBody = upstreamBody;
    if (cause !== undefined) this.cause = cause;
  }
}

// Harjoot rejected our API key. This is OUR config problem, not the end user's.
class HarjootAuthError extends HarjootError {
  constructor(opts = {}) {
    super("Harjoot API key was rejected", { status: 500, code: "HARJOOT_AUTH", ...opts });
    this.name = "HarjootAuthError";
  }
}

// Harjoot rate-limited us. Treat as temporary upstream unavailability.
class HarjootRateLimitError extends HarjootError {
  constructor(opts = {}) {
    super("Harjoot rate limit exceeded", { status: 503, code: "HARJOOT_RATE_LIMITED", ...opts });
    this.name = "HarjootRateLimitError";
  }
}

// We sent a payload Harjoot considers invalid. For end users this is an
// upstream issue (we generated the request); routes can override with 400 if
// the user provided bad input that propagated.
class HarjootValidationError extends HarjootError {
  constructor(message = "Harjoot rejected the request payload", opts = {}) {
    super(message, { status: 502, code: "HARJOOT_VALIDATION", ...opts });
    this.name = "HarjootValidationError";
  }
}

// Harjoot says the resource does not exist. Routes typically re-throw or
// translate this to a 404 in their own response.
class HarjootNotFoundError extends HarjootError {
  constructor(message = "Resource not found in Harjoot", opts = {}) {
    super(message, { status: 502, code: "HARJOOT_NOT_FOUND", ...opts });
    this.name = "HarjootNotFoundError";
  }
}

// Harjoot returned a 5xx. Retried in the http client; surfaces here only when
// retries are exhausted.
class HarjootServerError extends HarjootError {
  constructor(opts = {}) {
    super("Harjoot server error", { status: 502, code: "HARJOOT_SERVER_ERROR", ...opts });
    this.name = "HarjootServerError";
  }
}

// Network error, DNS failure, timeout. No HTTP response received.
class HarjootUnavailableError extends HarjootError {
  constructor(opts = {}) {
    super("Harjoot is unreachable", { status: 503, code: "HARJOOT_UNAVAILABLE", ...opts });
    this.name = "HarjootUnavailableError";
  }
}

/**
 * Map an axios error to the appropriate typed HarjootError subclass.
 * Used by the http client response interceptor.
 *
 * @param {import("axios").AxiosError} axiosError
 * @returns {HarjootError}
 */
function mapAxiosErrorToHarjootError(axiosError) {
  // No HTTP response at all — network or timeout.
  if (!axiosError.response) {
    return new HarjootUnavailableError({ cause: axiosError });
  }

  const upstreamStatus = axiosError.response.status;
  const upstreamBody = axiosError.response.data;
  const opts = { upstreamStatus, upstreamBody, cause: axiosError };

  if (upstreamStatus === 401 || upstreamStatus === 403) {
    return new HarjootAuthError(opts);
  }
  if (upstreamStatus === 404) {
    return new HarjootNotFoundError(undefined, opts);
  }
  if (upstreamStatus === 429) {
    return new HarjootRateLimitError(opts);
  }
  if (upstreamStatus === 400 || upstreamStatus === 422) {
    return new HarjootValidationError(undefined, opts);
  }
  if (upstreamStatus >= 500) {
    return new HarjootServerError(opts);
  }

  // Anything else (304, 3xx, ...) — bubble up as base error with the upstream code.
  return new HarjootError(`Unexpected Harjoot response (status ${upstreamStatus})`, opts);
}

module.exports = {
  HarjootError,
  HarjootAuthError,
  HarjootRateLimitError,
  HarjootValidationError,
  HarjootNotFoundError,
  HarjootServerError,
  HarjootUnavailableError,
  mapAxiosErrorToHarjootError,
};
