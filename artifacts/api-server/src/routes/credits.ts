import { Router } from "express";
import pool from "../lib/db";
import { verifyToken } from "../lib/jwt";

const creditsRouter = Router();

const CREDITS_PER_AD = 10;
const MAX_ADS_PER_DAY = 5;

// Ensure table exists on first use
async function ensureAdRewardsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_rewards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rewarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      credits_earned INTEGER NOT NULL DEFAULT 10
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_date
    ON ad_rewards (user_id, rewarded_at)
  `);
}

// POST /api/credits/reward-ad  — called after user completes watching an ad
creditsRouter.post("/credits/reward-ad", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    await ensureAdRewardsTable();

    // Count today's ad rewards for this user
    const todayCount = await pool.query(
      `SELECT COUNT(*) FROM ad_rewards
       WHERE user_id = $1
         AND rewarded_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '24 hours'`,
      [payload.userId]
    );
    const count = parseInt(todayCount.rows[0].count, 10);

    if (count >= MAX_ADS_PER_DAY) {
      return res.status(429).json({
        error: "Daily ad limit reached",
        limit: MAX_ADS_PER_DAY,
        rewarded_today: count,
        remaining_today: 0,
      });
    }

    // Award credits
    const updated = await pool.query(
      "UPDATE users SET credits = LEAST(credits + $1, 9999) WHERE id = $2 RETURNING credits",
      [CREDITS_PER_AD, payload.userId]
    );

    // Record reward
    await pool.query(
      "INSERT INTO ad_rewards (user_id, credits_earned) VALUES ($1, $2)",
      [payload.userId, CREDITS_PER_AD]
    );

    const newCount = count + 1;
    return res.json({
      success: true,
      credits: updated.rows[0].credits,
      credits_earned: CREDITS_PER_AD,
      rewarded_today: newCount,
      remaining_today: MAX_ADS_PER_DAY - newCount,
    });
  } catch (err) {
    console.error("reward-ad error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/credits/ad-status — check how many ads user can still watch today
creditsRouter.get("/credits/ad-status", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    await ensureAdRewardsTable();

    const todayCount = await pool.query(
      `SELECT COUNT(*) FROM ad_rewards
       WHERE user_id = $1
         AND rewarded_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '24 hours'`,
      [payload.userId]
    );
    const count = parseInt(todayCount.rows[0].count, 10);

    const userRes = await pool.query("SELECT credits FROM users WHERE id = $1", [payload.userId]);
    const credits = userRes.rows[0]?.credits ?? 0;

    return res.json({
      rewarded_today: count,
      remaining_today: Math.max(0, MAX_ADS_PER_DAY - count),
      max_per_day: MAX_ADS_PER_DAY,
      credits_per_ad: CREDITS_PER_AD,
      current_credits: credits,
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default creditsRouter;
