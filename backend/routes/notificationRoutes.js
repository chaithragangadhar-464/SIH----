const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { mongoIdParam } = require('../utils/validators');

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, mongoIdParam('id'), markAsRead);

module.exports = router;
