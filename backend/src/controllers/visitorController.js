const { Op } = require('sequelize');
const { Visitor, Visit, GateCheck, ReceptionCheck } = require('../models');

/* GET /visitors?q=...&page=1 */
exports.listAll = async (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    const limit  = 50;
    const offset = (parseInt(page) - 1) * limit;
    const where  = q ? {
      [Op.or]: [
        { full_name: { [Op.iLike]: `%${q}%` } },
        { phone:     { [Op.iLike]: `%${q}%` } },
        { email:     { [Op.iLike]: `%${q}%` } },
      ],
    } : {};

    const { count, rows } = await Visitor.findAndCountAll({
      where,
      include: [{ model: Visit, as: 'visits', attributes: ['id', 'visit_date', 'status', 'has_signature'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const visitors = rows.map((v) => {
      const json    = v.toJSON();
      const sorted  = [...json.visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
      return {
        ...json,
        visit_count:   json.visits.length,
        last_visit:    sorted[0]?.visit_date || null,
        has_signature: json.visits.some((vi) => vi.has_signature),
      };
    });

    res.json({ visitors, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { full_name, phone, email, passport_number, visitor_number, address } = req.body;
    const visitor = await Visitor.create({ full_name, phone, email: email || null, passport_number, visitor_number, address });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.search = async (req, res) => {
  try {
    const { name, phone, email } = req.query;
    const where = {};
    if (name) where.full_name = { [Op.iLike]: `%${name}%` };
    if (phone) where.phone = { [Op.iLike]: `%${phone}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (!name && !phone && !email) {
      return res.status(400).json({ message: 'Au moins un critère de recherche est requis' });
    }
    const visitors = await Visitor.findAll({
      where,
      include: [{ model: Visit, as: 'visits', limit: 5, order: [['created_at', 'DESC']] }],
      limit: 20,
    });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const visitor = await Visitor.findByPk(req.params.id, {
      include: [{
        model: Visit, as: 'visits',
        include: [
          { model: GateCheck, as: 'gateCheck' },
          { model: ReceptionCheck, as: 'receptionCheck' },
        ],
        order: [['created_at', 'DESC']],
      }],
    });
    if (!visitor) return res.status(404).json({ message: 'Visiteur non trouvé' });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const visitor = await Visitor.findByPk(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visiteur non trouvé' });
    const { full_name, phone, email, passport_number, visitor_number, address } = req.body;
    await visitor.update({ full_name, phone, email: email || null, passport_number, visitor_number, address });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
