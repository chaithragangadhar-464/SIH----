/**
 * team.js
 */

let CURRENT_TEAM = null;

function renderMembers(members) {
  const container = document.getElementById("member-list");
  if (!members || members.length === 0) {
    renderEmpty(container, "No members yet.");
    return;
  }
  container.innerHTML = members
    .map(
      (m) => `
    <div class="member-row" data-member-id="${m.id || m._id}">
      <div class="member-identity">
        <div class="member-avatar">${escapeHtml((m.name || "?").slice(0, 1).toUpperCase())}</div>
        <div>
          <div class="mini-title">${escapeHtml(m.name)} ${m.isLeader ? "<span class=\"badge badge--neutral\">Leader</span>" : ""}</div>
          <div class="member-role">${escapeHtml(m.role || "")}</div>
          <div class="member-skills">
            ${(m.skills || []).map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`).join("")}
          </div>
        </div>
      </div>
      ${m.isLeader ? "" : `<button type="button" class="btn btn--ghost btn--small remove-member-btn" data-member-id="${m.id || m._id}">Remove</button>`}
    </div>
  `
    )
    .join("");

  container.querySelectorAll(".remove-member-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this member from the team?")) return;
      try {
        await removeMember(CURRENT_TEAM.id || CURRENT_TEAM._id, btn.dataset.memberId);
        loadTeam(CURRENT_TEAM.id || CURRENT_TEAM._id);
      } catch (error) {
        alert(error.message || "Unable to remove this member right now.");
      }
    });
  });
}

function renderInvitations(invitations) {
  const section = document.getElementById("invitations-section");
  const container = document.getElementById("invitations-list");
  if (!invitations || invitations.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  container.innerHTML = invitations
    .map(
      (inv) => `
    <div class="member-row">
      <div>
        <div class="mini-title">${escapeHtml(inv.name || inv.email)}</div>
        <div class="member-role">Invited ${formatDate(inv.invitedAt)}</div>
      </div>
      <div style="display:flex; gap:8px;">
        ${
          inv.canRespond
            ? `
          <button type="button" class="btn btn--primary btn--small accept-invite" data-id="${inv.id}">Accept</button>
          <button type="button" class="btn btn--ghost btn--small reject-invite" data-id="${inv.id}">Reject</button>
        `
            : `<span class="badge badge--pending">Pending</span>`
        }
      </div>
    </div>
  `
    )
    .join("");

  container.querySelectorAll(".accept-invite").forEach((btn) =>
    btn.addEventListener("click", () => respondInvite(btn.dataset.id, "accept"))
  );
  container.querySelectorAll(".reject-invite").forEach((btn) =>
    btn.addEventListener("click", () => respondInvite(btn.dataset.id, "reject"))
  );
}

async function respondInvite(invitationId, decision) {
  try {
    await respondToInvite(CURRENT_TEAM.id || CURRENT_TEAM._id, { invitationId, decision });
    loadTeam(CURRENT_TEAM.id || CURRENT_TEAM._id);
  } catch (error) {
    alert(error.message || "Unable to update this invitation right now.");
  }
}

async function loadCollaborators(problemId) {
  const container = document.getElementById("collaborators-list");
  if (!problemId) {
    renderEmpty(container, "No matching collaborators found yet.");
    return;
  }
  renderLoading(container, "Finding collaborators...");
  try {
    const data = await getRecommendedCollaborators(problemId);
    const collaborators = data.collaborators || data || [];
    if (collaborators.length === 0) {
      renderEmpty(container, "No matching collaborators found yet.");
      return;
    }
    container.innerHTML = collaborators
      .map(
        (c) => `
      <div class="collaborator-card">
        <div>
          <div class="mini-title">${escapeHtml(c.name || c.role)}</div>
          <div class="member-role">${escapeHtml(c.roleType || c.role || "")}</div>
          <div class="member-skills">${(c.skills || []).map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`).join("")}</div>
        </div>
        <button type="button" class="btn btn--outline btn--small invite-collaborator" data-user-id="${c.id || c._id}">Invite</button>
      </div>
    `
      )
      .join("");

    container.querySelectorAll(".invite-collaborator").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await inviteMember(CURRENT_TEAM.id || CURRENT_TEAM._id, { userId: btn.dataset.userId });
          btn.textContent = "Invited";
        } catch (error) {
          alert(error.message || "Unable to send this invite right now.");
          btn.disabled = false;
        }
      });
    });
  } catch (error) {
    renderError(container, error.message, () => loadCollaborators(problemId));
  }
}

async function loadTeam(teamId) {
  document.getElementById("team-loading").hidden = false;
  document.getElementById("team-content").hidden = true;
  document.getElementById("team-empty").hidden = true;
  document.getElementById("team-error").hidden = true;

  try {
    const data = await getTeamById(teamId);
    const team = data.team || data;
    CURRENT_TEAM = team;

    document.getElementById("team-loading").hidden = true;
    document.getElementById("team-content").hidden = false;

    document.getElementById("team-name-heading").textContent = team.name || "Team";
    document.getElementById("team-problem-link").innerHTML = team.problemId
      ? `Working on <a href="problem-details.html?id=${team.problemId}">${escapeHtml(team.problemTitle || "this problem")}</a>`
      : "";

    renderMembers(team.members);
    renderInvitations(team.invitations);
    loadCollaborators(team.problemId);
  } catch (error) {
    document.getElementById("team-loading").hidden = true;
    const errorContainer = document.getElementById("team-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, () => loadTeam(teamId));
  }
}

async function loadMyTeamsAndPickOne() {
  document.getElementById("team-loading").hidden = false;
  try {
    const data = await getMyTeams();
    const teams = data.teams || data || [];
    if (teams.length === 0) {
      document.getElementById("team-loading").hidden = true;
      const emptyContainer = document.getElementById("team-empty");
      emptyContainer.hidden = false;
      renderEmpty(
        emptyContainer,
        "You're not part of any team yet.",
        `<a href="problems.html" class="btn btn--primary btn--small">Find a problem to form a team around</a>`
      );
      return;
    }
    loadTeam(teams[0].id || teams[0]._id);
  } catch (error) {
    document.getElementById("team-loading").hidden = true;
    const errorContainer = document.getElementById("team-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, loadMyTeamsAndPickOne);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  const teamId = getQueryParam("teamId");
  if (teamId) {
    loadTeam(teamId);
  } else {
    loadMyTeamsAndPickOne();
  }

  document.getElementById("invite-toggle").addEventListener("click", () => {
    document.getElementById("invite-panel").hidden = !document.getElementById("invite-panel").hidden;
  });
  document.getElementById("invite-cancel").addEventListener("click", () => {
    document.getElementById("invite-panel").hidden = true;
  });

  document.getElementById("invite-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const identifier = document.getElementById("invite-email").value.trim();
    const role = document.getElementById("invite-role").value.trim();
    if (!identifier || !CURRENT_TEAM) return;
    try {
      await inviteMember(CURRENT_TEAM.id || CURRENT_TEAM._id, { identifier, role });
      document.getElementById("invite-panel").hidden = true;
      document.getElementById("invite-form").reset();
      loadTeam(CURRENT_TEAM.id || CURRENT_TEAM._id);
    } catch (error) {
      alert(error.message || "Unable to send this invite right now.");
    }
  });
});