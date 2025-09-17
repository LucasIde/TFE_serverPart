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
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            game: {
                type: DataTypes.STRING,
                allowNull: true, // tu pourras plus tard faire une vraie table Game
            }
        }, {
        //! Options du model
        tableName: 'event',
        timestamps: true
    }
    )

    return Event;
};

