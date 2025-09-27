import db from "../db/models/index.js";

const eventInviteController = {
	// Inviter un utilisateur à un event
	inviteUser: async (req, res) => {
		const userId = req.user.id; // créateur ou modérateur
		const { eventId, friendId } = req.params;

		try {
			// Vérif que l’event existe
			const event = await db.Event.findByPk(eventId, {
				include: [{ model: db.User, as: "creator", attributes: ["id"] }],
			});
			if (!event) return res.status(404).json({ error: "Événement introuvable" });

			// Vérif autorisation
			if (event.creator.id !== userId && req.user.role !== "admin") {
				return res.status(403).json({ error: "Non autorisé à inviter" });
			}

			// Vérif si déjà présent
			const existing = await db.UserEvent.findOne({
				where: { userId: friendId, eventId },
			});
			if (existing) return res.status(400).json({ error: "Déjà invité/participant" });

			// Création de l’invitation
			const invitation = await db.UserEvent.create({
				userId: friendId,
				eventId,
				status: "invited",
				role: "participant",
			});

			return res.json({ message: "Invitation envoyée", invitation });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: "Erreur serveur" });
		}
	},

	// Accepter une invitation
	acceptInvite: async (req, res) => {
		const userId = req.user.id;
		const { eventId } = req.params;

		try {
			const invite = await db.UserEvent.findOne({ where: { userId, eventId } });
			if (!invite) return res.status(404).json({ error: "Invitation introuvable" });

			invite.status = "accepted";
			await invite.save();

			return res.json({ message: "Invitation acceptée" });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: "Erreur serveur" });
		}
	},

	// Décliner une invitation
	declineInvite: async (req, res) => {
		const userId = req.user.id;
		const { eventId } = req.params;

		try {
			const invite = await db.UserEvent.findOne({ where: { userId, eventId } });
			if (!invite) return res.status(404).json({ error: "Invitation introuvable" });

			invite.status = "declined";
			await invite.save();

			return res.json({ message: "Invitation déclinée" });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: "Erreur serveur" });
		}
	},
	removeParticipant: async (req, res) => {
		const { eventId, friendId } = req.params;
		const requesterId = req.user.id;

		try {
			const event = await db.Event.findByPk(eventId, {
				include: [{ model: db.User, as: "creator", attributes: ["id"] }],
			});

			if (!event) {
				return res.status(404).json({ error: "Événement introuvable" });
			}

			// 🚫 Protection : le créateur ne peut pas se retirer
			if (Number(friendId) === event.creator.id) {
				return res.status(400).json({ error: "Le créateur ne peut pas quitter son propre événement" });
			}

			// ⚡ Autorisations :
			const isCreator = event.creator.id === requesterId;
			const isAdmin = req.user.role === "admin";
			const isSelf = Number(requesterId) === Number(friendId);

			if (!isCreator && !isAdmin && !isSelf) {
				return res.status(403).json({ error: "Non autorisé à retirer ce participant" });
			}

			// 🔎 Vérifie la participation
			const participation = await db.UserEvent.findOne({
				where: { userId: friendId, eventId },
			});

			if (!participation) {
				return res.status(404).json({ error: "Participant introuvable" });
			}

			await participation.destroy();

			return res.json({
				message: isSelf
					? "Vous avez quitté l'événement"
					: "Participant supprimé"
			});
		} catch (err) {
			console.error("❌ Erreur removeParticipant:", err);
			return res.status(500).json({ error: "Erreur serveur" });
		}
	}

};

export default eventInviteController;
