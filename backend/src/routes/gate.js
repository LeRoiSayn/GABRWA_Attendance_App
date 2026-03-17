const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, requireAccess } = require('../middleware/auth');
const ctrl = require('../controllers/gateController');

router.use(authenticate);
router.use(requireAccess('gate'));

router.post('/checkin', [
  body('visit_id').isInt().withMessage('visit_id invalide'),
], validate, ctrl.checkin);

router.post('/checkout', [
  body('visit_id').isInt().withMessage('visit_id invalide'),
], validate, ctrl.checkout);

router.get('/history', ctrl.getHistory);
router.get('/export', ctrl.exportExcel);

module.exports = router;
