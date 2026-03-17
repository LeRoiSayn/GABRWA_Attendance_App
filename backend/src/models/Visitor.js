const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Visitor = sequelize.define('Visitor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { len: [2, 255] },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { is: /^[+\d\s\-()]{6,20}$/ },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isEmail: true },
  },
  passport_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '',
  },
  visitor_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'visitors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Visitor;
