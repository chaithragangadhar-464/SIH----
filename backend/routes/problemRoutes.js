const express = require('express');
const router = express.Router();

const {
  createProblem,
  listProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  getRecommendations,
  getRecommendedCollaborators,
} = require('../controllers/problemController');

const {
  castVote,
  removeVote
} = require('../controllers/voteController');

const {
  getComments,
  addComment
} = require('../controllers/commentController');

const {
  createSolution,
  getSolutionsForProblem,
} = require('../controllers/solutionController');

const { protect } =
  require('../middleware/authMiddleware');

const {
  uploadProblemEvidence,
  uploadSolutionFiles
} = require('../middleware/uploadMiddleware');

const {
  problemValidators,
  solutionValidators,
  mongoIdParam
} = require('../utils/validators');

router.post(
  '/',
  protect,
  uploadProblemEvidence.array('evidence', 5),
  problemValidators,
  createProblem
);

router.get(
  '/',
  listProblems
);

router.get(
  '/:id',
  mongoIdParam('id'),
  getProblemById
);

router.put(
  '/:id',
  protect,
  mongoIdParam('id'),
  updateProblem
);

router.delete(
  '/:id',
  protect,
  mongoIdParam('id'),
  deleteProblem
);

router.get(
  '/:id/recommendations',
  mongoIdParam('id'),
  getRecommendations
);

router.get(
  '/:id/recommended-collaborators',
  mongoIdParam('id'),
  getRecommendedCollaborators
);

router.post(
  '/:id/vote',
  protect,
  mongoIdParam('id'),
  castVote
);

router.delete(
  '/:id/vote',
  protect,
  mongoIdParam('id'),
  removeVote
);

router.get(
  '/:id/comments',
  mongoIdParam('id'),
  getComments
);

router.post(
  '/:id/comments',
  protect,
  mongoIdParam('id'),
  addComment
);

router.post(
  '/:id/solutions',
  protect,
  uploadSolutionFiles.array('documents', 5),
  solutionValidators,
  createSolution
);

router.get(
  '/:id/solutions',
  mongoIdParam('id'),
  getSolutionsForProblem
);

module.exports = router;
