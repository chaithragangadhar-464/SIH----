const Problem = require('../models/Problem');
const { checkDuplicate } = require('./aiService');
const { DUPLICATE_THRESHOLD } = require('../config/ai');

// Fetches existing problem descriptions (excluding the one just created) and
// asks the AI service to compare them semantically against the new text.
// Returns { isDuplicate, similarity, similarProblemId } or null if AI is unavailable.
const detectDuplicates = async (newProblem) => {
  const existing = await Problem.find({
    _id: { $ne: newProblem._id },
  })
    .select('_id title description')
    .limit(500)
    .lean();

  if (existing.length === 0) {
    return {
      isDuplicate: false,
      similarity: 0,
      similarProblemId: null,
    };
  }

  const existingProblems = existing.map((p) => ({
    id: p._id.toString(),
    text: `${p.title}. ${p.description}`,
  }));

  const aiResult = await checkDuplicate(
    `${newProblem.title}. ${newProblem.description}`,
    existingProblems
  );

  if (!aiResult) {
    // AI unavailable — do not fabricate a result.
    return null;
  }

  const similarity =
    typeof aiResult.similarity === 'number'
      ? aiResult.similarity
      : 0;

  const isDuplicate =
    similarity >= DUPLICATE_THRESHOLD;

  return {
    isDuplicate,
    similarity,
    similarProblemId:
      aiResult.similarProblemId || null,
    matches: aiResult.matches || [],
  };
};

module.exports = {
  detectDuplicates,
};
