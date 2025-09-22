import { Op } from "sequelize";
import db from "../db/models/index.js";

const gameController = {
	getByName: async (req, res) => {
		try {
			const {query , excludedId} = req.query;
			if (!query || query.length < 2) {
				return res.json([]); // renvoyer vide
			}

			const excluded = (excludedId) ? excludedId.split(",").map(x => parseInt(x, 10))  : [];
			const games = await db.Game.findAll({
				where: {
					name: { [Op.iLike]: `%${query}%` }, // Postgres
					id: { [Op.notIn]: excluded }
				},
				limit: 10,
				attributes: ["id", "appId", "name", "headerImage", "libraryImage"]
			});

			res.json(games);
		}
		catch (err) {
			console.error("❌ Erreur recherche jeu:", err);
			res.status(500).json({ error: "Erreur serveur lors de la recherche de jeux" });
		}
	},

	add: async (req, res) => {
		const { name, isCustom } = req.body;
		try {
			// protection db mauvais name
			if (!name || name.trim().length < 2) {
				return res.status(400).json({ error: "Invalid game name" });
			}

			const exists = await db.Game.findOne({ where: {name} });
			if (exists) {
				return res.status(200).json({
					message: "Game already exists",
					game: exists.toJSON()
				});
			}

			const newGame = await db.Game.create({
				name: name.trim(),
				isCustom: true,
				appId: null,
				headerImage: null,
				libraryImage: null,
				lastUpdated: new Date()
			})
			return res.status(201).json({
				message: "Game successfully added",
				game: newGame.toJSON()
			});
		}
		catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

}

export default gameController;
