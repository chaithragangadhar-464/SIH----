const express = require('express');
const router = express.Router();

const {
  getUserById,
  updateUser,
  listUsers,
  addCertification,
  getCertifications,
} = require('../controllers/userController');

const { protect } =
  require('../middleware/authMiddleware');

const { uploadCertification } =
  require('../middleware/uploadMiddleware');

const { mongoIdParam } =
  require('../utils/validators');

router.get(
  '/',
  protect,
  listUsers
);

router.get(
  '/:id',
  mongoIdParam('id'),
  getUserById
);

router.put(
  '/:id',
  protect,
  mongoIdParam('id'),
  updateUser
);

router.post(
  '/:id/certifications',
  protect,
  mongoIdParam('id'),
  uploadCertification.single('document'),
  addCertification
);

router.get(
  '/:id/certifications',
  mongoIdParam('id'),
  getCertifications
);

module.exports = router;
