import { DataTypes } from "sequelize";
import { sequelize } from '../../database/index.js';

const ChartLayout = sequelize.define("ChartLayout", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT, // Storing JSON as text
        allowNull: false,
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    resolution: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.BIGINT, // TV sends timestamp as number
        allowNull: false,
    },
    client_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: "chart_layouts",
    timestamps: true,
});

export default ChartLayout;
