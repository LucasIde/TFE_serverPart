import { DataTypes, Sequelize } from "sequelize";

export default function userEventGameVoteModel(sequelize) {
  const UserEventGameVote = sequelize.define("UserEventGameVote", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    }
  }, {
    tableName: "usereventgamevote",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userEventId", "gameId"] },
    ],
  });

  return UserEventGameVote;
}
