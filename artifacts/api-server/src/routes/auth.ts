import { Router } from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pool from "../lib/db";
import { signToken, verifyToken } from "../lib/jwt";

const router = Router();

// In-memory rate limiter: max 3 OTP requests per email per 5 minutes
const otpRateMap = new Map<string, { count: number; resetAt: number }>();

function checkOtpRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = otpRateMap.get(email);
  if (!entry || now > entry.resetAt) {
    otpRateMap.set(email, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

function generateOTP(): string {
  const num = crypto.randomInt(100000, 999999);
  return String(num);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587");

  if (!host || !user || !pass) return false;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"ZenSpace" <${user}>`,
      to: email,
      subject: "Your ZenSpace OTP Code",
      text: `Your ZenSpace verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f1e; color: #ffffff; border-radius: 16px;">
          <h2 style="color: #6366f1; margin-bottom: 8px;">ZenSpace</h2>
          <p style="color: #a5b4fc; margin-bottom: 24px;">Your verification code</p>
          <div style="background: #1e1e3f; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #ffffff;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

router.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email.trim())) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const cleanEmail = email.trim().toLowerCase();

  if (!checkOtpRateLimit(cleanEmail)) {
    return res.status(429).json({ error: "Too many OTP requests. Please wait 5 minutes." });
  }

  try {
    await pool.query(
      "DELETE FROM otps WHERE email = $1 OR expires_at < NOW()",
      [cleanEmail]
    );
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      "INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)",
      [cleanEmail, otp, expiresAt]
    );

    const emailSent = await sendEmailOTP(cleanEmail, otp);

    const isDev = process.env.NODE_ENV !== "production";
    return res.json({
      success: true,
      emailSent,
      otp: (!emailSent || isDev) ? otp : undefined,
      message: emailSent
        ? "OTP sent to your email"
        : `OTP generated (demo mode — configure SMTP to send real emails)`,
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });
  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT * FROM otps WHERE email = $1 AND otp = $2 AND verified = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [cleanEmail, otp]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    await pool.query("UPDATE otps SET verified = true WHERE id = $1", [result.rows[0].id]);

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
    console.error("verify-otp error:", err);
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
