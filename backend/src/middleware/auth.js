const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou invalide' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'role', 'is_active', 'permissions'],
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur non autorisé' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé : rôle insuffisant' });
  }
  next();
};

// Vérifie le rôle OU une permission supplémentaire accordée par l'admin
const requireAccess = (access) => (req, res, next) => {
  const { role, permissions } = req.user;
  if (role === 'admin' || role === access || (permissions && permissions.includes(access))) {
    return next();
  }
  return res.status(403).json({ message: 'Accès refusé' });
};

module.exports = { authenticate, requireRole, requireAccess };
