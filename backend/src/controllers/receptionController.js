const ExcelJS = require('exceljs');
const path = require('path');
const fs   = require('fs');
const { Visit, ReceptionCheck, GateCheck, Visitor } = require('../models');

exports.checkin = async (req, res) => {
  try {
    const { visit_id, notes } = req.body;
    const visit = await Visit.findByPk(visit_id, {
      include: [
        { model: Visitor, as: 'visitor' },
        { model: GateCheck, as: 'gateCheck' },
      ],
    });
    if (!visit) return res.status(404).json({ message: 'Visite non trouvée' });
    if (!visit.gateCheck || !visit.gateCheck.gate_checkin_time) {
      return res.status(400).json({ message: 'Check-in portail non effectué' });
    }
    if (visit.status === 'completed') {
      return res.status(400).json({ message: 'Visite déjà terminée' });
    }
    const existing = await ReceptionCheck.findOne({ where: { visit_id } });
    if (existing && existing.reception_checkin) {
      return res.status(409).json({ message: 'Check-in réception déjà effectué' });
    }
    const receptionCheck = existing
      ? await existing.update({ reception_checkin: new Date(), receptionist_name: req.user.username, notes })
      : await ReceptionCheck.create({ visit_id, reception_checkin: new Date(), receptionist_name: req.user.username, notes });
    const result = { visit, receptionCheck };
    req.io?.emit('reception:checkin', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const { visit_id, notes } = req.body;
    const receptionCheck = await ReceptionCheck.findOne({ where: { visit_id } });
    if (!receptionCheck || !receptionCheck.reception_checkin) {
      return res.status(400).json({ message: 'Check-in réception non effectué' });
    }
    if (receptionCheck.reception_checkout) {
      return res.status(409).json({ message: 'Check-out réception déjà effectué' });
    }
    const { observations } = req.body;
    await receptionCheck.update({ reception_checkout: new Date(), notes: notes || receptionCheck.notes, observations: observations || null });
    const visit = await Visit.findByPk(visit_id, {
      include: [{ model: Visitor, as: 'visitor' }],
    });
    const result = { visit, receptionCheck };
    req.io?.emit('reception:checkout', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const visits = await Visit.findAll({
      where: { visit_date: date },
      include: [
        { model: Visitor, as: 'visitor' },
        { model: GateCheck, as: 'gateCheck' },
        { model: ReceptionCheck, as: 'receptionCheck' },
      ],
      order: [['created_at', 'ASC']],
    });
    const filtered = visits.filter((v) => v.receptionCheck && v.receptionCheck.reception_checkin);

    const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GABRWA';
    const sheet = workbook.addWorksheet('Réception');

    // ── Titre ────────────────────────────────────────────────────────────
    sheet.mergeCells('A1:M1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Registre Réception — ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    titleCell.font = { bold: true, size: 13 };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 28;

    // ── En-têtes ─────────────────────────────────────────────────────────
    sheet.columns = [
      { key: 'num',            width: 5  },
      { key: 'visitor_number', width: 14 },
      { key: 'full_name',      width: 26 },
      { key: 'passport',       width: 16 },
      { key: 'phone',          width: 16 },
      { key: 'purpose',        width: 28 },
      { key: 'host_name',      width: 20 },
      { key: 'gate_in',        width: 13 },
      { key: 'rec_in',         width: 16 },
      { key: 'rec_out',        width: 16 },
      { key: 'receptionist',   width: 18 },
      { key: 'observations',   width: 32 },
      { key: 'signature',      width: 28 },
    ];

    const headerRow = sheet.getRow(2);
    const headers = ['N°', 'N° Visiteur', 'Nom complet', 'Passeport', 'Téléphone', 'Motif', 'Personne visitée', 'Entrée portail', 'Arrivée réception', 'Départ réception', 'Réceptionniste', 'Observations', 'Signature'];
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    });
    headerRow.height = 22;

    // ── Données ───────────────────────────────────────────────────────────
    // Colonne signature = index 12 (0-based) = colonne M
    const SIG_COL = 12;

    for (let i = 0; i < filtered.length; i++) {
      const v = filtered[i];
      const hasSig = v.has_signature && v.signature_path;
      const hasObs = !!(v.receptionCheck?.observations);
      const rowHeight = hasSig ? 65 : hasObs ? 40 : 18;

      const row = sheet.addRow({
        num:            i + 1,
        visitor_number: v.visitor?.visitor_number || '',
        full_name:      v.visitor?.full_name || '',
        passport:       v.visitor?.passport_number || '',
        phone:          v.visitor?.phone || '',
        purpose:        v.purpose,
        host_name:      v.host_name || '',
        gate_in:        fmt(v.gateCheck?.gate_checkin_time),
        rec_in:         fmt(v.receptionCheck?.reception_checkin),
        rec_out:        fmt(v.receptionCheck?.reception_checkout),
        receptionist:   v.receptionCheck?.receptionist_name || '',
        observations:   v.receptionCheck?.observations || '',
        signature:      hasSig ? '' : '—',
      });

      row.height = rowHeight;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });

      if (hasSig) {
        const sigFile = path.join(__dirname, '../../../', v.signature_path);
        try {
          const buffer = fs.readFileSync(sigFile);
          const imageId = workbook.addImage({ buffer, extension: 'png' });
          const sheetRow = row.number;
          sheet.addImage(imageId, {
            tl: { col: SIG_COL, row: sheetRow - 1 },
            br: { col: SIG_COL + 1, row: sheetRow },
            editAs: 'oneCell',
          });
        } catch {
          row.getCell(SIG_COL + 1).value = 'Signé';
        }
      }
    }

    const lastRow = sheet.lastRow?.number || 2;
    for (let r = 3; r <= lastRow; r++) {
      sheet.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reception_${date}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Erreur export', error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { date } = req.query;
    const where = {};
    if (date) where.visit_date = date;
    const visits = await Visit.findAll({
      where,
      include: [
        { model: Visitor, as: 'visitor' },
        { model: GateCheck, as: 'gateCheck' },
        { model: ReceptionCheck, as: 'receptionCheck' },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
