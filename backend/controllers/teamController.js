const Team = require('../models/Team');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { createNotification } = require('../services/notificationService');
const { success, error } = require('../utils/response');

// POST /api/teams
const createTeam = async (req, res, next) => {
  try {
    const { problemId, name } = req.body;

    if (!problemId || !name) {
      return error(res, 'problemId and name are required', 400);
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    const team = await Team.create({
      problemId,
      name,
      leaderId: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'leader',
          joinedAt: new Date()
        }
      ],
      status: 'forming',
    });

    return success(
      res,
      { team },
      'Team created',
      201
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/teams/:id
const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leaderId', 'name role')
      .populate('members.userId', 'name role skills');

    if (!team) {
      return error(res, 'Team not found', 404);
    }

    return success(res, { team });
  } catch (err) {
    next(err);
  }
};

// POST /api/teams/:id/invite
const inviteMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return error(res, 'Team not found', 404);
    }

    const isLeader =
      team.leaderId.toString() === req.user._id.toString();

    if (!isLeader && req.user.role !== 'admin') {
      return error(
        res,
        'Only the team leader can invite members',
        403
      );
    }

    const { userId } = req.body;

    if (!userId) {
      return error(res, 'userId is required', 400);
    }

    const invitedUser = await User.findById(userId);

    if (!invitedUser) {
      return error(
        res,
        'Invited user does not exist',
        404
      );
    }

    await createNotification({
      userId,
      type: 'team-invite',
      title: 'Team invitation',
      message: `You have been invited to join the team "${team.name}"`,
      relatedId: team._id,
    });

    return success(
      res,
      {},
      'Invitation sent'
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/teams/:id/members
const addMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return error(res, 'Team not found', 404);
    }

    const isLeader =
      team.leaderId.toString() === req.user._id.toString();

    if (!isLeader && req.user.role !== 'admin') {
      return error(
        res,
        'Only the team leader can manage membership',
        403
      );
    }

    const { userId, role } = req.body;

    if (!userId) {
      return error(res, 'userId is required', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return error(res, 'User does not exist', 404);
    }

    const alreadyMember = team.members.some(
      (m) => m.userId.toString() === userId
    );

    if (alreadyMember) {
      return error(
        res,
        'User is already a member of this team',
        409
      );
    }

    team.members.push({
      userId,
      role: role || 'member',
      joinedAt: new Date()
    });

    team.status = 'active';

    await team.save();

    return success(
      res,
      { team },
      'Member added'
    );
  } catch (err) {
    next(err);
  }
};

// DELETE /api/teams/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return error(res, 'Team not found', 404);
    }

    const isLeader =
      team.leaderId.toString() === req.user._id.toString();

    const isSelf =
      req.params.userId === req.user._id.toString();

    if (!isLeader && !isSelf && req.user.role !== 'admin') {
      return error(
        res,
        'You are not authorized to remove this member',
        403
      );
    }

    team.members = team.members.filter(
      (m) => m.userId.toString() !== req.params.userId
    );

    await team.save();

    return success(
      res,
      { team },
      'Member removed'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTeam,
  getTeamById,
  inviteMember,
  addMember,
  removeMember
};
