/**
 * profile.js
 */

let PROFILE_USER = null;

function renderProfileHeader(user) {
  document.getElementById("profile-name").textContent = user.name || user.organizationName || "Unnamed";
  document.getElementById("profile-role-org").textContent = [user.role, user.organization || user.companyName || user.institution]
    .filter(Boolean)
    .join(" · ");

  const avatar = document.getElementById("profile-avatar");
  if (user.avatarUrl) {
    avatar.innerHTML = `<img src="${user.avatarUrl}" alt="${escapeHtml(user.name || "")}" />`;
  } else {
    avatar.textContent = (user.name || "?").slice(0, 1).toUpperCase();
  }

  const interests = user.interests || user.areasOfInterest || [];
  document.getElementById("profile-interests").innerHTML = interests
    .map((i) => `<span class="badge badge--neutral">${escapeHtml(i)}</span>`)
    .join("");

  document.getElementById("profile-location").textContent = user.location || "Not specified.";
}

function renderSkills(user) {
  const container = document.getElementById("skills-list");
  const skills = user.skills || [];
  const verifiedSet = new Set((user.verifiedSkills || []).map((s) => s.toLowerCase()));

  if (skills.length === 0) {
    renderEmpty(container, "No skills listed yet.");
    return;
  }

  container.innerHTML = skills
    .map((skill) => {
      const isVerified = verifiedSet.has(String(skill).toLowerCase());
      return `<span class="skill-chip">${escapeHtml(skill)} ${
        isVerified
          ? '<span class="badge badge--verified">✓ Verified</span>'
          : '<span class="badge badge--pending">Pending Verification</span>'
      }</span>`;
    })
    .join("");
}

async function loadCertifications() {
  const container = document.getElementById("certifications-list");
  renderLoading(container, "Loading certifications...");
  try {
    const data = await getCertifications(PROFILE_USER.id || PROFILE_USER._id);
    const certs = data.certifications || data || [];
    if (certs.length === 0) {
      renderEmpty(container, "No certifications uploaded yet.");
      return;
    }
    container.innerHTML = certs
      .map((c) => {
        const statusClass =
          c.status === "verified" ? "badge--verified" : c.status === "rejected" ? "badge--rejected" : "badge--pending";
        return `
        <div class="certificate-row">
          <div>
            <div class="mini-title">${escapeHtml(c.certificateName || c.name)}</div>
            <div class="member-role">${escapeHtml(c.skill)} · ${escapeHtml(c.issuingOrganization || "")} · ${formatDate(c.date || c.createdAt)}</div>
          </div>
          <span class="badge ${statusClass}">${escapeHtml(c.status || "Pending")}</span>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    renderError(container, error.message, loadCertifications);
  }
}

async function loadProjects() {
  const container = document.getElementById("projects-list");
  renderLoading(container, "Loading solutions...");
  try {
    const data = await getMySolutions();
    const solutions = data.solutions || data || [];
    if (solutions.length === 0) {
      renderEmpty(container, "No projects or solutions yet.");
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
    renderError(container, error.message, loadProjects);
  }
}

async function loadTeams() {
  const container = document.getElementById("teams-list");
  renderLoading(container, "Loading teams...");
  try {
    const data = await getMyTeams();
    const teams = data.teams || data || [];
    if (teams.length === 0) {
      renderEmpty(container, "You're not part of any team yet.");
      return;
    }
    container.innerHTML = `
      <div class="mini-list">
        ${teams
          .map(
            (t) => `
          <a href="team.html?teamId=${t.id || t._id}" class="mini-row">
            <div>
              <div class="mini-title">${escapeHtml(t.name)}</div>
              <div class="mini-meta">${escapeHtml(t.problemTitle || "")}</div>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    renderError(container, error.message, loadTeams);
  }
}

function renderAchievements(user) {
  const container = document.getElementById("achievements-list");
  const achievements = user.achievements || [];
  if (achievements.length === 0) {
    renderEmpty(container, "No achievements yet.");
    return;
  }
  container.innerHTML = `
    <div class="mini-list">
      ${achievements
        .map(
          (a) => `
        <div class="mini-row">
          <div>
            <div class="mini-title">${escapeHtml(a.title)}</div>
            <div class="mini-meta">${escapeHtml(a.description || "")}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function setupTabs() {
  const tabs = document.querySelectorAll(".profile-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("profile-tab--active"));
      tab.classList.add("profile-tab--active");
      document.querySelectorAll(".profile-tab-panel").forEach((panel) => {
        panel.hidden = panel.id !== `panel-${tab.dataset.tab}`;
      });

      if (tab.dataset.tab === "certifications") loadCertifications();
      if (tab.dataset.tab === "projects") loadProjects();
      if (tab.dataset.tab === "teams") loadTeams();
      if (tab.dataset.tab === "achievements") renderAchievements(PROFILE_USER);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  setupTabs();

  try {
    const user = await loadCurrentUser();
    if (!user) throw new Error("Unable to load your profile.");
    PROFILE_USER = user;

    document.getElementById("profile-loading").hidden = true;
    document.getElementById("profile-content").hidden = false;

    renderProfileHeader(user);
    renderSkills(user);
  } catch (error) {
    document.getElementById("profile-loading").hidden = true;
    const errorContainer = document.getElementById("profile-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, () => window.location.reload());
    return;
  }

  document.getElementById("edit-profile-btn").addEventListener("click", () => {
    alert("Profile editing form goes here — wire this up to PUT /api/users/:id when ready.");
  });

  const certToggle = document.getElementById("add-cert-toggle");
  const certForm = document.getElementById("add-cert-form");
  certToggle.addEventListener("click", () => { certForm.hidden = !certForm.hidden; });
  document.getElementById("add-cert-cancel").addEventListener("click", () => { certForm.hidden = true; });

  certForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("certificateName", document.getElementById("cert-name").value.trim());
    formData.append("skill", document.getElementById("cert-skill").value.trim());
    formData.append("issuingOrganization", document.getElementById("cert-org").value.trim());
    const fileInput = document.getElementById("cert-file");
    if (fileInput.files[0]) formData.append("certificateFile", fileInput.files[0]);

    try {
      await uploadCertification(PROFILE_USER.id || PROFILE_USER._id, formData);
      certForm.hidden = true;
      certForm.reset();
      loadCertifications();
    } catch (error) {
      alert(error.message || "Unable to upload this certificate right now.");
    }
  });
});