// backend/middleware/correlationId.js
//
// Express middleware. Accepts an incoming X-Correlation-ID header (from a
// frontend / load balancer / upstream service) when present and well-formed,
// otherwise generates one. Echoes it back on the response so the caller can
// quote it in a bug report, AND runs the rest of the request inside the
// correlation context so any downstream module (use cases, harjoot client,
// etc.) can read it via getCorrelationId().
//
// Mount BEFORE the routes:
//   const correlationId = require("./middleware/correlationId");
//   app.use(correlationId());

const crypto = require("crypto");
const { runWithCorrelationId } = require("../lib/correlationContext");

const HEADER = "x-correlation-id";
const MAX_LEN = 128;
// Allow ASCII alphanumerics + a few punctuation characters; reject control
// chars and anything that could break log parsers or be log-injected.
const VALID_INCOMING = /^[A-Za-z0-9._:-]{1,128}$/;

function generate() {
  // crypto.randomUUID() is RFC 4122 v4. Prefix tags this as a request-origin
  // ID (the worker uses `cron-...`) so a glance at logs tells you which
  // surface produced it.
  return `req-${crypto.randomUUID()}`;
}

/**
 * @param {object} [opts]
 * @param {string} [opts.header]   Override header name (defaults to x-correlation-id).
 * @returns {import("express").RequestHandler}
 */
function correlationIdMiddleware(opts = {}) {
  const headerName = (opts.header || HEADER).toLowerCase();
  return function correlationId(req, res, next) {
    const incoming = req.headers[headerName];
    let correlationId;
    if (typeof incoming === "string" && VALID_INCOMING.test(incoming)) {
      correlationId = incoming;
    } else {
      correlationId = generate();
    }
    // Attach to both req (for explicit access in handlers) and the response
    // header (so the caller can correlate their own logs).
    req.correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
    // Defensive: never let an unbounded incoming value pass through.
    if (correlationId.length > MAX_LEN) correlationId = correlationId.slice(0, MAX_LEN);
    runWithCorrelationId(correlationId, () => next());
  };
}

module.exports = correlationIdMiddleware;
module.exports.__generate = generate;
module.exports.__HEADER = HEADER;
