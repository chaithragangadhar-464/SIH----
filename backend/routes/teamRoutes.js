const express = require('express');
const router = express.Router();
const {
  getMyTeams,
  getMyInvitations,
  createTeam,
  getTeamById,
  inviteMember,
  addMember,
  removeMember,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { mongoIdParam } = require('../utils/validators');

router.get('/mine', protect, getMyTeams);
router.get('/invitations', protect, getMyInvitations);
router.post('/', protect, createTeam);
router.get('/:id', mongoIdParam('id'), getTeamById);
router.post('/:id/invite', protect, mongoIdParam('id'), inviteMember);
router.post('/:id/members', protect, mongoIdParam('id'), addMember);
router.delete('/:id/members/:userId', protect, mongoIdParam('id'), removeMember);

module.exports = router;
