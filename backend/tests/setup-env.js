// backend/tests/setup-env.js
//
// Jest setupFiles entry — runs ONCE before any test file is loaded.
//
// Several modules in this codebase validate their configuration at module
// load (middleware/auth.js — JWT_SECRET/REFRESH_SECRET; harjoot/config.js —
// HARJOOT_API_BASE_URL/HARJOOT_PARTNER_API_KEY). When jest does the initial
// `require` of those modules, missing env vars throw and the suite never
// starts. We seed harmless dummy values here.
//
// The `||=` operator only writes when the variable is unset, so a real
// environment (CI override, .env, a developer's terminal) always wins.

process.env.JWT_SECRET              ||= "test_jwt_secret";
process.env.REFRESH_SECRET          ||= "test_refresh_secret";
process.env.HARJOOT_API_BASE_URL    ||= "https://test.harjoot.local";
process.env.HARJOOT_PARTNER_API_KEY ||= "test-partner-key";
