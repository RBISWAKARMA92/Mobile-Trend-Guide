import { Router } from "express";
import pool from "../lib/db";
import { verifyToken } from "../lib/jwt";

const activityRouter = Router();

// Ensure table exists
async function ensureActivityTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tool VARCHAR(64) NOT NULL,
      label VARCHAR(128) NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      date DATE NOT NULL DEFAULT CURRENT_DATE
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_activities_user_date
    ON user_activities (user_id, date)
  `);
}

// POST /api/activity — log a tool usage event
activityRouter.post("/activity", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const { tool, label } = req.body;
  if (!tool || !label) return res.status(400).json({ error: "tool and label required" });

  try {
    await ensureActivityTable();
    await pool.query(
      "INSERT INTO user_activities (user_id, tool, label) VALUES ($1, $2, $3)",
      [payload.userId, tool, label]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("activity log error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/activity/summary — weekly summary of tool usage
activityRouter.get("/activity/summary", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    await ensureActivityTable();
    const result = await pool.query(
      `SELECT tool, label, COUNT(*) as count, MAX(logged_at) as last_used
       FROM user_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY tool, label
       ORDER BY count DESC
       LIMIT 10`,
      [payload.userId]
    );
    return res.json({ success: true, summary: result.rows });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/activity/insights — AI-powered insights about user activity
activityRouter.get("/activity/insights", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    await ensureActivityTable();

    const result = await pool.query(
      `SELECT tool, label, COUNT(*) as count
       FROM user_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY tool, label
       ORDER BY count DESC
       LIMIT 5`,
      [payload.userId]
    );

    const stats = result.rows;
    if (stats.length === 0) {
      return res.json({ insight: "Start using your daily tools to get personalised AI insights! 🌟" });
    }

    const top = stats[0];
    const insights = [
      `You've been using ${top.label} the most this week — keep up the great routine! 🌟`,
      `${stats.length} different tools used this week. You're making great use of ZenSpace! 💪`,
      `Your top tool is ${top.label}. Consistency is the key to progress! ⭐`,
      `Great activity this week! You've opened ${stats.reduce((a: number, b: any) => a + parseInt(b.count), 0)} tools total. 🎯`,
    ];

    // Chant counter specific insight
    const chantStat = stats.find((s: any) => s.tool === "chant-counter");
    if (chantStat) {
      return res.json({
        insight: `Beautiful! You've been chanting ${chantStat.count}x this week. Your practice is growing. 🙏`,
      });
    }

    const insight = insights[Math.floor(Math.random() * insights.length)];
    return res.json({ insight });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default activityRouter;
