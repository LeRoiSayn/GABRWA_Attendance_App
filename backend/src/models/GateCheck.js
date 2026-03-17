const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GateCheck = sequelize.define('GateCheck', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  visit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'visits', key: 'id' },
  },
  gate_checkin_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  gate_checkout_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  officer_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'gate_checks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = GateCheck;
