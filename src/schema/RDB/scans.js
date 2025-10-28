import { DataTypes } from 'sequelize';
import { sequelize } from '../../database/index.js';

const Scan = sequelize.define(
    "Scan",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        symbol: {
            type: DataTypes.STRING(100),
            allowNull: false, // e.g., "NSE_EQ|INE585B01010"
        },
        scanType: {
            type: DataTypes.STRING(50),
            allowNull: false, // e.g., "new_high", "breakout", "volume_spike"
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        extraData: {
            type: DataTypes.JSONB,
            allowNull: true, // store flexible attributes (like OHLC, volume, etc.)
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "scan",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["symbol", "scan_type", "date"],
            },
        ],
    }
);

export default Scan;