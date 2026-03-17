const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/visitorController');

router.use(authenticate);

router.post('/', [
  body('full_name').isLength({ min: 2 }).withMessage('Nom complet requis'),
  body('phone').matches(/^[+\d\s\-()]{6,20}$/).withMessage('Téléphone invalide'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email invalide'),
  body('passport_number').notEmpty().withMessage('Numéro de passeport requis'),
  body('visitor_number').notEmpty().withMessage('Numéro de visiteur requis'),
], validate, ctrl.create);

router.get('/',       ctrl.listAll);
router.get('/search', ctrl.search);
router.get('/:id',    ctrl.getById);
router.put('/:id', ctrl.update);

module.exports = router;
