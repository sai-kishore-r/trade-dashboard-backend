import { DataTypes } from "sequelize";
import { sequelize } from '../../database/index.js';

const UpstoxToken = sequelize.define("UpstoxToken", {
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  issuedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: "upstoxs_token", 
  timestamps: false,
});

export default UpstoxToken;
