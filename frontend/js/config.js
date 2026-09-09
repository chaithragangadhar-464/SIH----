/**
 * config.js
 * -----------------------------------------------------------------------
 * Single source of truth for backend configuration.
 * Change BASE_URL here (and only here) when the backend is deployed
 * to staging or production. No other file should hardcode a host.
 * -----------------------------------------------------------------------
 */

const API_CONFIG = {
  // TODO: Update this value when the backend is deployed.
  // Local development default assumes an Express server on port 5000.
  BASE_URL: "http://localhost:5000/api",

  // Optional: separate host for uploaded evidence/certificate files,
  // in case the backend serves static files from a different origin.
  FILES_BASE_URL: "http://localhost:5000",

  // Client-side request timeout (ms). Purely a UX safeguard; the backend
  // remains the authority on what is accepted.
  REQUEST_TIMEOUT_MS: 15000
};

// Prevent accidental mutation from other scripts.
Object.freeze(API_CONFIG);
