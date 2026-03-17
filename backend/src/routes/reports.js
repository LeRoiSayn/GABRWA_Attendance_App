const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', ctrl.getReport);
router.get('/export', ctrl.exportExcel);
router.get('/export/csv', ctrl.exportCSV);
router.get('/dashboard', ctrl.getDashboard);

module.exports = router;
