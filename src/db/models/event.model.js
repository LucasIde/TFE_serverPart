import { DataTypes, Sequelize } from "sequelize";

/**
 *
 * @param {Sequelize} sequelize
 */
export default function eventModel(sequelize) {

    const Event = sequelize.define(
        'Event',
        {
            // colonne id pas obligatoire mais cool pour la personaliser (sinon générée par default)
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                autoIncrementIdentity: true,
                primaryKey: true
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
            },
            visibility: {
                type: DataTypes.ENUM("public", "private", "friends"),
                defaultValue: "public",
            },
            status: {
                type: DataTypes.ENUM("pending", "planned", "finished"),
                defaultValue: "pending",
            },
            finalDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        }, {
        tableName: 'event',
        timestamps: true
    }
    )

    return Event;
};

