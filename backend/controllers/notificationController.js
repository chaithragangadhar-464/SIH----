const Notification = require('../models/Notification');
const { success, error } = require('../utils/response');

// GET /api/notifications
const getMyNotifications = async (
  req,
  res,
  next
) => {
  try {
    const notifications =
      await Notification.find({
        userId: req.user._id
      }).sort({
        createdAt: -1
      });

    return success(
      res,
      {
        notifications,
        count: notifications.length
      }
    );
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (
  req,
  res,
  next
) => {
  try {
    const notification =
      await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

    if (!notification) {
      return error(
        res,
        'Notification not found',
        404
      );
    }

    notification.read = true;

    await notification.save();

    return success(
      res,
      { notification },
      'Notification marked as read'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead
};
