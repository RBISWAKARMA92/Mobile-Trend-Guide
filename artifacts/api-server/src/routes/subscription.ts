import { Router } from "express";
import pool from "../lib/db";
import { verifyToken } from "../lib/jwt";

const router = Router();

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free",
    credits: 50,
    features: [
      "50 AI chat messages",
      "All 13 tools included",
      "Voice & video recorder",
      "Music player",
    ],
    color: "#6366f1",
    popular: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 49,
    priceLabel: "₹49/month",
    credits: 500,
    features: [
      "500 AI chat messages/month",
      "All 13 tools included",
      "Voice & video recorder",
      "Music player",
      "Credits refresh monthly",
    ],
    color: "#0ea5e9",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    priceLabel: "₹99/month",
    credits: -1,
    features: [
      "Unlimited AI chat messages",
      "All 13 tools included",
      "Voice & video recorder",
      "Music player",
      "Priority support",
      "Credits refresh monthly",
    ],
    color: "#f59e0b",
    popular: false,
  },
];

router.get("/subscription/plans", (_req, res) => {
  res.json({ plans: PLANS });
});

router.post("/subscription/activate", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const { planId } = req.body;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });

  try {
    await pool.query("UPDATE subscriptions SET is_active = false WHERE user_id = $1", [payload.userId]);
    const expiresAt = plan.id === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO subscriptions (user_id, plan, credits_per_month, expires_at) VALUES ($1, $2, $3, $4)",
      [payload.userId, plan.id, plan.credits, expiresAt]
    );
    const addCredits = plan.credits === -1 ? 9999 : plan.credits;
    await pool.query("UPDATE users SET credits = $1 WHERE id = $2", [addCredits, payload.userId]);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
    return res.json({ success: true, plan: plan.id, credits: user.rows[0].credits });
  } catch {
    return res.status(500).json({ error: "Failed to activate plan" });
  }
});

export default router;
