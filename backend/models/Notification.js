const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'problem-comment',
  'team-invite',
  'solution-rating',
  'certificate-verified',
  'solution-selected',
  'implementation-update',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({
  userId: 1,
  read: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'Notification',
  notificationSchema
);

module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
