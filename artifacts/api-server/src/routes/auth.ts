import { Router } from "express";
import pool from "../lib/db";
import { signToken, verifyToken } from "../lib/jwt";

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/auth/email-login", async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email.trim())) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const cleanEmail = email.trim().toLowerCase();

  try {
    let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [cleanEmail]);
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      isNewUser = true;
      userResult = await pool.query(
        "INSERT INTO users (email, credits) VALUES ($1, 50) RETURNING *",
        [cleanEmail]
      );
      const userId = userResult.rows[0].id;
      await pool.query(
        "INSERT INTO subscriptions (user_id, plan, credits_per_month) VALUES ($1, 'free', 50)",
        [userId]
      );
    }

    const user = userResult.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    const subscription = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND is_active = true ORDER BY id DESC LIMIT 1",
      [user.id]
    );

    return res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
      },
      subscription: subscription.rows[0] ?? null,
    });
  } catch (err) {
    console.error("email-login error:", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userResult.rows[0];

    const subscription = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND is_active = true ORDER BY id DESC LIMIT 1",
      [user.id]
    );

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
      subscription: subscription.rows[0] ?? null,
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/use-credit", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userResult.rows[0];

    const sub = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND is_active = true ORDER BY id DESC LIMIT 1",
      [user.id]
    );
    const plan = sub.rows[0]?.plan ?? "free";
    if (plan === "pro") {
      return res.json({ success: true, credits: user.credits, plan });
    }

    if (user.credits <= 0) {
      return res.status(402).json({ error: "No credits remaining", credits: 0, plan });
    }
    const updated = await pool.query(
      "UPDATE users SET credits = credits - 1 WHERE id = $1 RETURNING credits",
      [user.id]
    );
    return res.json({ success: true, credits: updated.rows[0].credits, plan });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
