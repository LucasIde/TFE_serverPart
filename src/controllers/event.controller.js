import db from "../db/models/index.js";

const eventController = {
    add: async (req, res) => {
        const t = await db.sequelize.transaction();
        try {
            const { title, description, visibility, max_player, dates, games, event_duration } = req.body;

            // Vérif minimale
            if (!title || !visibility || !max_player || !event_duration || !Array.isArray(dates) || !Array.isArray(games)) {
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
                    event_duration,
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

    getAllById: async (req, res) => {
        try {
            const userId = req.user?.id;
            const safeUserAttributes = ["id", "username", "discriminator", "role"];
            const safeGameAttributes = [
                "id",
                "appId",
                "name",
                "headerImage",
                "libraryImage",
            ];
            const safeEventAttributes = [
                "id",
                "title",
                "description",
                "visibility",
                "status",
                "finalDate",
                "max_player",
                "event_duration"
            ];

            // 1. Events publics visibles par tout le monde
            const publicEvents = await db.Event.findAll({
                where: { visibility: "public" },
                attributes: safeEventAttributes,
                include: [
                    {
                        model: db.Game,
                        attributes: safeGameAttributes,
                        through: { attributes: ["eventId"] } // 👈 EventGame réduit
                    },
                    {
                        model: db.User,
                        attributes: safeUserAttributes,
                        through: { attributes: ["status", "role", "score"] }
                    },
                    { model: db.User, as: "creator", attributes: safeUserAttributes },
                    { model: db.User, as: "winner", attributes: safeUserAttributes }
                ]
            });

            // 2. Events privés → seulement si user connecté
            let privateEvents = [];
            if (userId) {
                privateEvents = await db.Event.findAll({
                    where: { visibility: "private" },
                    attributes: safeEventAttributes,
                    include: [
                        {
                            model: db.User,
                            where: { id: userId }, // on garde seulement ceux où user est lié
                            through: { attributes: [] } // pas besoin de dupliquer ici
                        },
                        {
                            model: db.Game,
                            attributes: safeGameAttributes,
                            through: { attributes: ["eventId"] } // 👈 EventGame réduit
                        },
                        {
                            model: db.User,
                            attributes: safeUserAttributes,
                            through: { attributes: ["status", "role", "score"] }
                        },
                        { model: db.User, as: "creator", attributes: safeUserAttributes },
                        { model: db.User, as: "winner", attributes: safeUserAttributes }
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
    },

    getEventById: async (req, res) => {
        try {
            const userId = req.user?.id;
            const eventId = req.params.id;
            const safeUserAttributes = ["id", "username", "discriminator", "role"];

            // On cherche l'event
            const event = await db.Event.findByPk(eventId, {
                include: [
                    {
                        model: db.Date,
                        separate: true,
                        order: [["date", "ASC"]],
                    },
                    { model: db.Game },
                    {
                        model: db.User,
                        attributes: safeUserAttributes,
                        through: { attributes: ["status", "role", "score"] }
                    },
                    { model: db.User, as: "creator", attributes: safeUserAttributes },
                    { model: db.User, as: "winner", attributes: safeUserAttributes }
                ]
            });

            if (!event) {
                return res.status(404).json({ error: "Événement introuvable" });
            }

            // Vérification d'accès en fonction de la visibilité
            if (event.visibility === "public") {
                return res.json(event);
            }

            if (event.visibility === "private") {
                if (!userId) {
                    return res.status(403).json({ error: "Accès refusé : privé" });
                }

                // const participation = await db.UserEvent.findOne({
                //     where: { userId, eventId }
                // });

                // if (!participation) {
                //     return res.status(403).json({ error: "Accès refusé : vous n’êtes pas inscrit" });
                // }

                return res.json(event);
            }

            // if (event.visibility === "friends") {
            //     return res.status(501).json({ error: "Accès 'friends' non implémenté" });
            // }

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
}

export default eventController;