const router = require('express').Router();
const ctrl   = require('../controllers/signatureController');
const { authenticate, requireAccess } = require('../middleware/auth');

// Authentifié — générer un token QR
router.post('/generate', authenticate, requireAccess('gate'), ctrl.generate);

// Authentifié — vérifier le statut (polling depuis le PC)
router.get('/status/:token', authenticate, ctrl.getStatus);

// Public — page mobile (pas de JWT requis)
router.get('/:token',      ctrl.getInfo);
router.post('/:token/sign', ctrl.sign);

module.exports = router;
