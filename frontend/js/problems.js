/**
 * problems.js — Explore Problems listing page.
 * Filtering is delegated to the backend via query params; nothing here
 * hardcodes a problem list.
 */

let currentPage = 1;
const PAGE_SIZE = 12;

function buildQueryFromFilters() {
  const statusMap = {
    open: "open",
    in_progress: "under-development",
    solved: "completed"
  };

  const query = {
    search: document.getElementById("filter-search").value.trim(),
    sector: document.getElementById("filter-sector").value,
    status: statusMap[document.getElementById("filter-status").value] || document.getElementById("filter-status").value,
    priority: document.getElementById("filter-priority").value,
    location: document.getElementById("filter-location").value.trim(),
    skills: document.getElementById("filter-skills").value.trim(),
    page: currentPage,
    limit: PAGE_SIZE
  };

  // Preserve a matchSkills flag if arriving from a dashboard shortcut.
  if (getQueryParam("matchSkills") === "true") {
    query.matchSkills = true;
  }

  return query;
}

function renderProblemCard(problem) {
  const id = problem.id || problem._id;
  const userHasVoted = Boolean(problem.hasVoted);
  const voteCount = problem.voteCount ?? problem.votes ?? null;
  const priority = problem.priorityLevel || problem.priority;

  return `
    <article class="card problem-card" data-problem-id="${id}">
      <div class="card-top">
        <h3><a href="problem-details.html?id=${id}">${escapeHtml(problem.title)}</a></h3>
        ${priority ? `<span class="badge ${priorityBadgeClass(priority)}">${escapeHtml(priority)}</span>` : ""}
      </div>
      <p class="card-desc">${escapeHtml((problem.description || "").slice(0, 160))}${(problem.description || "").length > 160 ? "…" : ""}</p>
      <div class="card-meta">
        ${problem.sector ? `<span>${escapeHtml(problem.sector)}</span>` : ""}
        ${problem.location ? `<span>· ${escapeHtml(problem.location)}</span>` : ""}
        ${problem.status ? `<span>· ${escapeHtml(problem.status)}</span>` : ""}
      </div>
      <div class="card-footer">
        <button type="button" class="vote-btn${userHasVoted ? " vote-btn--active" : ""}" data-problem-id="${id}" data-voted="${userHasVoted}">
          <span aria-hidden="true">▲</span> ${voteCount === null ? "Vote" : voteCount}
        </button>
        <a href="problem-details.html?id=${id}#comments">${problem.commentCount != null ? `${problem.commentCount} comments` : "View comments"}</a>
        <a href="problem-details.html?id=${id}" class="btn btn--outline btn--small">View Problem</a>
      </div>
    </article>
  `;
}

async function toggleVote(button) {
  const problemId = button.dataset.problemId;
  const hasVoted = button.dataset.voted === "true";
  button.disabled = true;
  try {
    if (hasVoted) {
      await removeVote(problemId);
    } else {
      await voteProblem(problemId);
    }
    loadProblems();
  } catch (error) {
    alert(error.message || "Unable to register your vote right now.");
  } finally {
    button.disabled = false;
  }
}

async function loadProblems() {
  const listContainer = document.getElementById("problems-list");
  const summary = document.getElementById("results-summary");
  renderSkeletonCards(listContainer, 6);
  summary.textContent = "";

  try {
    const query = buildQueryFromFilters();
    const data = await getProblems(query);
    const problems = data.problems || data || [];
    const total = data.total ?? problems.length;

    if (problems.length === 0) {
      renderEmpty(listContainer, "No problems found.", `<a href="post-problem.html" class="btn btn--primary btn--small">Post the first one</a>`);
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    summary.textContent = total != null ? `Showing ${problems.length} of ${total} problems` : `Showing ${problems.length} problems`;

    listContainer.innerHTML = `<div class="card-grid">${problems.map(renderProblemCard).join("")}</div>`;

    listContainer.querySelectorAll(".vote-btn").forEach((btn) => {
      btn.addEventListener("click", () => toggleVote(btn));
    });

    renderPagination(data.totalPages);
  } catch (error) {
    renderError(listContainer, error.message, loadProblems);
    document.getElementById("pagination").innerHTML = "";
  }
}

function renderPagination(totalPages) {
  const container = document.getElementById("pagination");
  if (!totalPages || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= totalPages; i += 1) {
    html += `<button type="button" class="btn btn--small ${i === currentPage ? "btn--primary" : "btn--outline"}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      loadProblems();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Pre-fill filters from URL (e.g. dashboard "matching skills" shortcut, or sector links).
  const params = new URLSearchParams(window.location.search);
  if (params.get("sector")) document.getElementById("filter-sector").value = params.get("sector");
  if (params.get("status")) document.getElementById("filter-status").value = params.get("status");

  document.getElementById("filters-form").addEventListener("submit", (event) => {
    event.preventDefault();
    currentPage = 1;
    loadProblems();
  });

  loadProblems();
});