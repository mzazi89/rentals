import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "@/db";
import { sendEmail } from "@/lib/email";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

/** Drizzle instance over the same postgres.js client (auth adapter only). */
const drizzleDb = drizzle(db);

export const auth = betterAuth({
  database: drizzleAdapter(drizzleDb, { provider: "pg" }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, token }) => {
      const resetUrl = `${baseURL}/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your RentHub password",
        html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
          <h2 style="color:#1e3a8a">RentHub</h2>
          <p>Hi ${user.name},</p>
          <p>You asked to reset your password. Click the button below to choose a new one. This link expires shortly.</p>
          <p><a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
          <p style="color:#666;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      const verifyUrl = `${baseURL}/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent("/signup/role")}`;
      await sendEmail({
        to: user.email,
        subject: "Verify your RentHub email",
        html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
          <h2 style="color:#1e3a8a">RentHub</h2>
          <p>Welcome, ${user.name}! Confirm your email to activate your account.</p>
          <p><a href="${verifyUrl}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Verify email</a></p>
        </div>`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // sliding renewal every 24h
  },
  // Enables server-side user creation (used by the admin bootstrap route).
  admin: {
    enabled: true,
    defaultRole: "user",
  },
  user: {
    additionalFields: {
      // mirrors profiles.role for convenient session access
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
