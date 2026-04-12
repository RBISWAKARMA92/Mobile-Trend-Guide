import { Router } from "express";

const router = Router();

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function mapTrack(t: any) {
  return {
    id: t.id,
    name: t.name,
    artists: t.artists.map((a: any) => a.name).join(", "),
    album: t.album?.name ?? "",
    image: t.album?.images?.[0]?.url ?? null,
    preview_url: t.preview_url ?? null,
    spotify_url: t.external_urls?.spotify ?? null,
    duration_ms: t.duration_ms ?? 0,
  };
}

router.get("/spotify/search", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q) return res.status(400).json({ error: "Query required" });
    const token = await getSpotifyToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=20&market=IN`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Spotify search failed: ${r.status}`);
    const data = await r.json() as any;
    res.json({ tracks: data.tracks.items.map(mapTrack) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/spotify/featured", async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const queries = ["bollywood hits 2024", "top hindi songs", "indian pop hits"];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=20&market=IN`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Spotify featured failed: ${r.status}`);
    const data = await r.json() as any;
    res.json({ tracks: data.tracks.items.map(mapTrack) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
