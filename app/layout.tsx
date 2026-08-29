import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/feedback";
import { getAppUrl } from "@/lib/env-public";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "RentHub — Rental Properties in Kenya",
    template: "%s | RentHub",
  },
  description:
    "RentHub connects verified landlords, trusted rent agents and tenants across Kenya. Search rental properties, book viewings, apply and pay rent online.",
  applicationName: "RentHub",
  keywords: ["rent", "properties", "Kenya", "Nairobi", "apartments", "houses", "rental marketplace"],
  openGraph: {
    siteName: "RentHub",
    type: "website",
    locale: "en_KE",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
