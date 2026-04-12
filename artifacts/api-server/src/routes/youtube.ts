import { Router } from "express";

const router = Router();

function mapVideo(item: any) {
  const id = item.id?.videoId ?? item.id;
  const snippet = item.snippet;
  return {
    id: typeof id === "string" ? id : id?.videoId ?? "",
    title: snippet?.title ?? "Unknown",
    channel: snippet?.channelTitle ?? "",
    thumbnail: snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.default?.url ?? null,
    publishedAt: snippet?.publishedAt ?? null,
    youtube_url: `https://www.youtube.com/watch?v=${typeof id === "string" ? id : id?.videoId}`,
    ytmusic_url: `https://music.youtube.com/watch?v=${typeof id === "string" ? id : id?.videoId}`,
  };
}

router.get("/youtube/search", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) { res.status(503).json({ error: "YouTube API not configured" }); return; }
    const q = (req.query.q as string)?.trim();
    if (!q) { res.status(400).json({ error: "Query required" }); return; }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&regionCode=IN&maxResults=20&q=${encodeURIComponent(q)}&key=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json() as any;
      throw new Error(err?.error?.message ?? `YouTube API error: ${r.status}`);
    }
    const data = await r.json() as any;
    res.json({ videos: data.items.map(mapVideo) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/youtube/trending", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) { res.status(503).json({ error: "YouTube API not configured" }); return; }
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=IN&videoCategoryId=10&maxResults=20&key=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json() as any;
      throw new Error(err?.error?.message ?? `YouTube API error: ${r.status}`);
    }
    const data = await r.json() as any;
    res.json({ videos: data.items.map(mapVideo) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
