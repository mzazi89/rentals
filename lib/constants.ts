// Central branding & platform configuration.
// Change values here (or via admin → Settings → platform_settings in the DB)
// to rebrand RentHub. Never hard-code branding across the app.

export const DEFAULT_SETTINGS = {
  siteName: "RentHub",
  tagline: "Find a place you'll love to call home.",
  currency: "KES",
  currencyLocale: "en-KE",
  timezone: "Africa/Nairobi",
  contactEmail: "hello@renthub.co.ke",
  contactPhone: "+254 700 000 000",
  supportEmail: "support@renthub.co.ke",
  address: "Nairobi, Kenya",
  safetyTip:
    "Never send money outside the platform without verifying the property and recipient.",
  applicationFee: 500,
  bookingFee: 0,
  rentCommissionRate: 5.0,
  depositCommissionRate: 2.5,
  requirePropertyVerification: true,
  requireAgentVerification: true,
  allowPublicRegistration: true,
  allowLandlordRegistration: true,
  defaultDescription:
    "RentHub connects verified landlords, trusted rent agents and tenants across Kenya. Search rental properties, book viewings, apply and pay rent online.",
  social: {
    facebook: "https://facebook.com/renthub",
    instagram: "https://instagram.com/renthub",
    x: "https://x.com/renthub",
  },
} as const;

export type AppSettings = {
  siteName: string;
  tagline: string;
  currency: string;
  currencyLocale: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  address: string;
  safetyTip: string;
  applicationFee: number;
  bookingFee: number;
  rentCommissionRate: number;
  depositCommissionRate: number;
  requirePropertyVerification: boolean;
  requireAgentVerification: boolean;
  allowPublicRegistration: boolean;
  allowLandlordRegistration: boolean;
  defaultDescription: string;
  social: { facebook: string; instagram: string; x: string };
};

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  inactive: "Inactive",
  rejected: "Rejected",
};

export const VIEWING_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const LEASE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  terminated: "Terminated",
};

export const RENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  successful: "Successful",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  application_fee: "Application Fee",
  booking_fee: "Booking Fee",
  deposit: "Deposit",
  rent: "Rent",
  other: "Other",
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const AGENT_VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  info_requested: "More Info Needed",
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  hidden: "Hidden",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  fake_property: "Fake Property",
  scam: "Scam",
  incorrect_information: "Incorrect Information",
  inappropriate_content: "Inappropriate Content",
  agent_misconduct: "Agent Misconduct",
  other: "Other",
};
