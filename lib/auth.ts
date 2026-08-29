import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "@/db";
import { sendEmail } from "@/lib/email";

const baseURL = process.env.BETTER_AUTH_URL?.trim() || "http://localhost:3000";
const requireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

/**
 * Drizzle schema for Better Auth — must match db/migrations/000001 + 000004
 * exactly (quoted camelCase columns). The Drizzle adapter requires the schema
 * to be passed explicitly, otherwise it cannot map the auth models.
 */
const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

const accountTable = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  issuer: text("issuer"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

const authSchema = {
  user: userTable,
  session: sessionTable,
  account: accountTable,
  verification: verificationTable,
};

/** Drizzle instance over the same postgres.js client, bound to the auth schema. */
const drizzleDb = drizzle(db, { schema: authSchema });

export const auth = betterAuth({
  database: drizzleAdapter(drizzleDb, { provider: "pg", schema: authSchema }),
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
    sendOnSignUp: false,
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
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
