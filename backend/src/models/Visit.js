const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Visit = sequelize.define('Visit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  visitor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'visitors', key: 'id' },
  },
  visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  host_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'inside', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  has_signature:  { type: DataTypes.BOOLEAN, defaultValue: false },
  signature_path: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'visits',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Visit;
