import db from "../db/models/index.js";

const eventController = {
    add: async (req, res) => {
        const t = await db.sequelize.transaction();
        try {
            const { title, description, visibility, max_player, dates, games } = req.body;

            // Vérif minimale
            if (!title || !visibility || !max_player || !Array.isArray(dates) || !Array.isArray(games)) {
                return res.status(400).json({ error: "Données manquantes ou invalides." });
            }

            // récupération id
            if (!req.user?.id) {
                return res.status(401).json({ error: "Token invalide" });
            }
            const creatorId = req.user.id;

            // Créer l'event
            const event = await db.Event.create(
                {
                    title,
                    description,
                    visibility,
                    max_player,
                    status: "pending",
                    finalDate: null,
                    creatorId,
                },
                { transaction: t }
            );

            // Ajouter les dates
            if (dates.length > 0) {
                const eventDates = dates.map((d) => ({
                    date: d,
                    eventId: event.id,
                }));
                await db.Date.bulkCreate(eventDates, { transaction: t });
            }

            // Associer les jeux
            if (games.length > 0) {
                await event.addGames(games.map(g => g.id), { transaction: t });
            }

            // Ajouter UserEvent pour le créateur
            await db.UserEvent.create(
                {
                    userId: creatorId,
                    eventId: event.id,
                    status: "accepted",
                    role: "moderator",
                },
                { transaction: t }
            );

            await t.commit();
            return res.status(201).json({ message: "Événement créé", event });
        } catch (err) {
            await t.rollback();
            console.error(err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const userId = req.user?.id;

            // 1. Events publics visibles par tout le monde
            const publicEvents = await db.Event.findAll({
                where: { visibility: "public" },
                include: [
                    { model: db.Date },
                    { model: db.Game },
                    {
                        model: db.User,
                        through: { attributes: ["status", "role", "score"] }
                    },
                    { model: db.User, as: "creator" },
                    { model: db.User, as: "winner" }
                ]
            });

            // 2. Events privés → seulement si user connecté
            let privateEvents = [];
            if (userId) {
                privateEvents = await db.Event.findAll({
                    where: { visibility: "private" },
                    include: [
                        {
                            model: db.User,
                            where: { id: userId }, // on garde seulement ceux où user est lié
                            through: { attributes: [] } // pas besoin de dupliquer ici
                        },
                        { model: db.Date },
                        { model: db.Game },
                        {
                            model: db.User,
                            through: { attributes: ["status", "role", "score"] }
                        },
                        { model: db.User, as: "creator" },
                        { model: db.User, as: "winner" }
                    ]
                });
            }

            // 3. Renvoyer sous forme d'objet séparé
            res.json({
                public: publicEvents,
                private: privateEvents
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
}

export default eventController;