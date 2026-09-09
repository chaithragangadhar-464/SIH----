// Centralized AI service configuration.
// The exact AI service URL and thresholds are configurable through .env

module.exports = {
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  AI_SERVICE_TIMEOUT_MS: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 5000,
  DUPLICATE_THRESHOLD: parseFloat(process.env.DUPLICATE_THRESHOLD) || 0.85,
};
