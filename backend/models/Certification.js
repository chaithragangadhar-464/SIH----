const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, required: true, trim: true },
    certificateName: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true },
    issueDate: { type: Date },
    documentPath: { type: String, required: true },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

certificationSchema.index({ userId: 1 });

module.exports = mongoose.model('Certification', certificationSchema);
