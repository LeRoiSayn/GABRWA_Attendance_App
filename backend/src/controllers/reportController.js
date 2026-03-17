const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { Visit, Visitor, GateCheck, ReceptionCheck } = require('../models');

const buildWhere = (start_date, end_date) => {
  const where = {};
  if (start_date || end_date) {
    where.visit_date = {};
    if (start_date) where.visit_date[Op.gte] = start_date;
    if (end_date) where.visit_date[Op.lte] = end_date;
  }
  return where;
};

const fetchVisits = (where) =>
  Visit.findAll({
    where,
    include: [
      { model: Visitor, as: 'visitor' },
      { model: GateCheck, as: 'gateCheck' },
      { model: ReceptionCheck, as: 'receptionCheck' },
    ],
    order: [['visit_date', 'DESC'], ['created_at', 'DESC']],
  });

exports.getReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const visits = await fetchVisits(buildWhere(start_date, end_date));
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Export Excel — visites portail uniquement (sans passage à la réception)
exports.exportExcel = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const allVisits = await fetchVisits(buildWhere(start_date, end_date));
    const visits = allVisits.filter((v) => !v.receptionCheck || !v.receptionCheck.reception_checkin);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Portail');

    sheet.columns = [
      { header: 'ID Visite', key: 'id', width: 10 },
      { header: 'Date', key: 'visit_date', width: 14 },
      { header: 'Visiteur', key: 'full_name', width: 25 },
      { header: 'Téléphone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Motif', key: 'purpose', width: 30 },
      { header: 'Hôte', key: 'host_name', width: 20 },
      { header: 'Statut', key: 'status', width: 14 },
      { header: 'Entrée portail', key: 'gate_in', width: 20 },
      { header: 'Sortie portail', key: 'gate_out', width: 20 },
      { header: 'Agent portail', key: 'officer', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };

    visits.forEach((v) => {
      sheet.addRow({
        id: v.id,
        visit_date: v.visit_date,
        full_name: v.visitor?.full_name || '',
        phone: v.visitor?.phone || '',
        email: v.visitor?.email || '',
        purpose: v.purpose,
        host_name: v.host_name || '',
        status: v.status,
        gate_in: v.gateCheck?.gate_checkin_time || '',
        gate_out: v.gateCheck?.gate_checkout_time || '',
        officer: v.gateCheck?.officer_name || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=portail_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Erreur export', error: err.message });
  }
};

// Export CSV — visites avec passage portail ET réception
exports.exportCSV = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const allVisits = await fetchVisits(buildWhere(start_date, end_date));
    const visits = allVisits.filter((v) => v.receptionCheck && v.receptionCheck.reception_checkin);

    const headers = ['ID','Date','Visiteur','Téléphone','Email','Motif','Hôte','Statut','Entrée portail','Sortie portail','Agent portail','Arrivée réception','Départ réception','Réceptionniste'];
    const rows = visits.map((v) => [
      v.id, v.visit_date,
      v.visitor?.full_name || '', v.visitor?.phone || '', v.visitor?.email || '',
      `"${(v.purpose || '').replace(/"/g, '""')}"`,
      v.host_name || '', v.status,
      v.gateCheck?.gate_checkin_time || '', v.gateCheck?.gate_checkout_time || '',
      v.gateCheck?.officer_name || '',
      v.receptionCheck?.reception_checkin || '', v.receptionCheck?.reception_checkout || '',
      v.receptionCheck?.receptionist_name || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=reception_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ message: 'Erreur export CSV', error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const [todayCount, weekCount, monthCount, statusCounts] = await Promise.all([
      Visit.count({ where: { visit_date: today } }),
      Visit.count({ where: { visit_date: { [Op.gte]: startOfWeek.toISOString().split('T')[0] } } }),
      Visit.count({ where: { visit_date: { [Op.gte]: startOfMonth.toISOString().split('T')[0] } } }),
      Visit.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: { visit_date: today },
        group: ['status'],
        raw: true,
      }),
    ]);

    res.json({ today: todayCount, week: weekCount, month: monthCount, byStatus: statusCounts });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
