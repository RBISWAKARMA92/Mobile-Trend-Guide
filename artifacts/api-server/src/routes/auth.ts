import { Router } from "express";
import pool from "../lib/db";
import { signToken, verifyToken } from "../lib/jwt";

const router = Router();

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/auth/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ""))) {
    return res.status(400).json({ error: "Invalid phone number" });
  }
  const cleanPhone = phone.replace(/\s/g, "");

  try {
    await pool.query("DELETE FROM otps WHERE phone = $1 OR expires_at < NOW()", [cleanPhone]);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      "INSERT INTO otps (phone, otp, expires_at) VALUES ($1, $2, $3)",
      [cleanPhone, otp, expiresAt]
    );
    return res.json({ success: true, otp, message: "OTP sent! (Demo: OTP shown here, in production this would be SMS)" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });
  const cleanPhone = phone.replace(/\s/g, "");

  try {
    const result = await pool.query(
      "SELECT * FROM otps WHERE phone = $1 AND otp = $2 AND verified = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [cleanPhone, otp]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    await pool.query("UPDATE otps SET verified = true WHERE id = $1", [result.rows[0].id]);

    let userResult = await pool.query("SELECT * FROM users WHERE phone = $1", [cleanPhone]);
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      isNewUser = true;
      userResult = await pool.query(
        "INSERT INTO users (phone, credits) VALUES ($1, 50) RETURNING *",
        [cleanPhone]
      );
      const userId = userResult.rows[0].id;
      await pool.query(
        "INSERT INTO subscriptions (user_id, plan, credits_per_month) VALUES ($1, 'free', 50)",
        [userId]
      );
    }

    const user = userResult.rows[0];
    const token = signToken({ userId: user.id, phone: user.phone });

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
        phone: user.phone,
        name: user.name,
        credits: user.credits,
      },
      subscription: subscription.rows[0] ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
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
      user: { id: user.id, phone: user.phone, name: user.name, credits: user.credits },
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
