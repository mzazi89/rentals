import { z } from "zod";

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------
export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const roleSelectSchema = z.object({
  role: z.enum(["tenant", "agent", "landlord"], {
    errorMap: () => ({ message: "Please choose a role" }),
  }),
});

// ------------------------------------------------------------------
// Onboarding
// ------------------------------------------------------------------
export const tenantOnboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  preferredLocations: z.array(z.string()).max(10).default([]),
  propertyType: z.string().optional(),
  minBudget: z.coerce.number().int().min(0).max(100_000_000).optional(),
  maxBudget: z.coerce.number().int().min(0).max(100_000_000).optional(),
  occupation: z.string().trim().max(120).optional(),
  employer: z.string().trim().max(120).optional(),
  monthlyIncome: z.coerce.number().min(0).max(100_000_000).optional(),
}).refine((v) => !v.minBudget || !v.maxBudget || v.maxBudget >= v.minBudget, {
  message: "Maximum budget must be at least the minimum budget",
  path: ["maxBudget"],
});

export const agentOnboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  agencyName: z.string().trim().min(2, "Agency name is required").max(160),
  agencyPhone: z.string().trim().min(6).max(20),
  agencyAddress: z.string().trim().max(200),
  yearsExperience: z.coerce.number().int().min(0).max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  idNumber: z.string().trim().min(4, "ID number is required").max(32),
  areasServed: z.array(z.string()).max(20).default([]),
});

export const landlordOnboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  companyName: z.string().trim().max(160).optional(),
  address: z.string().trim().max(200).optional(),
});

// ------------------------------------------------------------------
// Properties
// ------------------------------------------------------------------
const ksh = z.coerce.number().min(0, "Amount must be 0 or more").max(1_000_000_000);

export const propertyBasicSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(160),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  propertyTypeId: z.string().uuid("Select a property type"),
  status: z.enum(["draft", "pending_review", "available"]).optional(),
});

export const propertyLocationSchema = z.object({
  county: z.string().trim().min(1, "County is required").max(80),
  city: z.string().trim().min(1, "City/town is required").max(80),
  neighborhood: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  approximateLocation: z.boolean().default(true),
});

export const propertyPricingSchema = z.object({
  monthlyRent: ksh.min(1, "Monthly rent is required"),
  depositAmount: ksh.default(0),
  availabilityDate: z.string().optional(),
});

export const propertySpecsSchema = z.object({
  propertyTypeId: z.string().uuid(),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  size: z.coerce.number().min(0).max(1_000_000).optional(),
  furnished: z.boolean().default(false),
});

export const propertyAmenitiesSchema = z.object({
  amenityIds: z.array(z.string().uuid()).max(50).default([]),
});

export const propertySubmitSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["draft", "submit"]),
});

// ------------------------------------------------------------------
// Viewings
// ------------------------------------------------------------------
export const viewingCreateSchema = z.object({
  propertyId: z.string().uuid(),
  scheduledAt: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  tenantMessage: z.string().trim().max(1000).optional(),
});

export const viewingManageSchema = z.object({
  viewingId: z.string().uuid(),
  action: z.enum(["confirm", "reject", "complete", "no_show", "cancel", "reschedule"]),
  rescheduleAt: z.string().optional(),
  agentMessage: z.string().trim().max(1000).optional(),
});

// ------------------------------------------------------------------
// Applications
// ------------------------------------------------------------------
export const applicationCreateSchema = z.object({
  propertyId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  email: z.string().trim().email("Enter a valid email").max(254),
  occupation: z.string().trim().max(120).optional(),
  employer: z.string().trim().max(120).optional(),
  monthlyIncome: z.coerce.number().min(0).max(1_000_000_000).optional(),
  numberofOccupants: z.coerce.number().int().min(1).max(20).default(1),
  preferredMoveInDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const applicationReviewSchema = z.object({
  applicationId: z.string().uuid(),
  action: z.enum(["approve", "reject", "under_review"]),
  note: z.string().trim().max(1000).optional(),
});

// ------------------------------------------------------------------
// Lease / rent
// ------------------------------------------------------------------
export const leaseCreateSchema = z.object({
  applicationId: z.string().uuid(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  monthlyRent: ksh.min(1),
  depositAmount: ksh.default(0),
  paymentDay: z.coerce.number().int().min(1).max(28).default(1),
}).refine((v) => new Date(v.endDate) > new Date(v.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

// ------------------------------------------------------------------
// Payments
// ------------------------------------------------------------------
export const paymentInitSchema = z.object({
  amount: ksh.min(1),
  paymentType: z.enum(["application_fee", "booking_fee", "deposit", "rent", "other"]),
  propertyId: z.string().uuid().optional(),
  leaseId: z.string().uuid().optional(),
  rentRecordId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  redirectPath: z.string().max(200).optional(),
});

// ------------------------------------------------------------------
// Messaging
// ------------------------------------------------------------------
export const messageSendSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, "Message cannot be empty").max(4000),
});

export const conversationCreateSchema = z.object({
  propertyId: z.string().uuid(),
  agentId: z.string().uuid(),
});

// ------------------------------------------------------------------
// Reviews / reports
// ------------------------------------------------------------------
export const reviewCreateSchema = z.object({
  agentId: z.string().uuid(),
  leaseId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1, "Select a rating").max(5),
  comment: z.string().trim().min(5, "Review must be at least 5 characters").max(2000),
});

export const reportCreateSchema = z.object({
  reason: z.enum(["fake_property", "scam", "incorrect_information", "inappropriate_content", "agent_misconduct", "other"]),
  description: z.string().trim().min(10, "Please describe the issue (at least 10 characters)").max(2000),
  reportedUserId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

// ------------------------------------------------------------------
// Settings
// ------------------------------------------------------------------
export const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
});

export const notificationPrefsSchema = z.object({
  notifyViewing: z.boolean(),
  notifyApplication: z.boolean(),
  notifyPayment: z.boolean(),
  notifyRent: z.boolean(),
  notifyMessage: z.boolean(),
  notifySystem: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

export const agencySettingsSchema = z.object({
  agencyName: z.string().trim().min(2).max(160),
  agencyPhone: z.string().trim().min(6).max(20),
  agencyAddress: z.string().trim().max(200),
  bio: z.string().trim().max(1000).optional(),
  areasServed: z.array(z.string()).max(20).default([]),
  isAvailable: z.boolean(),
});

// ------------------------------------------------------------------
// Admin
// ------------------------------------------------------------------
export const adminUserEditSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional(),
});

export const adminVerifyAgentSchema = z.object({
  agentId: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_info"]),
  note: z.string().trim().max(1000).optional(),
});

export const adminPropertyDecisionSchema = z.object({
  propertyId: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_changes"]),
  note: z.string().trim().max(1000).optional(),
});

export const adminSettingsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
