// Transparent, deterministic priority calculation.
// Weights (documented, centralized here — never randomized):
//   Community engagement = 30%
//   Social impact         = 25%
//   Urgency                = 20%
//   People affected        = 15%
//   Evidence quality      = 10%

const WEIGHTS = {
  communityEngagement: 0.3,
  socialImpact: 0.25,
  urgency: 0.2,
  peopleAffected: 0.15,
  evidenceQuality: 0.1,
};

// Normalizes vote count into a 0-1 score using a soft cap so that a handful
// of early votes don't saturate the score, while it still grows with real engagement.
const scoreCommunityEngagement = (
  voteCount = 0,
  commentCount = 0
) => {
  const engagementRaw =
    voteCount + commentCount * 0.5;

  return Math.min(1, engagementRaw / 50);
};

// Rough heuristic from stated importance/expectedImpact text length and keywords.
// This is intentionally simple and transparent, not a black box.
const scoreSocialImpact = (problem) => {
  const text = `${problem.expectedImpact || ''} ${
    problem.importance || ''
  }`.toLowerCase();

  const strongTerms = [
    'critical',
    'severe',
    'life-threatening',
    'urgent',
    'widespread',
    'death',
    'crisis',
  ];

  const hits = strongTerms.filter((t) =>
    text.includes(t)
  ).length;

  const lengthScore = Math.min(
    1,
    text.trim().length / 400
  );

  const keywordScore = Math.min(
    1,
    hits / strongTerms.length
  );

  return lengthScore * 0.5 + keywordScore * 0.5;
};

const scoreUrgency = (problem) => {
  const text = `${problem.importance || ''} ${
    problem.description || ''
  }`.toLowerCase();

  const urgentTerms = [
    'immediately',
    'urgent',
    'emergency',
    'now',
    'daily',
    'growing',
  ];

  const hits = urgentTerms.filter((t) =>
    text.includes(t)
  ).length;

  return Math.min(
    1,
    hits / urgentTerms.length
  );
};

// Attempts to parse a numeric estimate out of the affectedPeople free-text field.
const scorePeopleAffected = (problem) => {
  const text = problem.affectedPeople || '';
  const match = text.match(/[\d,]+/);

  if (!match) return 0;

  const num = parseInt(
    match[0].replace(/,/g, ''),
    10
  );

  if (Number.isNaN(num)) return 0;

  // Soft cap at 100,000 affected people = full score.
  return Math.min(1, num / 100000);
};

const scoreEvidenceQuality = (problem) => {
  const evidenceCount =
    (problem.evidence || []).length;

  return Math.min(
    1,
    evidenceCount / 3
  );
};

const calculatePriority = (
  problem,
  {
    voteCount = 0,
    commentCount = 0,
  } = {}
) => {
  const communityEngagement =
    scoreCommunityEngagement(
      voteCount,
      commentCount
    );

  const socialImpact =
    scoreSocialImpact(problem);

  const urgency =
    scoreUrgency(problem);

  const peopleAffected =
    scorePeopleAffected(problem);

  const evidenceQuality =
    scoreEvidenceQuality(problem);

  const rawScore =
    communityEngagement *
      WEIGHTS.communityEngagement +
    socialImpact *
      WEIGHTS.socialImpact +
    urgency *
      WEIGHTS.urgency +
    peopleAffected *
      WEIGHTS.peopleAffected +
    evidenceQuality *
      WEIGHTS.evidenceQuality;

  const priorityScore =
    Math.round(rawScore * 100);

  let priorityLevel = 'Low';

  if (priorityScore >= 66) {
    priorityLevel = 'High';
  } else if (priorityScore >= 33) {
    priorityLevel = 'Medium';
  }

  return {
    priorityScore,
    priorityLevel,
  };
};

module.exports = {
  calculatePriority,
  WEIGHTS,
};
