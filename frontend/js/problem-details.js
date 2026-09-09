/**
 * problem-details.js
 * Loads a single problem by ?id= and wires up voting, comments,
 * the solver flow, and the grouped list of solutions for the problem.
 * AI classification and duplicate-detection panels only render when
 * the backend actually returns that data — nothing is invented here.
 */

let PROBLEM_ID = null;
let CURRENT_PROBLEM = null;

function renderProblem(problem) {
  CURRENT_PROBLEM = problem;
  document.getElementById("problem-loading").hidden = true;
  document.getElementById("problem-content").hidden = false;

  document.getElementById("pd-title").textContent = problem.title;

  const priorityBadge = document.getElementById("pd-priority-badge");
  if (problem.priority) {
    priorityBadge.textContent = `${problem.priority} Priority`;
    priorityBadge.className = `badge ${priorityBadgeClass(problem.priority)}`;
  } else {
    priorityBadge.hidden = true;
  }

  document.getElementById("pd-meta-row").innerHTML = [
    problem.sector,
    problem.subsector,
    problem.location,
    problem.status
  ]
    .filter(Boolean)
    .map((v) => `<span>${escapeHtml(v)}</span>`)
    .join(" · ");

  document.getElementById("pd-description").textContent = problem.description || "";
  document.getElementById("pd-affected").textContent = problem.affectedPopulation || "Not specified.";
  document.getElementById("pd-importance").textContent = problem.importance || "Not specified.";

  document.getElementById("pd-status").textContent = problem.status || "—";
  document.getElementById("pd-sector").textContent = problem.sector || "—";
  document.getElementById("pd-location").textContent = problem.location || "—";
  document.getElementById("pd-posted-by").textContent = problem.postedBy?.name || problem.postedByName || "—";
  document.getElementById("pd-created").textContent = formatDate(problem.createdAt);

  // Evidence
  const evidenceBlock = document.getElementById("pd-evidence-block");
  const evidenceList = document.getElementById("pd-evidence-list");
  if (problem.evidence && problem.evidence.length > 0) {
    evidenceList.innerHTML = problem.evidence
      .map((e) => `<a class="pd-evidence-item" href="${e.url}" target="_blank" rel="noopener">📎 ${escapeHtml(e.name || "Evidence file")}</a>`)
      .join("");
  } else {
    evidenceBlock.hidden = true;
  }

  // AI classification — only render if the backend actually returned it.
  if (problem.aiClassification && problem.aiClassification.sector) {
    const ai = problem.aiClassification;
    document.getElementById("ai-panel").hidden = false;
    document.getElementById("ai-fact-grid").innerHTML = `
      <div><div class="fact-label">Sector</div><div class="fact-value">${escapeHtml(ai.sector)}</div></div>
      ${ai.subsector ? `<div><div class="fact-label">Subsector</div><div class="fact-value">${escapeHtml(ai.subsector)}</div></div>` : ""}
      ${ai.confidence != null ? `<div><div class="fact-label">Confidence</div><div class="fact-value">${escapeHtml(ai.confidence)}%</div></div>` : ""}
    `;
  } else if (problem.aiClassificationUnavailable) {
    document.getElementById("ai-unavailable").hidden = false;
  }

  // Duplicate detection — only render if backend flagged a match.
  if (problem.potentialDuplicate && problem.potentialDuplicate.problemId) {
    const dup = problem.potentialDuplicate;
    const panel = document.getElementById("duplicate-panel");
    panel.hidden = false;
    document.getElementById("duplicate-similarity").textContent =
      dup.similarity != null ? `${dup.similarity}%` : "Not provided";
    document.getElementById("duplicate-view-link").href = `problem-details.html?id=${dup.problemId}`;
    document.getElementById("duplicate-dismiss").addEventListener("click", () => {
      panel.hidden = true;
    });
  }

  renderVoteButton(problem);
  renderSolveButton(problem);
}

function renderVoteButton(problem) {
  const btn = document.getElementById("vote-btn");
  const hasVoted = Boolean(problem.hasVoted);
  const voteCount = problem.voteCount ?? problem.votes;
  btn.textContent = hasVoted
    ? `Voted${voteCount != null ? ` (${voteCount})` : ""} — Remove Vote`
    : `Vote for this Problem${voteCount != null ? ` (${voteCount})` : ""}`;
  btn.classList.toggle("btn--outline", hasVoted);
  btn.classList.toggle("btn--primary", !hasVoted);
  btn.onclick = async () => {
    if (!requireAuth()) return;
    btn.disabled = true;
    try {
      if (hasVoted) {
        await removeVote(PROBLEM_ID);
      } else {
        await voteProblem(PROBLEM_ID);
      }
      loadProblem();
    } catch (error) {
      alert(error.message || "Unable to register your vote right now.");
    } finally {
      btn.disabled = false;
    }
  };
}

function renderSolveButton(problem) {
  const btn = document.getElementById("solve-btn");
  btn.onclick = () => {
    if (!requireAuth()) return;
    document.getElementById("solver-modal").hidden = false;
  };
}

async function loadProblem() {
  document.getElementById("problem-loading").hidden = false;
  document.getElementById("problem-content").hidden = true;
  document.getElementById("problem-error").hidden = true;

  try {
    const data = await getProblemById(PROBLEM_ID);
    renderProblem(data.problem || data);
    loadComments();
    loadSolutionsForProblem();
  } catch (error) {
    document.getElementById("problem-loading").hidden = true;
    const errorContainer = document.getElementById("problem-error");
    errorContainer.hidden = false;
    renderError(errorContainer, error.message, loadProblem);
  }
}

async function loadComments() {
  const container = document.getElementById("comments-list");
  renderLoading(container, "Loading comments...");
  try {
    const data = await getComments(PROBLEM_ID);
    const comments = data.comments || data || [];
    if (comments.length === 0) {
      renderEmpty(container, "No comments yet. Be the first to add context.");
      return;
    }
    container.innerHTML = comments
      .map(
        (c) => `
      <div class="comment-item">
        <div class="comment-head">
          <span class="comment-author">${escapeHtml(c.userName || c.author || "Anonymous")}</span>
          <span>${formatDate(c.createdAt)}</span>
        </div>
        <p style="margin:0;">${escapeHtml(c.text)}</p>
      </div>
    `
      )
      .join("");
  } catch (error) {
    renderError(container, error.message, loadComments);
  }
}

async function loadSolutionsForProblem() {
  const container = document.getElementById("pd-solutions-list");
  renderLoading(container, "Loading solutions...");
  try {
    const data = await getSolutions(PROBLEM_ID);
    const solutions = data.solutions || data || [];
    if (solutions.length === 0) {
      renderEmpty(container, "No solutions have been submitted yet.");
      return;
    }
    container.innerHTML = `
      <div class="solutions-for-problem">
        ${solutions
          .map(
            (s) => `
          <div class="solution-summary-card">
            <div>
              <strong>${escapeHtml(s.title)}</strong>
              <div class="mini-meta">${escapeHtml(s.teamName || "Independent")} · ${escapeHtml(s.status || "Submitted")}</div>
            </div>
            <div style="display:flex; align-items:center; gap:14px;">
              ${s.averageRating != null ? `<span class="stars">${starString(s.averageRating)}</span>` : ""}
              <a href="solution-details.html?id=${s.id || s._id}" class="btn btn--outline btn--small">View Solution</a>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    renderError(container, error.message, loadSolutionsForProblem);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  PROBLEM_ID = getQueryParam("id");
  if (!PROBLEM_ID) {
    document.getElementById("problem-loading").hidden = true;
    const errorContainer = document.getElementById("problem-error");
    errorContainer.hidden = false;
    renderEmpty(errorContainer, "No problem was specified.");
    return;
  }

  loadProblem();

  document.getElementById("comment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireAuth()) return;
    const textarea = document.getElementById("comment-text");
    const text = textarea.value.trim();
    if (!text) return;
    try {
      await addComment(PROBLEM_ID, text);
      textarea.value = "";
      loadComments();
    } catch (error) {
      alert(error.message || "Unable to post your comment right now.");
    }
  });

  document.getElementById("solver-cancel").addEventListener("click", () => {
    document.getElementById("solver-modal").hidden = true;
  });

  document.getElementById("solver-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      why: document.getElementById("solver-why").value.trim(),
      skills: document.getElementById("solver-skills").value.trim(),
      role: document.getElementById("solver-role").value.trim(),
      teamPreference: document.getElementById("solver-team").value
    };
    try {
      await expressSolverInterest(PROBLEM_ID, payload);
      document.getElementById("solver-modal").hidden = true;
      alert("Thanks — your interest has been submitted.");
      document.getElementById("solver-form").reset();
    } catch (error) {
      alert(error.message || "Unable to submit your interest right now.");
    }
  });
});