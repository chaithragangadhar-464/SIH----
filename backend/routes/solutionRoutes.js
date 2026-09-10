const express = require('express');
const router = express.Router();
const {
  getMySolutions,
  getSolutionById,
  updateSolution,
  deleteSolution,
  selectSolution,
} = require('../controllers/solutionController');
const { rateSolution, getRatingsForSolution } = require('../controllers/ratingController');
const {
  getImplementation,
  createImplementation,
  updateImplementation,
} = require('../controllers/implementationController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSolutionFiles } = require('../middleware/uploadMiddleware');
const { ratingValidators, mongoIdParam } = require('../utils/validators');

router.get('/mine', protect, getMySolutions);
router.get('/:id', mongoIdParam('id'), getSolutionById);
router.put('/:id', protect, mongoIdParam('id'), updateSolution);
router.delete('/:id', protect, mongoIdParam('id'), deleteSolution);

router.post('/:id/select', protect, mongoIdParam('id'), selectSolution);

router.post('/:id/rate', protect, mongoIdParam('id'), ratingValidators, rateSolution);
router.get('/:id/ratings', mongoIdParam('id'), getRatingsForSolution);

router.get('/:id/implementation', mongoIdParam('id'), getImplementation);
router.post('/:id/implementation', protect, mongoIdParam('id'), createImplementation);
router.put(
  '/:id/implementation',
  protect,
  mongoIdParam('id'),
  uploadSolutionFiles.array('evidence', 5),
  updateImplementation
);

module.exports = router;
