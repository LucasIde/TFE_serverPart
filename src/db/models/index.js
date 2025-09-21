import {Sequelize} from "sequelize";
import userModel from "./user.model.js";
import eventModel from "./event.model.js";
import userEventModel from "./userEvent.model.js";
import gameModel from "./game.model.js";

const { DB_DATABASE, DB_USER, DB_PASSWORD, DB_SERVER, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    host: DB_SERVER,
    port: DB_PORT,
    dialect: 'postgres'
})

// Obj DB
const db = {};

// Instance sequelize
db.sequelize = sequelize;


db.User = userModel(sequelize);
db.Event = eventModel(sequelize);
db.UserEvent = userEventModel(sequelize);
db.Game = gameModel(sequelize);

// Un User peut créer plusieurs Events
db.User.hasMany(db.Event, { foreignKey: "createdBy" });
db.Event.belongsTo(db.User, { as: "creator", foreignKey: "createdBy" });

// Relation N–N via UserEvent (participation aux events)
db.User.belongsToMany(db.Event, { through: db.UserEvent, foreignKey: "userId" });
db.Event.belongsToMany(db.User, { through: db.UserEvent, foreignKey: "eventId" });

// Relation N–N via EventGame (jeux à l'event)
db.Event.belongsToMany(db.Game, {through: "EventGame", foreignKey: "eventId", otherKey: "gameId"});
db.Game.belongsToMany(db.Event, {through: "EventGame", foreignKey: "gameId", otherKey: "eventId"});

export default db;
