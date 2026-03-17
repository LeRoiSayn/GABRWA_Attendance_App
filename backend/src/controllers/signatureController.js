const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');
const { SignatureToken, Visit, Visitor } = require('../models');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads/signatures');
const TOKEN_TTL   = 10 * 60 * 1000; // 10 minutes

/* ── POST /signature/generate  (authentifié) ─────────────────────────── */
exports.generate = async (req, res) => {
  try {
    const { visit_id } = req.body;
    if (!visit_id) return res.status(400).json({ message: 'visit_id requis' });

    const visit = await Visit.findByPk(visit_id, {
      include: [{ model: Visitor, as: 'visitor' }],
    });
    if (!visit) return res.status(404).json({ message: 'Visite non trouvée' });

    if (visit.has_signature) {
      return res.status(409).json({ message: 'Visite déjà signée', already_signed: true });
    }

    // Invalider les tokens précédents non utilisés
    await SignatureToken.update({ used: true }, { where: { visit_id, used: false } });

    const token     = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + TOKEN_TTL);

    await SignatureToken.create({ token, visit_id, expires_at });

    res.json({ token, expires_at, appHost: process.env.APP_HOST || 'localhost' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/* ── GET /signature/:token  (public — page mobile) ───────────────────── */
exports.getInfo = async (req, res) => {
  try {
    const st = await SignatureToken.findOne({
      where: { token: req.params.token },
      include: [{
        model: Visit, as: 'visit',
        include: [{ model: Visitor, as: 'visitor' }],
      }],
    });

    if (!st)             return res.status(404).json({ message: 'Lien invalide' });
    if (st.used)         return res.status(410).json({ message: 'Ce lien a déjà été utilisé', used: true });
    if (new Date() > st.expires_at) return res.status(410).json({ message: 'Ce lien a expiré', expired: true });

    res.json({
      visitor_name: st.visit?.visitor?.full_name,
      purpose:      st.visit?.purpose,
      host_name:    st.visit?.host_name,
      expires_at:   st.expires_at,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/* ── POST /signature/:token/sign  (public) ───────────────────────────── */
exports.sign = async (req, res) => {
  try {
    const { signature } = req.body;
    const st = await SignatureToken.findOne({ where: { token: req.params.token } });

    if (!st)             return res.status(404).json({ message: 'Lien invalide' });
    if (st.used)         return res.status(410).json({ message: 'Ce lien a déjà été utilisé' });
    if (new Date() > st.expires_at) return res.status(410).json({ message: 'Ce lien a expiré' });

    if (!signature || typeof signature !== 'string' || !signature.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ message: 'Données de signature invalides' });
    }

    const base64Data = signature.replace(/^data:image\/png;base64,/, '');
    const buffer     = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Fichier trop volumineux (max 5 Mo)' });
    }

    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    const filename  = `sig_${st.visit_id}_${Date.now()}.png`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

    const signature_path = `uploads/signatures/${filename}`;

    await st.update({ used: true, signature_path });
    await Visit.update({ has_signature: true, signature_path }, { where: { id: st.visit_id } });

    req.io?.emit('visit:signed', { visit_id: st.visit_id });

    res.json({ message: 'Signature enregistrée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/* ── GET /signature/status/:token  (authentifié — polling PC) ────────── */
exports.getStatus = async (req, res) => {
  try {
    const st = await SignatureToken.findOne({ where: { token: req.params.token } });
    if (!st) return res.status(404).json({ message: 'Token invalide' });

    const visit = await Visit.findByPk(st.visit_id);
    res.json({
      signed:  !!visit?.has_signature,
      used:    st.used,
      expired: new Date() > st.expires_at,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
