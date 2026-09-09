/**
 * implementation.js
 *
 * Displays implementation status for a selected solution. Progress is
 * shown exactly as returned by the backend — no percentage or stage is
 * invented when the backend hasn't provided one yet.
 */

const STATUS_LABELS = {
  not_started: "Not Started",
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed"
};

let CURRENT_SOLUTION_ID = null;

function renderImplementation(data) {
  document.getElementById("impl-content").hidden = false;
  document.getElementById("impl-empty").hidden = true;

  document.getElementById("impl-solution-title").textContent = data.solutionTitle || "—";
  document.getElementById("impl-org").textContent = data.implementingOrganization || "Not yet assigned.";
  document.getElementById("impl-start-date").textContent = data.startDate ? formatDate(data.startDate) : "Not yet started.";
  document.getElementById("impl-status").textContent = STATUS_LABELS[data.status] || data.status || "Not Started";
  document.getElementById("impl-people").textContent = data.peopleImpacted || "Not yet reported.";
  document.getElementById("impl-completion").textContent = data.completed ? "Completed" : "In progress";

  const updatesContainer = document.getElementById("impl-updates");
  if (data.updates && data.updates.length > 0) {
    updatesContainer.innerHTML = `
      <div class="timeline">
        ${data.updates
          .map(
            (u) => `
          <div class="timeline-item">
            <div class="timeline-date">${formatDate(u.date || u.createdAt)}</div>
            <p style="margin:4px 0 0;">${escapeHtml(u.note || u.description)}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } else {
    renderEmpty(updatesContainer, "Implementation progress has not been updated yet.");
  }

  const milestonesContainer = document.getElementById("impl-milestones");
  if (data.milestones && data.milestones.length > 0) {
    milestonesContainer.innerHTML = `
      <div class="mini-list">
        ${data.milestones
          .map(
            (m) => `
          <div class="mini-row">
            <div>
              <div class="mini-title">${escapeHtml(m.title)}</div>
              <div class="mini-meta">${escapeHtml(m.status || "")}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } else {
    renderEmpty(milestonesContainer, "No milestones have been defined yet.");
  }

  const evidenceContainer = document.getElementById("impl-evidence");
  if (data.evidence && data.evidence.length > 0) {
    evidenceContainer.innerHTML = `
      <div class="pd-evidence-list">
        ${data.evidence
          .map((e) => `<a class="pd-evidence-item" href="${e.url}" target="_blank" rel="noopener">📎 ${escapeHtml(e.name || "Evidence file")}</a>`)
          .join("")}
      </div>
    `;
  } else {
    renderEmpty(evidenceContainer, "No implementation evidence has been shared yet.");
  }

  if (data.status) {
    document.getElementById("impl-new-status").value = data.status;
  }
}

async function loadImplementation(solutionId) {
  CURRENT_SOLUTION_ID = solutionId;
  document.getElementById("impl-content").hidden = true;
  document.getElementById("impl-empty").hidden = true;
  document.getElementById("impl-error").hidden = true;

  try {
    const data = await getImplementationStatus(solutionId);
    renderImplementation(data.implementation || data);

    const user = await loadCurrentUser();
    if (user && user.isAuthorizedEvaluator) {
      document.getElementById("impl-update-section").hidden = false;
    }
  } catch (error) {
    if (error.status === 404) {
      const emptyContainer = document.getElementById("impl-empty");
      emptyContainer.hidden = false;
      renderEmpty(emptyContainer, "Implementation progress has not been updated yet.");
      return;
    }
    const errorContainer = document.getElementById("impl-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, () => loadImplementation(solutionId));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  const prefillId = getQueryParam("solutionId");
  if (prefillId) {
    document.getElementById("impl-solution-id").value = prefillId;
    loadImplementation(prefillId);
  }

  document.getElementById("load-impl-btn").addEventListener("click", () => {
    const id = document.getElementById("impl-solution-id").value.trim();
    if (!id) return;
    loadImplementation(id);
  });

  document.getElementById("impl-update-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!CURRENT_SOLUTION_ID) return;

    const payload = {
      status: document.getElementById("impl-new-status").value,
      note: document.getElementById("impl-new-note").value.trim()
    };

    try {
      await updateImplementationStatus(CURRENT_SOLUTION_ID, payload);
      document.getElementById("impl-new-note").value = "";
      loadImplementation(CURRENT_SOLUTION_ID);
    } catch (error) {
      alert(error.message || "Unable to post this update right now.");
    }
  });
});