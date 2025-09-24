import {Sequelize} from "sequelize";
import userModel from "./user.model.js";
import eventModel from "./event.model.js";
import userEventModel from "./userEvent.model.js";
import gameModel from "./game.model.js";
import eventDateModel from "./dateModel.js";
import userEventDateVoteModel from "./userEventDateVote.model.js";
import userEventGameVoteModel from "./userEventGameVote.model.js";
import eventFinalGameModel from "./eventFinalGame.model.js";

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
db.EventFinalGame = eventFinalGameModel(sequelize);
db.UserEventGameVote = userEventGameVoteModel(sequelize);
db.UserEventDateVote = userEventDateVoteModel(sequelize);

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

// event final game
db.Event.belongsToMany(db.Game, {
  through: db.EventFinalGame,
  foreignKey: "eventId",
  otherKey: "gameId",
  as: "finalGames"
});
db.Game.belongsToMany(db.Event, {
  through: db.EventFinalGame,
  foreignKey: "gameId",
  otherKey: "eventId",
  as: "eventsFinal"
});

// gameVote
db.UserEvent.belongsToMany(db.Game, {
  through: db.UserEventGameVote,
  foreignKey: "userEventId",
  otherKey: "gameId",
  as: "gameVotes"
});
db.Game.belongsToMany(db.UserEvent, {
  through: db.UserEventGameVote,
  foreignKey: "gameId",
  otherKey: "userEventId",
  as: "votedByUserEvents"
});

// date Vote
db.UserEvent.belongsToMany(db.Date, {
  through: db.UserEventDateVote,
  foreignKey: "userEventId",
  otherKey: "dateId",
  as: "dateVotes"
});
db.Date.belongsToMany(db.UserEvent, {
  through: db.UserEventDateVote,
  foreignKey: "dateId",
  otherKey: "userEventId",
  as: "votedByUserEvents"
});

db.UserEventGameVote.belongsTo(db.UserEvent, { foreignKey: "userEventId" });
db.UserEventDateVote.belongsTo(db.UserEvent, { foreignKey: "userEventId" });


export default db;
