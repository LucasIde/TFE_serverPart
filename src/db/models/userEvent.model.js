import { DataTypes, Sequelize } from "sequelize";

/**
 * 
 * @param {Sequelize} sequelize 
 */
export default function userEventModel(sequelize) {

    const UserEvent = sequelize.define(
        'UserEvent',
        {
            // colonne id pas obligatoire mais cool pour la personaliser (sinon générée par default)
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                autoIncrementIdentity: true,
                primaryKey: true
            },
            status: {
                type: DataTypes.ENUM("invited", "accepted", "declined"),
                defaultValue: "invited",
            },
            role: {
                type: DataTypes.ENUM("participant", "moderator"),
                defaultValue: "participant",
            },
            score: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        }, {
        //! Options du model
        tableName: 'userEvent',
        timestamps: true
    }
    )

    return UserEvent;
};

