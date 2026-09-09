const express = require('express');
const router = express.Router();
const { updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { mongoIdParam } = require('../utils/validators');

// Note: GET/POST for a problem's comments live under /api/problems/:id/comments (problemRoutes.js).
router.put('/:id', protect, mongoIdParam('id'), updateComment);
router.delete('/:id', protect, mongoIdParam('id'), deleteComment);

module.exports = router;
