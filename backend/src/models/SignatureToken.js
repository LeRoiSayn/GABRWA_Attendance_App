const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SignatureToken = sequelize.define('SignatureToken', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  token:          { type: DataTypes.STRING(128), unique: true, allowNull: false },
  visit_id:       { type: DataTypes.INTEGER, allowNull: false },
  expires_at:     { type: DataTypes.DATE, allowNull: false },
  used:           { type: DataTypes.BOOLEAN, defaultValue: false },
  signature_path: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'signature_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SignatureToken;
