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
                "id", "appId", "name", "headerImage", "libraryImage"
            ];
            const safeEventAttributes = [
                "id", "title", "description", "visibility", "status",
                "finalDate", "max_player", "event_duration"
            ];

            // 1. Récupérer tous les events
            const allEvents = await db.Event.findAll({
                attributes: [
                    ...safeEventAttributes,
                    [
                        db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM "userevent" AS ue
            WHERE ue."eventId" = "Event"."id"
          )`),
                        "participantCount"
                    ]
                ],
                include: [
                    {
                        model: db.Game,
                        attributes: safeGameAttributes,
                        through: { attributes: ["eventId"] }
                    },
                    {
                        model: db.Game,
                        as: "finalGames",
                        attributes: safeGameAttributes,
                        through: { attributes: [] }
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

            // 2. Faire le tri ici
            let participant = [];
            let invited = [];
            let publics = [];
            let privates = [];

            for (const ev of allEvents) {
                const me = ev.Users.find(u => u.id === userId);

                if (ev.visibility === "private") {
                    if (!userId || !me) {
                        continue; // je ne vois pas les privés si je n’y suis pas lié
                    }

                    if (me.UserEvent?.status === "accepted") {
                        participant.push(ev);
                    } else if (me.UserEvent?.status === "invited") {
                        invited.push(ev);
                    } else {
                        privates.push(ev);
                    }
                } else {
                    // public
                    if (me?.UserEvent?.status === "accepted") {
                        participant.push(ev);
                    } else if (me?.UserEvent?.status === "invited") {
                        invited.push(ev);
                    } else {
                        publics.push(ev);
                    }
                }
            }


            // 3. Retourner l’objet structuré
            res.json({ participant, invited, public: publics, private: privates });

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
                        model: db.Game,
                        as: "finalGames", // 🔥 ajout
                        attributes: ["id", "name", "headerImage", "libraryImage"],
                        through: { attributes: [] }
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
    },

    joinPublicEvent: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id: eventId } = req.params;

            const event = await db.Event.findByPk(eventId);
            if (!event) return res.status(404).json({ error: "Événement introuvable" });

            if (event.visibility !== "public") {
                return res.status(403).json({ error: "Cet événement n'est pas public" });
            }

            // Upsert dans UserEvent
            await db.UserEvent.upsert({
                userId,
                eventId,
                status: "accepted",
                role: "participant"
            });

            res.json({ success: true, message: "Vous avez rejoint l'événement" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    },
    updateStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        try {
            const event = await db.Event.findByPk(id);
            if (!event) {
                return res.status(404).json({ error: "Événement introuvable" });
            }

            // 👇 On met à jour le champ status
            event.status = status;
            await event.save();

            res.json({ message: "Statut mis à jour ✅", event });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur lors de la mise à jour du statut" });
        }
    },
    endEvent: async (req, res) => {
        const { id } = req.params;
        const { winnerId } = req.body;

        try {
            const event = await db.Event.findByPk(id, {
                include: [{ model: db.User, as: "Users" }]
            });
            if (!event) return res.status(404).json({ error: "Événement introuvable" });

            event.status = "finished";
            event.winnerId = winnerId || null;
            await event.save();

            res.json({ message: "Événement terminé ✅", event });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
}

export default eventController;
