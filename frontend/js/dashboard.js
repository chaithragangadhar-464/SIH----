/**
 * dashboard.js — populates the role-based dashboard.
 * No section here shows counts, percentages, or any invented metric;
 * everything is either a static action or data returned by the API.
 */

const ACTION_TILES_BY_ROLE = {
  citizen: [
    { icon: "📝", title: "Post a Problem", desc: "Report a societal challenge you've witnessed.", href: "post-problem.html", label: "Post a Problem" },
    { icon: "🔍", title: "Explore Problems", desc: "Browse and vote on problems in your community.", href: "problems.html", label: "Explore" }
  ],
  student: [
    { icon: "📝", title: "Post a Problem", desc: "Report a societal challenge you've witnessed.", href: "post-problem.html", label: "Post a Problem" },
    { icon: "🔍", title: "Explore Problems", desc: "Find a challenge worth solving.", href: "problems.html", label: "Explore" },
    { icon: "🎯", title: "Find Problems Matching My Skills", desc: "See problems that fit what you already know.", href: "problems.html?matchSkills=true", label: "Find Matches" },
    { icon: "👥", title: "View My Teams", desc: "Check invitations and team activity.", href: "team.html", label: "My Teams" }
  ],
  researcher: [
    { icon: "🔍", title: "Explore Problems", desc: "Find a challenge that fits your research area.", href: "problems.html", label: "Explore" },
    { icon: "🎯", title: "Find Problems Matching My Skills", desc: "See problems that fit your expertise.", href: "problems.html?matchSkills=true", label: "Find Matches" },
    { icon: "🧪", title: "View My Solutions", desc: "Track solutions you've contributed to.", href: "solutions.html", label: "My Solutions" }
  ],
  university: [
    { icon: "🔍", title: "Explore Problems", desc: "Identify challenges suited to your departments.", href: "problems.html", label: "Explore" },
    { icon: "👥", title: "View Teams", desc: "See teams associated with your institution.", href: "team.html", label: "View Teams" }
  ],
  industry: [
    { icon: "🔍", title: "Explore Problems", desc: "Find challenges your organization can help solve.", href: "problems.html", label: "Explore" },
    { icon: "🧪", title: "View Solutions", desc: "Track solutions your team has submitted.", href: "solutions.html", label: "Solutions" },
    { icon: "👥", title: "View My Teams", desc: "Manage team invitations and members.", href: "team.html", label: "My Teams" }
  ],
  evaluator: [
    { icon: "⚖️", title: "Evaluate Solutions", desc: "Compare and rate submitted solutions.", href: "evaluation.html", label: "Go to Evaluation" },
    { icon: "📊", title: "Track Implementation", desc: "Review progress on selected solutions.", href: "implementation.html", label: "View Implementation" }
  ]
};

function renderActionTiles(role) {
  const tiles = ACTION_TILES_BY_ROLE[role] || ACTION_TILES_BY_ROLE.citizen;
  const container = document.getElementById("action-tiles");
  container.innerHTML = tiles
    .map(
      (tile) => `
      <div class="action-tile">
        <div class="tile-icon" aria-hidden="true">${tile.icon}</div>
        <h3>${tile.title}</h3>
        <p>${tile.desc}</p>
        <a href="${tile.href}" class="btn btn--outline btn--small">${tile.label}</a>
      </div>
    `
    )
    .join("");
}

function renderProblemMiniList(container, problems, emptyText) {
  if (!problems || problems.length === 0) {
    renderEmpty(container, emptyText);
    return;
  }
  container.innerHTML = `
    <div class="mini-list">
      ${problems
        .map(
          (p) => `
        <a href="problem-details.html?id=${p.id || p._id}" class="mini-row">
          <div>
            <div class="mini-title">${escapeHtml(p.title)}</div>
            <div class="mini-meta">${escapeHtml(p.sector || "Uncategorized")} · ${escapeHtml(p.location || "")}</div>
          </div>
          ${p.priority ? `<span class="badge ${priorityBadgeClass(p.priority)}">${escapeHtml(p.priority)}</span>` : ""}
        </a>
      `
        )
        .join("")}
    </div>
  `;
}

async function loadProblemSection(container, fetchFn, emptyText) {
  renderLoading(container, "Loading problems...");
  try {
    const data = await fetchFn();
    const problems = data.problems || data || [];
    renderProblemMiniList(container, problems, emptyText);
  } catch (error) {
    renderError(container, error.message, () => loadProblemSection(container, fetchFn, emptyText));
  }
}

async function loadNotifications() {
  const container = document.getElementById("dashboard-notifications");
  renderLoading(container, "Loading notifications...");
  try {
    const data = await getNotifications();
    const notifications = (data.notifications || data || []).slice(0, 5);
    if (notifications.length === 0) {
      renderEmpty(container, "No notifications yet.");
      return;
    }
    container.innerHTML = `
      <div class="mini-list">
        ${notifications
          .map(
            (n) => `
          <div class="mini-row">
            <div>
              <div class="mini-title">${escapeHtml(n.message)}</div>
              <div class="mini-meta">${formatDate(n.createdAt)}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    renderError(container, error.message, loadNotifications);
  }
}

async function loadActiveSolutions() {
  const container = document.getElementById("active-solutions");
  renderLoading(container, "Loading your solutions...");
  try {
    const data = await getMySolutions();
    const solutions = data.solutions || data || [];
    if (solutions.length === 0) {
      renderEmpty(container, "You haven't submitted any solutions yet.");
      return;
    }
    container.innerHTML = `
      <div class="mini-list">
        ${solutions
          .map(
            (s) => `
          <a href="solution-details.html?id=${s.id || s._id}" class="mini-row">
            <div>
              <div class="mini-title">${escapeHtml(s.title)}</div>
              <div class="mini-meta">${escapeHtml(s.status || "Submitted")}</div>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    renderError(container, error.message, loadActiveSolutions);
  }
}

async function loadTeamInvitations() {
  const container = document.getElementById("team-invitations");
  renderLoading(container, "Loading invitations...");
  try {
    const data = await getTeamInvitations();
    const invitations = data.invitations || data || [];
    if (invitations.length === 0) {
      renderEmpty(container, "You don't have any team invitations.");
      return;
    }
    container.innerHTML = `
      <div class="mini-list">
        ${invitations
          .map(
            (inv) => `
          <a href="team.html?teamId=${inv.teamId}" class="mini-row">
            <div>
              <div class="mini-title">${escapeHtml(inv.teamName)}</div>
              <div class="mini-meta">For: ${escapeHtml(inv.problemTitle || "")}</div>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    renderError(container, error.message, loadTeamInvitations);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  const user = await loadCurrentUser();
  const role = user && user.role ? user.role.toLowerCase() : "citizen";

  document.getElementById("welcome-heading").textContent = user ? `Welcome, ${user.name}` : "Welcome";
  renderActionTiles(role);

  loadProblemSection(
    document.getElementById("recommended-problems"),
    () => getProblems({ recommended: true }),
    "No recommended problems yet."
  );

  loadProblemSection(
    document.getElementById("recent-problems"),
    () => getProblems({ sort: "recent" }),
    "No recent problems yet."
  );

  const skillRoles = ["student", "researcher", "industry"];
  if (skillRoles.includes(role)) {
    document.getElementById("section-matching-skills").hidden = false;
    loadProblemSection(
      document.getElementById("matching-skills-problems"),
      () => getProblems({ matchSkills: true }),
      "No problems currently match your listed skills."
    );
  }

  const solutionRoles = ["student", "researcher", "industry", "university"];
  if (solutionRoles.includes(role)) {
    document.getElementById("section-active-solutions").hidden = false;
    loadActiveSolutions();
  }

  if (solutionRoles.includes(role)) {
    document.getElementById("section-team-invitations").hidden = false;
    loadTeamInvitations();
  }

  loadNotifications();
});