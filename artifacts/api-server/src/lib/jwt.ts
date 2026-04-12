import jwt from "jsonwebtoken";

const SECRET = process.env["SESSION_SECRET"] ?? "dailytools-secret-2024";

export function signToken(payload: { userId: number; phone: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: "90d" });
}

export function verifyToken(token: string): { userId: number; phone: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: number; phone: string };
  } catch {
    return null;
  }
}
