import db from "../db/models/index.js";

const statsController = {
  getStats: async (req, res) => {
    try {
      const eventCount = await db.Event.count();
      const userCount = await db.User.count();

      return res.json({ eventCount, userCount });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export default statsController;
