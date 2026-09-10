/**
 * ui-helpers.js
 * -----------------------------------------------------------------------
 * Small, dependency-free helpers for rendering consistent loading, empty,
 * and error states across every page.
 * -----------------------------------------------------------------------
 */

function renderLoading(container, message = "Loading...") {
  container.innerHTML = `
    <div class="state-message">
      <div class="spinner"></div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function renderSkeletonCards(container, count = 3) {
  container.innerHTML = `
    <div class="card-grid">
      ${Array.from({ length: count }).map(() => '<div class="card skeleton skeleton-card"></div>').join("")}
    </div>
  `;
}

function renderEmpty(container, title, actionHtml = "") {
  container.innerHTML = `
    <div class="state-message">
      <h3>${escapeHtml(title)}</h3>
      ${actionHtml}
    </div>
  `;
}

function renderError(container, message, onRetry) {
  container.innerHTML = `
    <div class="state-message state-message--error">
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button type="button" class="btn btn--outline btn--small" id="retry-btn">Try again</button>
    </div>
  `;
  const retryBtn = container.querySelector("#retry-btn");
  if (retryBtn && typeof onRetry === "function") {
    retryBtn.addEventListener("click", onRetry);
  }
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function priorityBadgeClass(priority) {
  const level = (priority || "").toLowerCase();
  if (level.includes("high")) return "badge--high";
  if (level.includes("medium")) return "badge--medium";
  if (level.includes("low")) return "badge--low";
  return "badge--neutral";
}

function starString(rating, max = 5) {
  const rounded = Math.round(Number(rating) || 0);
  return "★".repeat(Math.max(0, Math.min(max, rounded))) + "☆".repeat(Math.max(0, max - rounded));
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}