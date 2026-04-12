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
    durationDays: 0,
    durationLabel: "Forever",
    credits: 50,
    creditsPerMonth: 50,
    savings: null,
    badge: null,
    features: [
      "50 AI chat messages total",
      "All 23+ tools included",
      "Voice & video recorder",
      "Music player",
    ],
    color: "#6366f1",
    popular: false,
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 49,
    priceLabel: "₹49/month",
    durationDays: 30,
    durationLabel: "1 month",
    credits: 500,
    creditsPerMonth: 500,
    savings: null,
    badge: null,
    features: [
      "500 AI chat credits/month",
      "All 23+ tools included",
      "Voice & video recorder",
      "Music player",
      "Credits refresh every month",
    ],
    color: "#0ea5e9",
    popular: false,
  },
  {
    id: "quarterly",
    name: "3 Months",
    price: 121,
    priceLabel: "₹121 for 3 months",
    durationDays: 90,
    durationLabel: "3 months",
    credits: 1500,
    creditsPerMonth: 500,
    savings: "Save ₹26",
    badge: "Best Value",
    features: [
      "1500 AI chat credits (500/month)",
      "All 23+ tools included",
      "Voice & video recorder",
      "Music player",
      "Credits refresh monthly",
    ],
    color: "#10b981",
    popular: true,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 399,
    priceLabel: "₹399/year",
    durationDays: 365,
    durationLabel: "12 months",
    credits: 6000,
    creditsPerMonth: 500,
    savings: "Save ₹189",
    badge: "32% Off",
    features: [
      "6000 AI chat credits (500/month)",
      "All 23+ tools included",
      "Voice & video recorder",
      "Music player",
      "Credits refresh monthly",
      "Priority support",
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
      receipt: `order_u${payload.userId}_${Date.now()}`,
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
      priceLabel: plan.priceLabel,
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
    await activatePlan(payload.userId, plan);
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
    await activatePlan(payload.userId, plan);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
    return res.json({ success: true, plan: plan.id, credits: user.rows[0].credits });
  } catch {
    return res.status(500).json({ error: "Failed to activate plan" });
  }
});

async function activatePlan(userId: number, plan: (typeof PLANS)[0]) {
  await pool.query("UPDATE subscriptions SET is_active = false WHERE user_id = $1", [userId]);
  const expiresAt = plan.durationDays > 0
    ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
    : null;
  await pool.query(
    "INSERT INTO subscriptions (user_id, plan, credits_per_month, expires_at) VALUES ($1, $2, $3, $4)",
    [userId, plan.id, plan.creditsPerMonth, expiresAt]
  );
  await pool.query("UPDATE users SET credits = $1 WHERE id = $2", [plan.credits, userId]);
}

export default router;
