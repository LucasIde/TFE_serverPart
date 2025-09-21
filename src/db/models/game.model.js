import { DataTypes, Sequelize } from "sequelize";

/**
 * @param {Sequelize} sequelize
 */
export default function gameModel(sequelize) {
  const Game = sequelize.define(
    "Game",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      appId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
        comment: "Steam AppID (identifiant unique du jeu)"
      },
      isCustom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      headerImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "https://cdn.cloudflare.steamstatic.com/steam/apps/<appId>/header.jpg"
      },
      libraryImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "https://cdn.cloudflare.steamstatic.com/steam/apps/<appId>/library_600x900.jpg"
      },
      lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "game",
      timestamps: true,
      indexes: [{ fields: ["name"] }],
    }
  );

  return Game;
}
