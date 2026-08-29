// RentHub — shared domain types (mirrors the Supabase schema)

export type Role = "tenant" | "agent" | "landlord" | "owner" | "admin";

export type AccountStatus = "active" | "suspended";

export type AgentVerificationStatus = "pending" | "verified" | "rejected" | "info_requested";

export type PropertyStatus = "draft" | "pending_review" | "available" | "reserved" | "occupied" | "inactive" | "rejected";

export type ViewingStatus = "pending" | "confirmed" | "rescheduled" | "cancelled" | "completed" | "no_show";

export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected" | "withdrawn";

export type LeaseStatus = "pending" | "active" | "expired" | "terminated";

export type RentStatus = "pending" | "paid" | "partially_paid" | "overdue" | "cancelled";

export type PaymentType = "application_fee" | "booking_fee" | "deposit" | "rent" | "other";

export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export type CommissionStatus = "pending" | "approved" | "paid" | "cancelled";

export type NotificationType =
  | "viewing_request"
  | "viewing_confirmation"
  | "application_submitted"
  | "application_approved"
  | "application_rejected"
  | "payment_successful"
  | "rent_due"
  | "rent_overdue"
  | "new_message"
  | "agent_verification"
  | "property_approval"
  | "system_announcement";

export type ReviewStatus = "pending" | "approved" | "hidden";

export type ReportReason =
  | "fake_property"
  | "scam"
  | "incorrect_information"
  | "inappropriate_content"
  | "agent_misconduct"
  | "other";

export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role | null;
  status: AccountStatus;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  agency_name: string | null;
  agency_phone: string | null;
  agency_address: string | null;
  years_experience: number | null;
  bio: string | null;
  id_number: string | null;
  id_document_url: string | null;
  verification_status: AgentVerificationStatus;
  verification_notes: string | null;
  areas_served: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Landlord {
  id: string;
  company_name: string | null;
  address: string | null;
  verification_status: LandlordVerificationStatus;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LandlordVerificationStatus = "pending" | "verified" | "rejected" | "info_requested";

export interface Tenant {
  id: string;
  preferred_locations: string[];
  preferred_property_type: string | null;
  min_budget: number | null;
  max_budget: number | null;
  occupation: string | null;
  employer: string | null;
  monthly_income: number | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Location {
  id: string;
  name: string;
  type: "county" | "city" | "neighborhood";
  parent_id: string | null;
  slug: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Property {
  id: string;
  owner_id: string;
  agent_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  property_type_id: string | null;
  status: PropertyStatus;
  monthly_rent: number;
  deposit_amount: number;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  furnished: boolean;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  approximate_location: boolean;
  availability_date: string | null;
  featured: boolean;
  verified: boolean;
  rejection_reason: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  // populated by queries when selected
  is_favorited?: boolean;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  position: number;
  is_primary: boolean;
  created_at: string;
}

export interface Viewing {
  id: string;
  property_id: string;
  tenant_id: string;
  agent_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: ViewingStatus;
  tenant_message: string | null;
  agent_message: string | null;
  created_at: string;
  updated_at: string;
  property?: Property | null;
  tenant?: Profile | null;
  agent?: Profile | null;
}

export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  agent_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  occupation: string | null;
  employer: string | null;
  monthly_income: number | null;
  number_of_occupants: number;
  preferred_move_in_date: string | null;
  notes: string | null;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Property | null;
  applicant?: Profile | null;
}

export interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  landlord_id: string | null;
  agent_id: string | null;
  application_id: string | null;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  payment_day: number;
  status: LeaseStatus;
  created_at: string;
  updated_at: string;
  property?: Property | null;
  tenant?: Profile | null;
}

export interface RentRecord {
  id: string;
  lease_id: string;
  tenant_id: string;
  property_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  payment_date: string | null;
  status: RentStatus;
  created_at: string;
  updated_at: string;
  property?: Property | null;
}

export interface Payment {
  id: string;
  payment_reference: string;
  provider: string;
  tenant_id: string;
  property_id: string | null;
  lease_id: string | null;
  rent_record_id: string | null;
  application_id: string | null;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  provider_transaction_id: string | null;
  provider_metadata: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Property | null;
  tenant?: Profile | null;
  lease?: Lease | null;
  rent_record?: RentRecord | null;
}

export interface Commission {
  id: string;
  agent_id: string;
  property_id: string | null;
  tenant_id: string | null;
  transaction_id: string | null;
  commission_type: PaymentType;
  commission_rate: number | null;
  commission_amount: number;
  status: CommissionStatus;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  property_id: string | null;
  application_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Property | null;
  other_member?: Profile | null;
  last_message?: Message | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  notify_viewing: boolean;
  notify_application: boolean;
  notify_payment: boolean;
  notify_rent: boolean;
  notify_message: boolean;
  notify_system: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export type UnitStatus = "available" | "reserved" | "occupied" | "inactive";

export interface BuildingFloor {
  id: string;
  property_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface BuildingUnit {
  id: string;
  property_id: string;
  floor_id: string | null;
  unit_number: string;
  status: UnitStatus;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
  floor?: BuildingFloor | null;
  tenant?: Partial<Profile> | null;
}

export interface Review {
  id: string;
  reviewer_id: string;
  agent_id: string;
  property_id: string | null;
  lease_id: string | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  reviewer?: Profile | null;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  property_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile | null;
  reported_user?: Profile | null;
  property?: Property | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export interface PlatformSettings {
  [key: string]: unknown;
}

export interface PropertyFilters {
  q?: string;
  location?: string;
  county?: string;
  neighborhood?: string;
  type?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenities?: string[];
  available?: boolean;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  sort?: "newest" | "lowest_rent" | "highest_rent" | "most_popular" | "recommended";
  page?: number;
  pageSize?: number;
}

export interface AppSettings {
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
}
