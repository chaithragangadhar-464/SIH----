// Thin controller wrapping userController's certification endpoints and the
// verification workflow.
const { verifyCertification } = require('../services/certificateService');
const { createNotification } = require('../services/notificationService');
const { success, error } = require('../utils/response');

const VERIFIER_ROLES = [
  'university',
  'industry',
  'ngo',
  'government',
  'expert',
  'admin'
];

// PUT /api/certifications/:id/verify
const verifyCertificationHandler = async (req, res, next) => {
  try {
    if (!VERIFIER_ROLES.includes(req.user.role)) {
      return error(
        res,
        'Your role is not authorized to verify certifications',
        403
      );
    }

    const { decision } = req.body;

    const certification = await verifyCertification(
      req.params.id,
      req.user,
      decision
    );

    await createNotification({
      userId: certification.userId,
      type: 'certificate-verified',
      title: 'Certification review update',
      message: `Your certification "${certification.certificateName}" was ${certification.verificationStatus}`,
      relatedId: certification._id,
    });

    return success(
      res,
      { certification },
      'Certification review updated'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyCertificationHandler,
  VERIFIER_ROLES,
};
