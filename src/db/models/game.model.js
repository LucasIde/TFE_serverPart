import { DataTypes, Sequelize } from "sequelize";

export default function gameModel(sequelize) {
    const Game = sequelize.define('Game', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    })
    return Game;
}