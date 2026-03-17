const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, [
  body('login').notEmpty().withMessage('Login requis'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
], validate, ctrl.login);

router.post('/register', authenticate, requireRole('admin'), [
  body('username').isLength({ min: 3, max: 100 }).withMessage('Username 3-100 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe min 8 caractères'),
  body('role').isIn(['gate', 'reception', 'admin']).withMessage('Rôle invalide'),
], validate, ctrl.register);

router.get('/me', authenticate, ctrl.getMe);
router.get('/users', authenticate, requireRole('admin'), ctrl.listUsers);
router.put('/users/:id', authenticate, requireRole('admin'), ctrl.updateUser);
router.delete('/users/:id', authenticate, requireRole('admin'), ctrl.deleteUser);

module.exports = router;
