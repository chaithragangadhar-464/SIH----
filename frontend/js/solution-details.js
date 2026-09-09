/**
 * solution-details.js
 */

let SOLUTION_ID = null;

function renderSolution(solution) {
  document.getElementById("sd-loading").hidden = true;
  document.getElementById("sd-content").hidden = false;

  document.getElementById("sd-title").textContent = solution.title;

  const problemId = solution.problemId || solution.problem?.id;
  const problemTitle = solution.problemTitle || solution.problem?.title;
  const problemLinkEl = document.getElementById("sd-problem-link");
  if (problemId) {
    problemLinkEl.innerHTML = `In response to <a href="problem-details.html?id=${problemId}">${escapeHtml(problemTitle || "this problem")}</a>`;
  } else {
    problemLinkEl.textContent = "";
  }

  document.getElementById("sd-description").textContent = solution.description || "Not provided.";
  document.getElementById("sd-how").textContent = solution.howItSolves || "Not provided.";

  const techBlock = document.getElementById("sd-tech-block");
  if (solution.technologyUsed) {
    document.getElementById("sd-tech").textContent = solution.technologyUsed;
  } else {
    techBlock.hidden = true;
  }

  const planBlock = document.getElementById("sd-plan-block");
  if (solution.implementationPlan) {
    document.getElementById("sd-plan").textContent = solution.implementationPlan;
  } else {
    planBlock.hidden = true;
  }

  const linksBlock = document.getElementById("sd-links-block");
  const linksContainer = document.getElementById("sd-links");
  const links = [];
  if (solution.demoLink) links.push({ label: "Prototype / Demo", url: solution.demoLink });
  (solution.documents || []).forEach((doc) => links.push({ label: doc.name || "Document", url: doc.url }));
  if (links.length > 0) {
    linksContainer.innerHTML = links
      .map((l) => `<a class="link-chip" href="${l.url}" target="_blank" rel="noopener">🔗 ${escapeHtml(l.label)}</a>`)
      .join("");
  } else {
    linksBlock.hidden = true;
  }

  document.getElementById("sd-status").textContent = solution.status || "Submitted";
  document.getElementById("sd-team").textContent = solution.teamName || "Independent";
  document.getElementById("sd-cost").textContent = solution.estimatedCost || "Not provided";
  document.getElementById("sd-timeline").textContent = solution.timeline || "Not provided";
  document.getElementById("sd-impact").textContent = solution.expectedImpact || "Not provided";

  if (solution.selected) {
    const banner = document.getElementById("selected-banner");
    banner.hidden = false;
    document.getElementById("selected-reason").textContent =
      solution.selectionReason || "This solution was selected by authorized evaluators.";
  }
}

async function loadRatings() {
  const container = document.getElementById("ratings-summary");
  renderLoading(container, "Loading ratings...");
  try {
    const data = await getRatings(SOLUTION_ID);
    const ratings = data.ratings || data || [];
    if (ratings.length === 0) {
      renderEmpty(container, "This solution has not been rated yet.");
      return;
    }
    const avg = data.average != null
      ? data.average
      : ratings.reduce((sum, r) => sum + (r.overall || r.score || 0), 0) / ratings.length;

    container.innerHTML = `
      <div class="rating-summary">
        <span class="stars">${starString(avg)}</span>
        <strong>${Number(avg).toFixed(1)}</strong>
        <span class="mini-meta">(${ratings.length} rating${ratings.length === 1 ? "" : "s"})</span>
      </div>
      ${ratings
        .map(
          (r) => `
        <div class="rating-item">
          <div class="rating-head">
            <span>${escapeHtml(r.evaluatorName || "Evaluator")}</span>
            <span>${formatDate(r.createdAt)}</span>
          </div>
          <div class="stars">${starString(r.overall || r.score)}</div>
          ${r.comments ? `<p style="margin:6px 0 0;">${escapeHtml(r.comments)}</p>` : ""}
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    renderError(container, error.message, loadRatings);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  SOLUTION_ID = getQueryParam("id");
  if (!SOLUTION_ID) {
    document.getElementById("sd-loading").hidden = true;
    const errorContainer = document.getElementById("sd-error");
    errorContainer.hidden = false;
    renderEmpty(errorContainer, "No solution was specified.");
    return;
  }

  try {
    const data = await getSolutionById(SOLUTION_ID);
    renderSolution(data.solution || data);
    loadRatings();
  } catch (error) {
    document.getElementById("sd-loading").hidden = true;
    const errorContainer = document.getElementById("sd-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, () => window.location.reload());
  }

  if (isLoggedIn()) {
    const user = await loadCurrentUser();
    const role = user && user.role ? user.role.toLowerCase() : "";
    if (["evaluator", "government", "ngo", "industry"].includes(role) && user?.isAuthorizedEvaluator) {
      document.getElementById("evaluator-panel").hidden = false;
    }
  }
});