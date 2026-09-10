/**
 * api.js
 * -----------------------------------------------------------------------
 * Centralized REST API layer. Every network call in the app should go
 * through apiRequest() (or the helper functions below) so that:
 *   - the base URL lives in exactly one place (config.js)
 *   - auth headers are attached consistently
 *   - errors are handled consistently
 *
 * No page-specific JS file should call fetch() directly against the
 * backend. If an endpoint is missing here, add it here first.
 * -----------------------------------------------------------------------
 */

/**
 * Low-level request helper.
 * @param {string} endpoint - path beginning with "/", e.g. "/problems"
 * @param {object} options - fetch options (method, body, headers, signal)
 * @param {boolean} isFormData - true when sending FormData (skip JSON header)
 */
async function apiRequest(endpoint, options = {}, isFormData = false) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (networkError) {
    clearTimeout(timeout);
    if (networkError.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 0);
    }
    throw new ApiError(
      "Unable to connect to the server. Please check your connection and try again.",
      0
    );
  }
  clearTimeout(timeout);

  // Handle "no content" responses gracefully.
  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (parseError) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  if (data && Object.prototype.hasOwnProperty.call(data, "data")) {
    const payload = data.data;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === "object") {
      return {
        ...payload,
        success: data.success,
        message: data.message,
      };
    }
  }

  return data;
}

/** Custom error type so UI code can branch on status codes if needed. */
class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function registerUser(payload, isFormData = false) {
  return apiRequest(
    "/auth/register",
    { method: "POST", body: isFormData ? payload : JSON.stringify(payload) },
    isFormData
  );
}

function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

function getCurrentUser() {
  return apiRequest("/auth/me", { method: "GET" });
}

/* ------------------------------------------------------------------ */
/* Users / Profile / Certifications                                   */
/* ------------------------------------------------------------------ */

function getUserById(userId) {
  return apiRequest(`/users/${userId}`, { method: "GET" });
}

function updateUser(userId, payload, isFormData = false) {
  return apiRequest(
    `/users/${userId}`,
    { method: "PUT", body: isFormData ? payload : JSON.stringify(payload) },
    isFormData
  );
}

function uploadCertification(userId, formData) {
  return apiRequest(
    `/users/${userId}/certifications`,
    { method: "POST", body: formData },
    true
  );
}

function getCertifications(userId) {
  return apiRequest(`/users/${userId}/certifications`, { method: "GET" });
}

/* ------------------------------------------------------------------ */
/* Problems                                                            */
/* ------------------------------------------------------------------ */

function createProblem(formData) {
  return apiRequest("/problems", { method: "POST", body: formData }, true);
}

function getProblems(queryParams = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(queryParams).filter(([, v]) => v !== "" && v != null))
  ).toString();
  return apiRequest(`/problems${query ? `?${query}` : ""}`, { method: "GET" });
}

function getProblemById(problemId) {
  return apiRequest(`/problems/${problemId}`, { method: "GET" });
}

function updateProblem(problemId, payload) {
  return apiRequest(`/problems/${problemId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

function deleteProblem(problemId) {
  return apiRequest(`/problems/${problemId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* Votes                                                               */
/* ------------------------------------------------------------------ */

function voteProblem(problemId) {
  return apiRequest(`/problems/${problemId}/vote`, { method: "POST" });
}

function removeVote(problemId) {
  return apiRequest(`/problems/${problemId}/vote`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

function getComments(problemId) {
  return apiRequest(`/problems/${problemId}/comments`, { method: "GET" });
}

function addComment(problemId, text) {
  return apiRequest(`/problems/${problemId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

/* ------------------------------------------------------------------ */
/* Solver interest / Solutions                                        */
/* ------------------------------------------------------------------ */

function expressSolverInterest(problemId, payload) {
  return apiRequest(`/problems/${problemId}/interest`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function submitSolution(problemId, formData) {
  return apiRequest(`/problems/${problemId}/solutions`, { method: "POST", body: formData }, true);
}

function getSolutions(problemId) {
  return apiRequest(`/problems/${problemId}/solutions`, { method: "GET" });
}

function getSolutionById(solutionId) {
  return apiRequest(`/solutions/${solutionId}`, { method: "GET" });
}

function getMySolutions() {
  return apiRequest("/solutions/mine", { method: "GET" });
}

function updateSolution(solutionId, payload) {
  return apiRequest(`/solutions/${solutionId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

function createTeam(payload) {
  return apiRequest("/teams", { method: "POST", body: JSON.stringify(payload) });
}

function getTeamById(teamId) {
  return apiRequest(`/teams/${teamId}`, { method: "GET" });
}

function inviteMember(teamId, payload) {
  return apiRequest(`/teams/${teamId}/invite`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function respondToInvite(teamId, payload) {
  return apiRequest(`/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function removeMember(teamId, memberId) {
  return apiRequest(`/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
}

function getRecommendedCollaborators(problemId) {
  return apiRequest(`/problems/${problemId}/recommended-collaborators`, { method: "GET" });
}

function getMyTeams() {
  return apiRequest("/teams/mine", { method: "GET" });
}

function getTeamInvitations() {
  return apiRequest("/teams/invitations", { method: "GET" });
}

/* ------------------------------------------------------------------ */
/* Ratings / Evaluation                                                */
/* ------------------------------------------------------------------ */

function submitRating(solutionId, payload) {
  return apiRequest(`/solutions/${solutionId}/rate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function getRatings(solutionId) {
  return apiRequest(`/solutions/${solutionId}/ratings`, { method: "GET" });
}

function selectSolution(solutionId, payload) {
  return apiRequest(`/solutions/${solutionId}/select`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/* ------------------------------------------------------------------ */
/* Implementation                                                      */
/* ------------------------------------------------------------------ */

function getImplementationStatus(solutionId) {
  return apiRequest(`/solutions/${solutionId}/implementation`, { method: "GET" });
}

function updateImplementationStatus(solutionId, payload) {
  return apiRequest(`/solutions/${solutionId}/implementation`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

function getNotifications() {
  return apiRequest("/notifications", { method: "GET" });
}

function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" });
}