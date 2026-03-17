const { Visit, Visitor, GateCheck, ReceptionCheck } = require('../models');

exports.create = async (req, res) => {
  try {
    const { visitor_id, purpose, host_name, visit_date } = req.body;
    const visitor = await Visitor.findByPk(visitor_id);
    if (!visitor) return res.status(404).json({ message: 'Visiteur non trouvé' });
    const visit = await Visit.create({
      visitor_id,
      purpose,
      host_name,
      visit_date: visit_date || new Date(),
      status: 'pending',
    });
    const full = await Visit.findByPk(visit.id, {
      include: [{ model: Visitor, as: 'visitor' }],
    });
    req.io?.emit('visit:new', full);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getActive = async (req, res) => {
  try {
    const visits = await Visit.findAll({
      where: { status: ['pending', 'inside'] },
      include: [
        { model: Visitor, as: 'visitor' },
        { model: GateCheck, as: 'gateCheck' },
        { model: ReceptionCheck, as: 'receptionCheck' },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
