import {Sequelize} from "sequelize";
import userModel from "./user.model.js";
import eventModel from "./event.model.js";
import userEventModel from "./userEvent.model.js";

const { DB_DATABASE, DB_USER, DB_PASSWORD, DB_SERVER, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    host: DB_SERVER,
    port: DB_PORT,
    dialect: 'postgres'
})

// Obj DB
const db = {};
export default db;

// Instance sequelize
db.sequelize = sequelize;


db.User = userModel(sequelize);
db.Event = eventModel(sequelize);
db.UserEvent = userEventModel(sequelize);

// Un User peut créer plusieurs Events
db.User.hasMany(db.Event, { foreignKey: "createdBy" });
db.Event.belongsTo(db.User, { as: "creator", foreignKey: "createdBy" });

// Relation N–N via UserEvent (participation aux events)
db.User.belongsToMany(db.Event, { through: UserEvent });
db.Event.belongsToMany(db.User, { through: UserEvent });

// doit faire des modif

export { User, Event, UserEvent };