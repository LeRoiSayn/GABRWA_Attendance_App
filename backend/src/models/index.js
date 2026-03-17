const sequelize = require('../config/database');
const User = require('./User');
const Visitor = require('./Visitor');
const Visit = require('./Visit');
const GateCheck = require('./GateCheck');
const ReceptionCheck = require('./ReceptionCheck');
const SignatureToken = require('./SignatureToken');

// Visitor → Visit (one-to-many)
Visitor.hasMany(Visit, { foreignKey: 'visitor_id', as: 'visits' });
Visit.belongsTo(Visitor, { foreignKey: 'visitor_id', as: 'visitor' });

// Visit → GateCheck (one-to-one)
Visit.hasOne(GateCheck, { foreignKey: 'visit_id', as: 'gateCheck' });
GateCheck.belongsTo(Visit, { foreignKey: 'visit_id', as: 'visit' });

// Visit → ReceptionCheck (one-to-one)
Visit.hasOne(ReceptionCheck, { foreignKey: 'visit_id', as: 'receptionCheck' });
ReceptionCheck.belongsTo(Visit, { foreignKey: 'visit_id', as: 'visit' });

// Visit → SignatureToken (one-to-many)
Visit.hasMany(SignatureToken, { foreignKey: 'visit_id', as: 'signatureTokens' });
SignatureToken.belongsTo(Visit, { foreignKey: 'visit_id', as: 'visit' });

module.exports = { sequelize, User, Visitor, Visit, GateCheck, ReceptionCheck, SignatureToken };
