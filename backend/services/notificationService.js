const Notification = require('../models/Notification');

// Creates a single notification. Never fabricates content — always driven by
// real events passed in by controllers.
const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedId = null,
}) => {
  if (!userId) return null;

  try {
    return await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
    });
  } catch (err) {
    console.error(
      'Failed to create notification:',
      err.message
    );
    return null;
  }
};

const notifyMany = async (
  userIds,
  payloadWithoutUserId
) => {
  const uniqueIds = [
    ...new Set(
      userIds.map((id) => id.toString())
    ),
  ];

  return Promise.all(
    uniqueIds.map((userId) =>
      createNotification({
        userId,
        ...payloadWithoutUserId,
      })
    )
  );
};

module.exports = {
  createNotification,
  notifyMany,
};
