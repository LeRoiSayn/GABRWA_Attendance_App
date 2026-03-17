const { User } = require('../models');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@company.com';
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log('Admin déjà existant.');
    return;
  }
  const password_hash = await User.hashPassword(process.env.ADMIN_PASSWORD || 'Admin@123456');
  await User.create({
    username: process.env.ADMIN_USERNAME || 'admin',
    email,
    password_hash,
    role: 'admin',
    is_active: true,
  });
  console.log(`Admin créé : ${email}`);
};

module.exports = seedAdmin;
