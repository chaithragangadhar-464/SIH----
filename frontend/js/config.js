/**
 * config.js
 * -----------------------------------------------------------------------
 * Single source of truth for backend configuration.
 * Prefer a runtime override via window.P2I_BACKEND_URL when deployed,
 * otherwise fall back to the local dev backend URL or the current origin.
 * -----------------------------------------------------------------------
 */

function resolveBackendBaseUrl() {
  if (typeof window !== "undefined") {
    const configured = window.P2I_BACKEND_URL || window.__APP_CONFIG__?.API_BASE_URL;
    if (configured) {
      return String(configured).replace(/\/+$/, "");
    }

    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocalHost) {
      return "http://localhost:5000/api";
    }

    return `${window.location.origin}/api`;
  }

  return "http://localhost:5000/api";
}

const API_CONFIG = {
  BASE_URL: resolveBackendBaseUrl(),
  FILES_BASE_URL: resolveBackendBaseUrl().replace(/\/api$/, ""),
  REQUEST_TIMEOUT_MS: 15000
};

Object.freeze(API_CONFIG);
