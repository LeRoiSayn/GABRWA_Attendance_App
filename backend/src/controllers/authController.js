const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ message: 'Identifiants requis' });
    }
    const user = await User.findOne({
      where: { is_active: true },
      ...(login.includes('@')
        ? { where: { email: login, is_active: true } }
        : { where: { username: login, is_active: true } }),
    });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email déjà utilisé' });
    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) return res.status(409).json({ message: 'Nom d\'utilisateur déjà utilisé' });
    const password_hash = await User.hashPassword(password);
    const user = await User.create({ username, email, password_hash, role });
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'is_active', 'permissions', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, password, username, email, permissions } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;
    if (password) user.password_hash = await User.hashPassword(password);
    if (permissions !== undefined) user.permissions = permissions;
    await user.save();
    res.json({ message: 'Utilisateur mis à jour', user: { id: user.id, username: user.username, email: user.email, role: user.role, is_active: user.is_active, permissions: user.permissions } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Impossible de supprimer votre propre compte' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    await user.destroy();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
