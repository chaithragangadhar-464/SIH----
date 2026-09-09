// Optional local-dev seed script.
// Does NOT create fake problems/solutions/votes/ratings/statistics.
// Only optionally creates a single admin account.

require('dotenv').config({
  path: require('path').join(__dirname, '..', '..', 'backend', '.env')
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../backend/models/User');

const run = async () => {
  const {
    SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD,
    SEED_ADMIN_NAME,
    MONGODB_URI
  } = process.env;

  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not configured.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding.');

  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — nothing to seed.');
    await mongoose.disconnect();
    return;
  }

  const existing = await User.findOne({
    email: SEED_ADMIN_EMAIL.toLowerCase()
  });

  if (existing) {
    console.log('Admin account already exists — skipping.');
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

  await User.create({
    name: SEED_ADMIN_NAME || 'Platform Admin',
    email: SEED_ADMIN_EMAIL,
    password: hashedPassword,
    role: 'admin',
    verificationStatus: 'verified'
  });

  console.log(`Real admin account created for ${SEED_ADMIN_EMAIL}.`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
