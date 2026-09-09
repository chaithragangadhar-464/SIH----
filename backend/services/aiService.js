const { AI_SERVICE_URL, AI_SERVICE_TIMEOUT_MS } = require('../config/ai');

// Node 18+ has a global fetch. If running on an older Node, install node-fetch
// and uncomment the line below.
// const fetch = require('node-fetch');

const withTimeout = async (promise, ms) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

// Calls the Python FastAPI /classify endpoint.
// Returns null (never throws) if the AI service is unavailable, so problem
// creation is never blocked by AI downtime.
const classifyProblem = async (text) => {
  try {
    const res = await withTimeout(
      (signal) =>
        fetch(`${AI_SERVICE_URL}/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal,
        }),
      AI_SERVICE_TIMEOUT_MS
    );

    if (!res.ok) {
      console.warn(
        `AI classify service responded with status ${res.status}`
      );
      return null;
    }

    const data = await res.json();

    return {
      sector: data.sector || 'Other',
      subsector: data.subsector || null,
      confidence:
        typeof data.confidence === 'number'
          ? data.confidence
          : null,
    };
  } catch (err) {
    console.warn(
      'AI classify service unavailable:',
      err.message
    );
    return null;
  }
};

// Calls the Python FastAPI /duplicate endpoint.
// existingProblems: [{ id, text }]
// Returns null (never throws) if the AI service is unavailable.
const checkDuplicate = async (
  newProblemText,
  existingProblems
) => {
  try {
    const res = await withTimeout(
      (signal) =>
        fetch(`${AI_SERVICE_URL}/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem: newProblemText,
            existingProblems,
          }),
          signal,
        }),
      AI_SERVICE_TIMEOUT_MS
    );

    if (!res.ok) {
      console.warn(
        `AI duplicate service responded with status ${res.status}`
      );
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(
      'AI duplicate service unavailable:',
      err.message
    );
    return null;
  }
};

module.exports = {
  classifyProblem,
  checkDuplicate,
};
