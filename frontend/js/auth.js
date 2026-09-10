/**
 * auth.js
 * -----------------------------------------------------------------------
 * Shared session helpers used across every page:
 *   - reading/writing the auth token
 *   - fetching + caching the current user
 *   - rendering the role-based navigation
 *   - logout
 *
 * IMPORTANT: hiding nav links here is a UX convenience only. The backend
 * is the sole authority on what a role is allowed to do; every protected
 * endpoint must re-check permissions server-side.
 * -----------------------------------------------------------------------
 */

const AUTH_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "p2i_user_cache";

function getToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

function setToken(token) {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
}

function isLoggedIn() {
  return Boolean(getToken());
}

function cacheUser(user) {
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function getCachedUser() {
  const raw = sessionStorage.getItem(USER_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  window.location.href = "login.html";
}

/**
 * Redirects to login.html if there is no token. Call at the top of any
 * page that requires authentication.
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return false;
  }
  return true;
}

/**
 * Fetches the current user (from cache if available this session,
 * otherwise from the API) and resolves with it, or null if the
 * request fails (e.g. expired token).
 */
async function loadCurrentUser() {
  const cached = getCachedUser();
  if (cached) return cached;

  try {
    const response = await getCurrentUser();
    const user = response.data?.user || response.data || response.user || response;
    cacheUser(user);
    return user;
  } catch (error) {
    if (error.status === 401) {
      logout();
    }
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Role-based navigation                                              */
/* ------------------------------------------------------------------ */

const NAV_LINKS_BY_ROLE = {
  citizen: [
    { label: "Dashboard", href: "dashboard.html" },
    { label: "Explore Problems", href: "problems.html" },
    { label: "Post a Problem", href: "post-problem.html" },
    { label: "Profile", href: "profile.html" }
  ],
  student: [
    { label: "Dashboard", href: "dashboard.html" },
    { label: "Explore Problems", href: "problems.html" },
    { label: "Post a Problem", href: "post-problem.html" },
    { label: "My Solutions", href: "solutions.html" },
    { label: "My Teams", href: "team.html" },
    { label: "Profile", href: "profile.html" }
  ],
  researcher: [
    { label: "Dashboard", href: "dashboard.html" },
    { label: "Explore Problems", href: "problems.html" },
    { label: "My Solutions", href: "solutions.html" },
    { label: "Teams", href: "team.html" },
    { label: "Profile", href: "profile.html" }
  ],
  university: [
    { label: "Dashboard", href: "dashboard.html" },
    { label: "Explore Problems", href: "problems.html" },
    { label: "Teams", href: "team.html" },
    { label: "Profile", href: "profile.html" }
  ],
  industry: [
    { label: "Dashboard", href: "dashboard.html" },
    { label: "Explore Problems", href: "problems.html" },
    { label: "Solutions", href: "solutions.html" },
    { label: "Teams", href: "team.html" },
    { label: "Evaluation", href: "evaluation.html" },
    { label: "Profile", href: "profile.html" }
  ],
  evaluator: [
    { label: "Dashboard", href: "dashboard.html" },
    { label: "Problems", href: "problems.html" },
    { label: "Solutions", href: "solutions.html" },
    { label: "Evaluation", href: "evaluation.html" },
    { label: "Implementation", href: "implementation.html" },
    { label: "Profile", href: "profile.html" }
  ]
};

const LOGGED_OUT_LINKS = [
  { label: "Explore Problems", href: "problems.html" },
  { label: "How It Works", href: "index.html#how-it-works" },
  { label: "Login", href: "login.html" },
  { label: "Register", href: "register.html" }
];

/**
 * Renders the shared header/nav into any element with id="site-header".
 * Pages include a single empty <header id="site-header"></header> and
 * call renderNav() on load.
 */
async function renderNav() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  const loggedIn = isLoggedIn();
  let user = null;
  if (loggedIn) {
    user = await loadCurrentUser();
  }

  const role = user && user.role ? user.role.toLowerCase() : null;
  const links = loggedIn
    ? (NAV_LINKS_BY_ROLE[role] || NAV_LINKS_BY_ROLE.citizen)
    : LOGGED_OUT_LINKS;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const linksHtml = links
    .map((link) => {
      const isActive = link.href.startsWith(currentPage) && currentPage !== "";
      return `<a href="${link.href}" class="nav-link${isActive ? " nav-link--active" : ""}">${link.label}</a>`;
    })
    .join("");

  const rightHtml = loggedIn
    ? `
      <a href="notifications.html" class="nav-icon-link" aria-label="Notifications">
        <span class="nav-icon" aria-hidden="true">&#128276;</span>
      </a>
      <a href="profile.html" class="nav-icon-link" aria-label="Profile">
        <span class="nav-icon" aria-hidden="true">&#128100;</span>
      </a>
      <button type="button" class="btn btn--ghost btn--small" id="logout-btn">Log out</button>
    `
    : `
      <a href="login.html" class="btn btn--ghost btn--small">Login</a>
      <a href="register.html" class="btn btn--primary btn--small">Register</a>
    `;

  mount.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="brand">
        <span class="brand-mark" aria-hidden="true">P2I</span>
        <span class="brand-name">Problem2Impact</span>
      </a>
      <nav class="main-nav" aria-label="Primary">
        ${linksHtml}
      </nav>
      <div class="nav-actions">
        ${rightHtml}
      </div>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  const toggle = document.getElementById("nav-toggle");
  const inner = mount.querySelector(".nav-inner");
  if (toggle && inner) {
    toggle.addEventListener("click", () => {
      const isOpen = inner.classList.toggle("nav-inner--open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}

document.addEventListener("DOMContentLoaded", renderNav);