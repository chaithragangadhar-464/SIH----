/**
 * evaluation.js
 *
 * Loads all solutions for a given problem, builds a comparison table
 * from ratings actually returned by the backend (never invented),
 * and lets an authorized evaluator submit a new rating or select the
 * final solution. The backend remains the authority on who is allowed
 * to do either action — this page only adjusts what's shown.
 */

const CRITERIA = [
  { key: "innovation", label: "Innovation" },
  { key: "feasibility", label: "Feasibility" },
  { key: "socialImpact", label: "Social Impact" },
  { key: "scalability", label: "Scalability" },
  { key: "costEffectiveness", label: "Cost Effectiveness" },
  { key: "technicalQuality", label: "Technical Quality" }
];

let LOADED_SOLUTIONS = [];
let SELECTED_RATING_SOLUTION_ID = null;
let CAN_EVALUATE = false;
let ratingValues = {};

function buildComparisonTable(solutionsWithRatings) {
  const table = document.getElementById("comparison-table");
  const header = `<tr><th>Criteria</th>${solutionsWithRatings.map((s) => `<th>${escapeHtml(s.title)}</th>`).join("")}</tr>`;

  const rows = CRITERIA.map((criterion) => {
    const cells = solutionsWithRatings
      .map((s) => {
        const value = s.averagesByCriterion ? s.averagesByCriterion[criterion.key] : null;
        return `<td class="${value != null ? "stars-cell" : ""}">${value != null ? starString(value) : "<span class=\"mini-meta\">Not yet rated</span>"}</td>`;
      })
      .join("");
    return `<tr><td>${criterion.label}</td>${cells}</tr>`;
  }).join("");

  table.innerHTML = header + rows;
  document.getElementById("comparison-section").hidden = false;
}

function averagesByCriterion(ratings) {
  if (!ratings || ratings.length === 0) return null;
  const sums = {};
  const counts = {};
  CRITERIA.forEach((c) => { sums[c.key] = 0; counts[c.key] = 0; });
  ratings.forEach((r) => {
    CRITERIA.forEach((c) => {
      if (r[c.key] != null) {
        sums[c.key] += r[c.key];
        counts[c.key] += 1;
      }
    });
  });
  const result = {};
  CRITERIA.forEach((c) => {
    result[c.key] = counts[c.key] > 0 ? sums[c.key] / counts[c.key] : null;
  });
  return result;
}

function renderSolutionPicker(solutions) {
  const picker = document.getElementById("solution-picker");
  picker.innerHTML = solutions
    .map((s) => `<button type="button" data-id="${s.id || s._id}">${escapeHtml(s.title)}</button>`)
    .join("");

  picker.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      picker.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      SELECTED_RATING_SOLUTION_ID = btn.dataset.id;
      document.getElementById("rating-form").hidden = false;
    });
  });
}

function buildStarInputs() {
  document.querySelectorAll(".star-input").forEach((container) => {
    const criterion = container.dataset.criterion;
    ratingValues[criterion] = 0;
    container.innerHTML = Array.from({ length: 5 })
      .map((_, i) => `<button type="button" data-value="${i + 1}">★</button>`)
      .join("");
    container.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = Number(btn.dataset.value);
        ratingValues[criterion] = value;
        container.querySelectorAll("button").forEach((b) => {
          b.classList.toggle("is-active", Number(b.dataset.value) <= value);
        });
      });
    });
  });
}

async function loadSolutionsForEvaluation(problemId) {
  const comparisonSection = document.getElementById("comparison-section");
  const ratingSection = document.getElementById("rating-section");
  const emptyContainer = document.getElementById("solutions-empty");
  comparisonSection.hidden = true;
  ratingSection.hidden = true;
  emptyContainer.hidden = true;

  try {
    const data = await getSolutions(problemId);
    const solutions = data.solutions || data || [];

    if (solutions.length === 0) {
      emptyContainer.hidden = false;
      renderEmpty(emptyContainer, "No solutions have been submitted for this problem yet.");
      return;
    }

    LOADED_SOLUTIONS = solutions;

    const solutionsWithRatings = await Promise.all(
      solutions.map(async (s) => {
        try {
          const ratingData = await getRatings(s.id || s._id);
          const ratings = ratingData.ratings || ratingData || [];
          return { ...s, averagesByCriterion: averagesByCriterion(ratings) };
        } catch (e) {
          return { ...s, averagesByCriterion: null };
        }
      })
    );

    buildComparisonTable(solutionsWithRatings);

    if (CAN_EVALUATE) {
      ratingSection.hidden = false;
      renderSolutionPicker(solutions);
      document.getElementById("select-final-btn").hidden = false;
    }
  } catch (error) {
    const errorContainer = document.getElementById("evaluation-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, () => loadSolutionsForEvaluation(problemId));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) return;

  const user = await loadCurrentUser();
  CAN_EVALUATE = Boolean(user && user.isAuthorizedEvaluator);

  document.getElementById("evaluation-content").hidden = false;
  buildStarInputs();

  document.getElementById("load-solutions-btn").addEventListener("click", () => {
    const problemId = document.getElementById("eval-problem-id").value.trim();
    if (!problemId) return;
    loadSolutionsForEvaluation(problemId);
  });

  document.getElementById("rating-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!SELECTED_RATING_SOLUTION_ID) return;

    const payload = { ...ratingValues, comments: document.getElementById("rating-comments").value.trim() };

    try {
      await submitRating(SELECTED_RATING_SOLUTION_ID, payload);
      alert("Rating submitted.");
      document.getElementById("rating-form").reset();
      const problemId = document.getElementById("eval-problem-id").value.trim();
      loadSolutionsForEvaluation(problemId);
    } catch (error) {
      alert(error.message || "Unable to submit this rating right now.");
    }
  });

  document.getElementById("select-final-btn").addEventListener("click", async () => {
    if (LOADED_SOLUTIONS.length === 0) return;
    const options = LOADED_SOLUTIONS.map((s, i) => `${i + 1}. ${s.title}`).join("\n");
    const choice = prompt(`Which solution should be selected as final?\n${options}\n\nEnter the number:`);
    const index = Number(choice) - 1;
    if (Number.isNaN(index) || !LOADED_SOLUTIONS[index]) return;

    const solution = LOADED_SOLUTIONS[index];
    const reason = prompt("Why was this solution selected? (shown publicly)") || "";

    try {
      await selectSolution(solution.id || solution._id, { reason });
      alert("Solution selected. It will now appear in the implementation tracker.");
    } catch (error) {
      alert(error.message || "Unable to select this solution right now.");
    }
  });
});