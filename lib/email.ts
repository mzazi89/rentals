import "server-only";

import { getServerEnv } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/** Development provider — logs emails to the console. */
class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.info(
      `[email:dev] To: ${message.to} | Subject: ${message.subject}`
    );
    console.info(message.html.replace(/<[^>]+>/g, " ").slice(0, 300));
  }
}

/**
 * Production email provider stub — wire up Resend / Postmark / SES here.
 * Requires EMAIL_API_KEY. Kept as an abstraction so the rest of the app
 * never depends on a specific vendor.
 */
class HttpEmailProvider implements EmailProvider {
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async send(message: EmailMessage): Promise<void> {
    // TODO(vendor): POST to your email provider's send endpoint using this.apiKey
    throw new Error(
      "HttpEmailProvider is not configured. Implement the send() call for your email vendor."
    );
  }
}

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (provider) return provider;
  const env = getServerEnv();
  provider = env.emailApiKey ? new HttpEmailProvider(env.emailApiKey) : new ConsoleEmailProvider();
  return provider;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    await getEmailProvider().send(message);
  } catch (err) {
    console.error("[email] failed to send", err);
  }
}
