import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import pool from "../lib/db";
import { verifyToken } from "../lib/jwt";

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env["RAZORPAY_KEY_ID"] ?? "",
  key_secret: process.env["RAZORPAY_KEY_SECRET"] ?? "",
});

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

router.post("/subscription/create-order", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const { planId } = req.body;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });
  if (plan.price === 0) return res.status(400).json({ error: "Free plan needs no payment" });

  try {
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `order_user${payload.userId}_${Date.now()}`,
      notes: {
        userId: String(payload.userId),
        planId: plan.id,
      },
    });
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env["RAZORPAY_KEY_ID"],
      planId: plan.id,
      planName: plan.name,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create order", details: err?.message });
  }
});

router.post("/subscription/verify-payment", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
  const secret = process.env["RAZORPAY_KEY_SECRET"] ?? "";

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return res.status(400).json({ error: "Invalid plan" });

  try {
    await pool.query("UPDATE subscriptions SET is_active = false WHERE user_id = $1", [payload.userId]);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO subscriptions (user_id, plan, credits_per_month, expires_at) VALUES ($1, $2, $3, $4)",
      [payload.userId, plan.id, plan.credits, expiresAt]
    );
    const addCredits = plan.credits === -1 ? 9999 : plan.credits;
    await pool.query("UPDATE users SET credits = $1 WHERE id = $2", [addCredits, payload.userId]);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
    return res.json({ success: true, plan: plan.id, credits: user.rows[0].credits });
  } catch {
    return res.status(500).json({ error: "Failed to activate plan after payment" });
  }
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
