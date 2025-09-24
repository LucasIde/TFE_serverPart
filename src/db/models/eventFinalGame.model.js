import { DataTypes, Sequelize } from "sequelize";

export default function eventFinalGameModel(sequelize) {
  const EventFinalGame = sequelize.define("EventFinalGame", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    }
  }, {
    tableName: "eventfinalgame",
    timestamps: true,
  });

  return EventFinalGame;
}