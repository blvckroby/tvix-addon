const express = require("express");
const axios = require("axios");
const baseManifest = require("./manifest-base.json");

const app = express();
const PORT = process.env.PORT || 7860;

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Servire la pagina HTML
app.use(express.static("public"));

// BASE TVIX
const TVIX_BASE =
  "https://9aa032f52161-tvix.baby-beamup.club/eyJtZWRpYWZsb3dNYXN0ZXIiOnRydWUsIm1lZGlhRmxvd1Byb3h5VXJsIjoiaHR0cHM6Ly9ibHZja3JvYnktbXVzaWN0aHJlZS5oZi5zcGFjZS8iLCJtZWRpYUZsb3dQcm94eVBhc3N3b3JkIjoiU2NhdG9yY2hpYTchIiwiZHZyRW5hYmxlZCI6ZmFsc2UsImRpc2FibGVMaXZlVHYiOmZhbHNlLCJ2YXZvb05vTWZwRW5hYmxlZCI6dHJ1ZX0=";

// Mappa cataloghi → generi TVIX
const catalogMap = {
  rai: "RAI",
  mediaset: "Mediaset",
  sky: "Sky",
  sport: "Sport",
  cinema: "Cinema",
  documentari: "Documentari",
  discovery: "Discovery",
  notizia: "Novità",
  generali: "Generali",
  bambini: "Bambini",
  pluto: "Pluto"
};

// MANIFEST DINAMICO
app.get("/manifest.json", (req, res) => {
  const selected = (req.query.catalogs || "")
    .split(",")
    .map(c => c.trim())
    .filter(Boolean);

  const catalogs = selected.map(c => ({
    type: "tv",
    id: c,
    name: `${c.charAt(0).toUpperCase() + c.slice(1)} TVIX`
  }));

  const manifest = {
    ...baseManifest,
    catalogs
  };

  res.json(manifest);
});

// CATALOGO DINAMICO
app.get("/catalog/tv/:catalogId.json", async (req, res) => {
  const id = req.params.catalogId;

  if (!catalogMap[id]) return res.json({ metas: [] });

  const url = `${TVIX_BASE}/catalog/tv/streamvix_tv.json?genre=${catalogMap[id]}`;

  try {
    const remote = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const metas = remote.data.metas.map(meta => ({
      id: meta.id,
      type: "tv",
      name: meta.name,
      poster: meta.poster,
      description: meta.description
    }));

    res.json({ metas });
  } catch (err) {
    res.json({ metas: [] });
  }
});

// STREAM
app.get("/stream/tv/:id.json", async (req, res) => {
  try {
    const url = `${TVIX_BASE}/stream/tv/${req.params.id}.json`;
    const remote = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    res.json(remote.data);
  } catch (err) {
    res.json({ streams: [] });
  }
});

// AVVIO
app.listen(PORT, () => {
  console.log(`Addon attivo su http://127.0.0.1:${PORT}`);
  console.log(`Configura cataloghi su https://blvckroby-tvix-addon.hf.space/config.html`);
});
