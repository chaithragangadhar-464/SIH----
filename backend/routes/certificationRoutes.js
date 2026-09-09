const express = require('express');
const router = express.Router();
const { verifyCertificationHandler } = require('../controllers/certificationController');
const { protect } = require('../middleware/authMiddleware');
const { mongoIdParam } = require('../utils/validators');

// Creating/listing certifications lives under /api/users/:id/certifications (userRoutes.js).
router.put('/:id/verify', protect, mongoIdParam('id'), verifyCertificationHandler);

module.exports = router;
