import db from "../db/models/index.js";
import { Op } from "sequelize";

const friendController = {
  // (1) Recherche user par username/discriminator
  searchUsers: async (req, res) => {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.length < 2) return res.json([]);

    try {
      // 1. On récupère les IDs déjà liés
      const existing = await db.UserFriend.findAll({
        where: {
          [Op.or]: [{ userId }, { friendId: userId }],
        },
        attributes: ["userId", "friendId"],
        raw: true,
      });

      const excludedIds = new Set([userId]);
      existing.forEach(f => {
        excludedIds.add(f.userId);
        excludedIds.add(f.friendId);
      });

      // 2. Recherche uniquement ceux qui ne sont PAS exclus
      const users = await db.User.findAll({
        where: {
          id: { [Op.notIn]: Array.from(excludedIds) },
          [Op.or]: [
            { username: { [Op.iLike]: `%${query}%` } },
            { discriminator: { [Op.iLike]: `%${query}%` } },
          ],
        },
        attributes: ["id", "username", "discriminator"],
        limit: 10,
      });

      return res.json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // (2) Envoyer une demande d’ami
  sendRequest: async (req, res) => {
    const userId = req.user.id; // celui qui envoie
    const { friendId } = req.params;

    if (userId === Number(friendId)) {
      return res.status(400).json({ error: "Impossible de s’ajouter soi-même" });
    }

    try {
      const [friendship, created] = await db.UserFriend.findOrCreate({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
        defaults: {
          userId,
          friendId,
          requesterId: userId,
          status: "pending",
        },
      });

      if (!created) {
        return res.status(400).json({ error: "Demande déjà existante" });
      }

      return res.json({ message: "Demande envoyée", friendship });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // (3) Accepter une demande
  acceptRequest: async (req, res) => {
    const userId = req.user.id; // celui qui accepte
    const { friendId } = req.params;

    try {
      const friendship = await db.UserFriend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
          status: "pending",
        },
      });

      if (!friendship) {
        return res.status(404).json({ error: "Demande introuvable" });
      }

      // seul le receveur peut accepter
      if (friendship.userId !== userId && friendship.friendId !== userId) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      friendship.status = "accepted";
      await friendship.save();

      return res.json({ message: "Demande acceptée", friendship });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // (4) Refuser une demande
  declineRequest: async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;

    try {
      const friendship = await db.UserFriend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
          status: "pending",
        },
      });

      if (!friendship) {
        return res.status(404).json({ error: "Demande introuvable" });
      }

      await friendship.destroy();

      return res.json({ message: "Demande refusée", friendship });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // (5) Supprimer un ami
  removeFriend: async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;

    try {
      const friendship = await db.UserFriend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
          status: "accepted",
        },
      });

      if (!friendship) {
        return res.status(404).json({ error: "Relation introuvable" });
      }

      await friendship.destroy();
      return res.json({ message: "Ami supprimé" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // (6) Lister mes amis + demandes en attente
  listFriends: async (req, res) => {
    const userId = req.user.id;

    try {
      const friendships = await db.UserFriend.findAll({
        where: {
          [Op.or]: [{ userId }, { friendId: userId }],
        },
        include: [
          { model: db.User, as: "user", attributes: ["id", "username", "discriminator"] },
          { model: db.User, as: "friend", attributes: ["id", "username", "discriminator"] },
          { model: db.User, as: "requester", attributes: ["id", "username", "discriminator"] },
        ],
      });

      const accepted = [];
      const pendingSent = [];
      const pendingReceived = [];

      for (const f of friendships) {
        const other = f.userId === userId ? f.friend : f.user;

        if (f.status === "accepted") {
          accepted.push({ id: other.id, username: other.username, discriminator: other.discriminator });
        }
        else if (f.status === "pending" && f.requesterId === userId) {
          pendingSent.push({ id: other.id, username: other.username, discriminator: other.discriminator });
        }
        else if (f.status === "pending" && f.requesterId !== userId) {
          pendingReceived.push({ id: other.id, username: other.username, discriminator: other.discriminator });
        }
      }

      return res.json({ accepted, pendingSent, pendingReceived });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export default friendController;
