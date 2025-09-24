import db from "../db/models/index.js";
import { Op } from "sequelize";

const eventVoteController = {
  upsertVotes: async (req, res) => {
    const userId = req.user?.id;
    const { eventId } = req.params;
    let { gameIds = [], dateIds = [] } = req.body;

    try {
      if (!userId) return res.status(401).json({ error: "Non authentifié" });

      // Normalisation + dédoublonnage + typage number
      const uniq = (arr) => [...new Set((arr || []).map(Number))];
      gameIds = uniq(gameIds);
      dateIds = uniq(dateIds);

      // Règles de base
      if (gameIds.length > 3 || dateIds.length > 3) {
        return res.status(400).json({ error: "Max 3 jeux et 3 dates." });
      }

      // Charge l'event avec les jeux/dates disponibles
      const event = await db.Event.findByPk(eventId, {
        attributes: ["id", "votesClosed"],
        include: [
          { model: db.Game, attributes: ["id"] },
          { model: db.Date, attributes: ["id"] }, // EventDate
        ],
      });
      if (!event) {
        return res.status(404).json({ error: "Événement introuvable" });
      }
      if (event.votesClosed) {
        return res.status(403).json({ error: "Votes clôturés pour cet événement" });
      }

      // Vérifie que l'utilisateur participe à l'event
      const userEvent = await db.UserEvent.findOne({
        where: { userId, eventId: event.id },
        attributes: ["id", "status", "role"],
      });
      if (!userEvent) {
        return res.status(403).json({ error: "Vous n’êtes pas inscrit à cet événement" });
      }

      // Valide que les IDs envoyés appartiennent à l’event
      const allowedGameIds = new Set(event.Games.map(g => Number(g.id)));
      const allowedDateIds = new Set((event.EventDates ?? []).map(d => Number(d.id)));

      const badGame = gameIds.find(id => !allowedGameIds.has(id));
      const badDate = dateIds.find(id => !allowedDateIds.has(id));
      if (badGame != null) {
        return res.status(400).json({ error: `Jeu ${badGame} n’appartient pas à cet event` });
      }
      if (badDate != null) {
        return res.status(400).json({ error: `Date ${badDate} n’appartient pas à cet event` });
      }

      // Transaction : on remplace
      await db.sequelize.transaction(async (t) => {
        await db.UserEventGameVote.destroy({
          where: { userEventId: userEvent.id },
          transaction: t,
        });
        await db.UserEventDateVote.destroy({
          where: { userEventId: userEvent.id },
          transaction: t,
        });

        if (gameIds.length) {
          await db.UserEventGameVote.bulkCreate(
            gameIds.map(gameId => ({ userEventId: userEvent.id, gameId })),
            { transaction: t, ignoreDuplicates: true }
          );
        }
        if (dateIds.length) {
          await db.UserEventDateVote.bulkCreate(
            dateIds.map(dateId => ({ userEventId: userEvent.id, dateId })),
            { transaction: t, ignoreDuplicates: true }
          );
        }
      });

      return res.status(200).json({
        message: "Votes enregistrés",
        data: { gameIds, dateIds }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
  getMyVotes: async (req, res) => {
    const userId = req.user?.id;
    const { eventId } = req.params;
    try {
      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Trouver le UserEvent du joueur
      const userEvent = await db.UserEvent.findOne({
        where: { userId, eventId },
        attributes: ["id"],
      });
      if (!userEvent) {
        return res.status(403).json({ error: "Vous n'êtes pas inscrit à cet événement" });
      }

      // Charger ses votes
      const [gameVotes, dateVotes] = await Promise.all([
        db.UserEventGameVote.findAll({
          where: { userEventId: userEvent.id },
          attributes: ["gameId"],
        }),
        db.UserEventDateVote.findAll({
          where: { userEventId: userEvent.id },
          attributes: ["dateId"],
        }),
      ]);

      return res.json({
        gameIds: gameVotes.map(v => v.gameId),
        dateIds: dateVotes.map(v => v.dateId),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
  getVotesSummary: async (req, res) => {
    const { id: eventId } = req.params;

    try {
      // Vérifier que l’event existe
      const event = await db.Event.findByPk(eventId, {
        attributes: ["id"],
        include: [
          { model: db.Game, attributes: ["id", "name"] },
          { model: db.Date, attributes: ["id", "date"] }
        ]
      });
      if (!event) {
        return res.status(404).json({ error: "Événement introuvable" });
      }

      // Votes jeux
      const gameVotes = await db.UserEventGameVote.findAll({
        include: [{
          model: db.UserEvent,
          where: { eventId },
          attributes: [], // on ne veut pas ramener les colonnes UserEvent
        }],
        attributes: [
          "gameId",
          [db.sequelize.fn("COUNT", db.sequelize.col("gameId")), "voteCount"]
        ],
        group: ["gameId"],
        raw: true,
      });

      // Votes dates
      const dateVotes = await db.UserEventDateVote.findAll({
        include: [{
          model: db.UserEvent,
          where: { eventId },
          attributes: [],
        }],
        attributes: [
          "dateId",
          [db.sequelize.fn("COUNT", db.sequelize.col("dateId")), "voteCount"]
        ],
        group: ["dateId"],
        raw: true,
      });


      // Mise en forme : rattacher le nom du jeu et la date
      const games = (event.Games).map(g => ({
        id: g.id,
        name: g.name,
        votes: Number(gameVotes.find(v => v.gameId === g.id)?.voteCount || 0),
      }));

      const dates = (event.EventDates || []).map(d => ({
        id: d.id,
        date: d.date,
        votes: Number(dateVotes.find(v => v.dateId === d.id)?.voteCount || 0),
      }));

      return res.json({ games, dates });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
  closeVotes: async (req, res) => {
    const userId = req.user?.id;
    const { id: eventId } = req.params;

    try {
      // Vérifier que l’utilisateur est le créateur ou admin
      const event = await db.Event.findByPk(eventId, {
        include: [{ model: db.User, as: "creator", attributes: ["id"] }]
      });
      if (!event) return res.status(404).json({ error: "Événement introuvable" });

      if (event.creator.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Non autorisé" });
      }

      event.votesClosed = true;
      await event.save();

      return res.json({ message: "Votes clôturés", votesClosed: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
  setFinalChoices: async (req, res) => {
    const userId = req.user?.id;
    const { id: eventId } = req.params;
    const { finalDateId, finalGameIds = [] } = req.body;

    try {
      const event = await db.Event.findByPk(eventId, {
        include: [
          { model: db.User, as: "creator", attributes: ["id"] },
          { model: db.Date, as: "EventDates", attributes: ["id", "date"] },
          { model: db.Game, attributes: ["id", "name"] }
        ]
      });
      if (!event) return res.status(404).json({ error: "Événement introuvable" });

      if (event.creator.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Non autorisé" });
      }

      if (!event.votesClosed) {
        return res.status(400).json({ error: "Impossible de définir les choix tant que les votes sont ouverts" });
      }

      // Vérifier que la date choisie appartient à l’event
      if (finalDateId) {
        const selectedDate = event.EventDates.find(d => d.id == finalDateId);
        if (!selectedDate) {
          return res.status(400).json({ error: "Date invalide" });
        }
        event.finalDate = selectedDate.date;
      }

      await db.sequelize.transaction(async (t) => {
        await event.save({ transaction: t });

        // Nettoyer les anciens jeux finaux
        await db.EventFinalGame.destroy({
          where: { eventId: event.id },
          transaction: t,
        });

        if (finalGameIds.length) {
          // Vérifier que tous les jeux appartiennent bien à l’event
          console.log(event);
          const allowedGameIds = new Set(event.Games.map(g => Number(g.id)));
          const invalidGame = finalGameIds.find(id => !allowedGameIds.has(Number(id)));
          if (invalidGame) {
            throw new Error(`Jeu ${invalidGame} non valide pour cet event`);
          }

          // Enregistrer les jeux finaux
          await db.EventFinalGame.bulkCreate(
            finalGameIds.map(gameId => ({ eventId: event.id, gameId })),
            { transaction: t }
          );
        }
      });

      return res.json({ message: "Choix finaux définis" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

export default eventVoteController;
