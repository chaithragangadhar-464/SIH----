const Certification = require('../models/Certification');

// Verification must be performed by an authorized verifier — never by the
// certificate owner themselves.
const verifyCertification = async (
  certificationId,
  verifierUser,
  decision
) => {
  const certification =
    await Certification.findById(certificationId);

  if (!certification) {
    const err = new Error(
      'Certification not found'
    );
    err.statusCode = 404;
    throw err;
  }

  if (
    certification.userId.toString() ===
    verifierUser._id.toString()
  ) {
    const err = new Error(
      'You cannot verify your own certification'
    );
    err.statusCode = 403;
    throw err;
  }

  if (
    !['verified', 'rejected'].includes(decision)
  ) {
    const err = new Error(
      "Decision must be 'verified' or 'rejected'"
    );
    err.statusCode = 400;
    throw err;
  }

  certification.verificationStatus = decision;
  certification.verifiedBy =
    verifierUser._id;
  certification.verifiedAt = new Date();

  await certification.save();

  return certification;
};

module.exports = {
  verifyCertification,
};
