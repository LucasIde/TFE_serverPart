// models/userFriend.model.js
import { DataTypes } from "sequelize";

export default function userFriendModel(sequelize) {
  const UserFriend = sequelize.define("UserFriend", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined", "blocked"),
      allowNull: false,
      defaultValue: "pending",
    },
    requesterId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  }, {
    tableName: "userfriend",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId", "friendId"] }, // 🔥 empêche les doublons
    ],
  });

  return UserFriend;
}
