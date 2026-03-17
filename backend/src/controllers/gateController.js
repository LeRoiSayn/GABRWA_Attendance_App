const ExcelJS = require('exceljs');
const path = require('path');
const fs   = require('fs');
const { Visit, GateCheck, ReceptionCheck, Visitor } = require('../models');

exports.checkin = async (req, res) => {
  try {
    const { visit_id, notes } = req.body;
    const visit = await Visit.findByPk(visit_id, {
      include: [{ model: Visitor, as: 'visitor' }],
    });
    if (!visit) return res.status(404).json({ message: 'Visite non trouvée' });
    if (visit.status !== 'pending') {
      return res.status(400).json({ message: `Statut invalide : ${visit.status}` });
    }
    const existing = await GateCheck.findOne({ where: { visit_id } });
    if (existing && existing.gate_checkin_time) {
      return res.status(409).json({ message: 'Check-in portail déjà effectué' });
    }
    const gateCheck = existing
      ? await existing.update({ gate_checkin_time: new Date(), officer_name: req.user.username, notes })
      : await GateCheck.create({ visit_id, gate_checkin_time: new Date(), officer_name: req.user.username, notes });
    await visit.update({ status: 'inside' });
    const result = { visit, gateCheck };
    req.io?.emit('gate:checkin', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const { visit_id, notes } = req.body;
    const visit = await Visit.findByPk(visit_id, {
      include: [{ model: Visitor, as: 'visitor' }],
    });
    if (!visit) return res.status(404).json({ message: 'Visite non trouvée' });
    if (visit.status !== 'inside') {
      return res.status(400).json({ message: 'Le visiteur n\'est pas à l\'intérieur' });
    }
    const gateCheck = await GateCheck.findOne({ where: { visit_id } });
    if (!gateCheck || !gateCheck.gate_checkin_time) {
      return res.status(400).json({ message: 'Check-in portail non effectué' });
    }
    if (gateCheck.gate_checkout_time) {
      return res.status(409).json({ message: 'Check-out portail déjà effectué' });
    }
    // Si la visite est passée par la réception, elle doit être sortie de la réception avant de quitter le portail
    const recCheck = await ReceptionCheck.findOne({ where: { visit_id } });
    if (recCheck && recCheck.reception_checkin && !recCheck.reception_checkout) {
      return res.status(400).json({ message: 'Le visiteur doit d\'abord être enregistré sortant à la réception' });
    }
    await gateCheck.update({ gate_checkout_time: new Date(), notes: notes || gateCheck.notes });
    await visit.update({ status: 'completed' });
    const result = { visit, gateCheck };
    req.io?.emit('gate:checkout', result);
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
      ],
      order: [['created_at', 'ASC']],
    });

    const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
    const STATUS_FR = { pending: 'En attente', inside: 'Présent', completed: 'Terminé', cancelled: 'Annulé' };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GABRWA';
    const sheet = workbook.addWorksheet('Portail');

    // ── Titre ────────────────────────────────────────────────────────────
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Registre Portail — ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
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
      { key: 'purpose',        width: 30 },
      { key: 'host_name',      width: 22 },
      { key: 'gate_in',        width: 14 },
      { key: 'gate_out',       width: 14 },
      { key: 'officer',        width: 18 },
      { key: 'status',         width: 13 },
      { key: 'signature',      width: 28 },
    ];

    const headerRow = sheet.getRow(2);
    const headers = ['N°', 'N° Visiteur', 'Nom complet', 'Passeport', 'Téléphone', 'Motif', 'Personne visitée', 'Entrée', 'Sortie', 'Agent', 'Statut', 'Signature'];
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
    // Colonne signature = index 11 (0-based) = colonne L
    const SIG_COL = 11;

    for (let i = 0; i < visits.length; i++) {
      const v = visits[i];
      const hasSig = v.has_signature && v.signature_path;
      const rowData = {
        num:            i + 1,
        visitor_number: v.visitor?.visitor_number || '',
        full_name:      v.visitor?.full_name || '',
        passport:       v.visitor?.passport_number || '',
        phone:          v.visitor?.phone || '',
        purpose:        v.purpose,
        host_name:      v.host_name || '',
        gate_in:        fmt(v.gateCheck?.gate_checkin_time),
        gate_out:       fmt(v.gateCheck?.gate_checkout_time),
        officer:        v.gateCheck?.officer_name || '',
        status:         STATUS_FR[v.status] || v.status,
        signature:      hasSig ? '' : '—',
      };

      const row = sheet.addRow(rowData);
      row.height = hasSig ? 65 : 18;
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

    // Bordure extérieure légère sur toutes les lignes de données
    const lastRow = sheet.lastRow?.number || 2;
    for (let r = 3; r <= lastRow; r++) {
      sheet.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=portail_${date}.xlsx`);
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
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
