import "server-only";

import { db } from "@/db";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import type { NotificationType } from "@/types";

interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

const TYPE_TO_PREF_KEY: Record<NotificationType, string> = {
  viewing_request: "notify_viewing",
  viewing_confirmation: "notify_viewing",
  application_submitted: "notify_application",
  application_approved: "notify_application",
  application_rejected: "notify_application",
  payment_successful: "notify_payment",
  rent_due: "notify_rent",
  rent_overdue: "notify_rent",
  new_message: "notify_message",
  agent_verification: "notify_system",
  property_approval: "notify_system",
  system_announcement: "notify_system",
};

/**
 * Create an in-app notification + (architecture for) email.
 * Writes on behalf of other users (e.g. agent gets notified when a tenant
 * applies) — authorization is app-level, like all DB access in Neon.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  const prefs = await db<{
    notify_viewing: boolean;
    notify_application: boolean;
    notify_payment: boolean;
    notify_rent: boolean;
    notify_message: boolean;
    notify_system: boolean;
    email_enabled: boolean;
    in_app_enabled: boolean;
  }[]>`select * from notification_preferences where user_id = ${input.userId}`;

  const prefKey = TYPE_TO_PREF_KEY[input.type];
  const pref = prefs[0];
  const enabled = pref ? pref[prefKey as keyof typeof pref] !== false : true;
  const inApp = pref ? pref.in_app_enabled !== false : true;
  const emailOn = pref ? pref.email_enabled !== false : true;
  if (!enabled) return;

  if (inApp) {
    await db`
      insert into notifications (user_id, type, title, body, link)
      values (${input.userId}, ${input.type}, ${input.title}, ${input.body ?? null}, ${input.link ?? null})
    `;
  }

  if (emailOn && input.body) {
    const profile = await db<{ email: string | null }[]>`
      select email from profiles where id = ${input.userId}
    `;
    if (profile[0]?.email) {
      const settings = await getSettings();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const linkHref = input.link ? `${baseUrl}${input.link}` : baseUrl;
      void sendEmail({
        to: profile[0].email,
        subject: `${settings.siteName}: ${input.title}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
          <h2 style="color:#1e3a8a">${settings.siteName}</h2>
          <p><strong>${input.title}</strong></p>
          <p>${input.body}</p>
          <p><a href="${linkHref}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">View on ${settings.siteName}</a></p>
        </div>`,
      });
    }
  }
}
