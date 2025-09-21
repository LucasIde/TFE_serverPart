import db from "../db/models/index.js";

const BANNED_KEYWORDS = ["trailer", "season pass", "soundtrack", "dlc", "pack", "demo", "sex", "porn", "hentai", "nudity", "adult", "harem", "furry", "femboy", "wallpapers", "patch"];

async function seedGames() {
  try {
    await db.sequelize.authenticate();
    console.log("✅ DB connectée");
    const res = await fetch("https://api.steampowered.com/ISteamApps/GetAppList/v2/");
    const data = await res.json();
    const games = data.applist.apps;

    console.log(`📥 Récupéré ${games.length} jeux depuis Steam`);

    // Filtrage basique par mot-clé
    const filteredGames = games.filter(g => {
      const lower = g.name.toLowerCase();
      return !BANNED_KEYWORDS.some(kw => lower.includes(kw));
    });

    console.log(`✅ ${filteredGames.length} jeux après filtrage`);

    for (const g of filteredGames) {
      await db.Game.upsert({
        appId: g.appid,
        name: g.name,
        headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
        libraryImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
        lastUpdated: new Date()
      });
    }

    console.log("🎉 Seed terminé avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors du seed:", err);
    process.exit(1);
  }
}

seedGames();
