import { DataTypes, Sequelize } from "sequelize";

/**
 *
 * @param {Sequelize} sequelize
 */
export default function eventDateModel(sequelize) {

  const EventDate = sequelize.define(
    "EventDate",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "eventdate",
      timestamps: true,
    }
  )
  return EventDate;
};
