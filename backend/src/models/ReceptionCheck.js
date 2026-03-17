const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReceptionCheck = sequelize.define('ReceptionCheck', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  visit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'visits', key: 'id' },
  },
  reception_checkin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reception_checkout: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  receptionist_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reception_checks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ReceptionCheck;
