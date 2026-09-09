/**
 * solutions.js — lists the current user's solutions (or, when a
 * problemId query param is present, all solutions for that problem).
 */

function renderSolutionCard(solution) {
  const id = solution.id || solution._id;
  return `
    <article class="card solution-card">
      <div class="card-top">
        <h3><a href="solution-details.html?id=${id}">${escapeHtml(solution.title)}</a></h3>
        <span class="badge badge--neutral">${escapeHtml(solution.status || "Submitted")}</span>
      </div>
      <div class="team-name">${escapeHtml(solution.teamName || "Independent")}</div>
      <p class="card-desc">${escapeHtml((solution.summary || solution.description || "").slice(0, 140))}</p>
      <div class="card-footer">
        ${solution.averageRating != null ? `<span class="rating-inline">${starString(solution.averageRating)} ${solution.averageRating.toFixed ? solution.averageRating.toFixed(1) : solution.averageRating}</span>` : "<span></span>"}
        <a href="solution-details.html?id=${id}" class="btn btn--outline btn--small">View Solution</a>
      </div>
    </article>
  `;
}

async function loadSolutions() {
  const container = document.getElementById("solutions-list");
  renderSkeletonCards(container, 4);

  const problemId = getQueryParam("problemId");

  try {
    let solutions;
    if (problemId) {
      const data = await getSolutions(problemId);
      solutions = data.solutions || data || [];
    } else {
      const data = await getMySolutions();
      solutions = data.solutions || data || [];
    }

    if (solutions.length === 0) {
      renderEmpty(
        container,
        "No solutions have been submitted yet.",
        `<a href="problems.html" class="btn btn--primary btn--small">Find a problem to solve</a>`
      );
      return;
    }

    container.innerHTML = `<div class="card-grid">${solutions.map(renderSolutionCard).join("")}</div>`;
  } catch (error) {
    renderError(container, error.message, loadSolutions);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;
  loadSolutions();

  const panel = document.getElementById("new-solution-panel");
  const toggleBtn = document.getElementById("new-solution-toggle");
  const cancelBtn = document.getElementById("new-solution-cancel");
  const form = document.getElementById("new-solution-form");
  const submitBtn = document.getElementById("new-solution-submit");

  const prefillProblemId = getQueryParam("newFor");
  if (prefillProblemId) {
    document.getElementById("ns-problem-id").value = prefillProblemId;
    panel.hidden = false;
  }

  toggleBtn.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  cancelBtn.addEventListener("click", () => {
    panel.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const problemId = document.getElementById("ns-problem-id").value.trim();
    const title = document.getElementById("ns-title").value.trim();
    const detail = document.getElementById("ns-detail").value.trim();
    const how = document.getElementById("ns-how").value.trim();

    let valid = true;
    [["field-ns-problem-id", problemId], ["field-ns-title", title], ["field-ns-detail", detail], ["field-ns-how", how]].forEach(
      ([fieldId, value]) => {
        const invalid = !value;
        document.getElementById(fieldId).classList.toggle("field--invalid", invalid);
        if (invalid) valid = false;
      }
    );
    if (!valid) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", detail);
    formData.append("howItSolves", how);
    formData.append("technologyUsed", document.getElementById("ns-tech").value.trim());
    formData.append("estimatedCost", document.getElementById("ns-cost").value.trim());
    formData.append("implementationPlan", document.getElementById("ns-plan").value.trim());
    formData.append("expectedImpact", document.getElementById("ns-impact").value.trim());
    formData.append("timeline", document.getElementById("ns-timeline").value.trim());
    formData.append("teamMembers", document.getElementById("ns-team").value.trim());
    formData.append("demoLink", document.getElementById("ns-link").value.trim());
    Array.from(document.getElementById("ns-docs").files).forEach((file) => formData.append("documents", file));

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await submitSolution(problemId, formData);
      const solution = response.solution || response;
      const id = solution.id || solution._id;
      window.location.href = id ? `solution-details.html?id=${id}` : "solutions.html";
    } catch (error) {
      alert(error.message || "Unable to submit the solution right now.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Solution";
    }
  });
});