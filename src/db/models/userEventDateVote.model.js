import { DataTypes, Sequelize } from "sequelize";

export default function userEventDateVoteModel(sequelize) {
  const UserEventDateVote = sequelize.define("UserEventDateVote", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    }
  }, {
    tableName: "usereventdatevote",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userEventId", "dateId"] },
    ],
  });

  return UserEventDateVote;
}
