import { DataTypes, Sequelize } from "sequelize";

/**
 * 
 * @param {Sequelize} sequelize 
 */
export default function userModel(sequelize) {

    const User = sequelize.define(
        'User',
        {
            // colonne id pas obligatoire mais cool pour la personaliser (sinon générée par default)
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                autoIncrementIdentity: true,
                primaryKey: true
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            discriminator: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: { isEmail: true },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("user", "admin"),
                defaultValue: "user",
            }
        }, {
        //! Options du model
        tableName: 'user',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['username', 'discriminator']
            }
        ]
    }
    )

    return User;
};

