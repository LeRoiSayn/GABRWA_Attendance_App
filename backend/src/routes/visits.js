const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/visitController');

router.use(authenticate);

router.post('/', [
  body('visitor_id').isInt().withMessage('visitor_id invalide'),
  body('purpose').notEmpty().withMessage('Motif de visite requis'),
], validate, ctrl.create);

router.get('/active', ctrl.getActive);

module.exports = router;
