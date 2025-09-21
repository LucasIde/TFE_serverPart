import {Sequelize} from "sequelize";
import userModel from "./user.model.js";
import eventModel from "./event.model.js";
import userEventModel from "./userEvent.model.js";
import gameModel from "./game.model.js";
import eventDateModel from "./dateModel.js";

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
db.Date = eventDateModel(sequelize);

// Un User peut créer plusieurs Events
db.User.hasMany(db.Event, { foreignKey: "creatorId", as: "createdEvents" });
db.Event.belongsTo(db.User, { as: "creator", foreignKey: "creatorId" });

// --- Gagnant de l’event ---
db.User.hasMany(db.Event, { foreignKey: "winnerId", as: "wonEvents" });
db.Event.belongsTo(db.User, { as: "winner", foreignKey: "winnerId" });

// Relation N–N via UserEvent (participation aux events)
db.User.belongsToMany(db.Event, { through: db.UserEvent, foreignKey: "userId" });
db.Event.belongsToMany(db.User, { through: db.UserEvent, foreignKey: "eventId" });

// Relation N–N via EventGame (jeux à l'event)
db.Event.belongsToMany(db.Game, {through: "EventGame", foreignKey: "eventId", otherKey: "gameId"});
db.Game.belongsToMany(db.Event, {through: "EventGame", foreignKey: "gameId", otherKey: "eventId"});

// --- Dates proposées (1-N) ---
db.Event.hasMany(db.Date, { foreignKey: "eventId" });
db.Date.belongsTo(db.Event, { foreignKey: "eventId" });

export default db;
