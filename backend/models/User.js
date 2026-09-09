const mongoose = require('mongoose');

const ROLES = [
  'citizen',
  'student',
  'researcher',
  'university',
  'industry',
  'ngo',
  'government',
  'expert',
  'admin',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'citizen' },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },

    // Organization / academic / professional context (role-dependent, optional)
    organization: { type: String, trim: true },
    designation: { type: String, trim: true },
    course: { type: String, trim: true },
    branch: { type: String, trim: true },
    year: { type: String, trim: true },
    researchArea: { type: String, trim: true },
    specialization: { type: String, trim: true },

    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],

    profileImage: { type: String, default: null },

    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
  },
  { timestamps: true }
);

userSchema.index({ skills: 1 });
userSchema.index({ role: 1 });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
