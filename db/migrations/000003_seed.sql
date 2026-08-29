-- RentHub — Neon migration 000003: seed data (reference data only)
-- No user accounts are created here — see app/api/admin/bootstrap & /api/demo/seed.

insert into roles (name, label, permissions) values
  ('tenant', 'Tenant', '{"can_search":true,"can_apply":true,"can_pay":true,"can_message":true}'::jsonb),
  ('agent', 'Rent Agent', '{"can_manage_properties":true,"can_manage_viewings":true,"can_review_applications":true,"can_manage_tenants":true}'::jsonb),
  ('landlord', 'Landlord', '{"can_manage_properties":true,"can_assign_agents":true,"can_view_income":true}'::jsonb),
  ('admin', 'Administrator', '{"full_access":true}'::jsonb)
on conflict (name) do nothing;

insert into property_types (name, slug, description, icon, sort_order) values
  ('Bedsitter', 'bedsitter', 'Single-room unit with shared amenities', 'Home', 1),
  ('Studio', 'studio', 'Open-plan self-contained unit', 'Building2', 2),
  ('Apartment', 'apartment', 'Self-contained unit in a block', 'Building', 3),
  ('Flat', 'flat', 'Ground-level self-contained unit', 'Home', 4),
  ('Maisonette', 'maisonette', 'Multi-level self-contained unit', 'Layers', 5),
  ('House', 'house', 'Standalone residential house', 'House', 6),
  ('Villa', 'villa', 'Luxury standalone residence', 'Landmark', 7),
  ('Townhouse', 'townhouse', 'Multi-level house in a row', 'Building2', 8),
  ('Commercial', 'commercial', 'Commercial retail space', 'Store', 9),
  ('Office', 'office', 'Office space', 'Briefcase', 10),
  ('Shop', 'shop', 'Retail shop', 'ShoppingBag', 11),
  ('Warehouse', 'warehouse', 'Industrial storage space', 'Warehouse', 12),
  ('Hostel', 'hostel', 'Shared accommodation', 'BedDouble', 13),
  ('Other', 'other', 'Other property type', 'CircleEllipsis', 14)
on conflict (name) do nothing;

insert into amenities (name, icon, category, sort_order) values
  ('Parking', 'Car', 'Parking', 1),
  ('Security', 'ShieldCheck', 'Safety', 2),
  ('CCTV', 'Camera', 'Safety', 3),
  ('Wi-Fi', 'Wifi', 'Utilities', 4),
  ('Water', 'Droplets', 'Utilities', 5),
  ('Electricity', 'Zap', 'Utilities', 6),
  ('Balcony', 'DoorOpen', 'Outdoor', 7),
  ('Garden', 'Trees', 'Outdoor', 8),
  ('Swimming Pool', 'Waves', 'Recreation', 9),
  ('Gym', 'Dumbbell', 'Recreation', 10),
  ('Elevator', 'ArrowUpDown', 'Accessibility', 11),
  ('Backup Generator', 'BatteryCharging', 'Utilities', 12),
  ('Borehole', 'Droplet', 'Utilities', 13),
  ('Air Conditioning', 'Wind', 'Comfort', 14),
  ('Furnished', 'Sofa', 'Furnishing', 15),
  ('Pet Friendly', 'PawPrint', 'Pets', 16)
on conflict (name) do nothing;

insert into locations (name, type, slug, sort_order) values
  ('Nairobi', 'county', 'nairobi', 1),
  ('Mombasa', 'county', 'mombasa', 2),
  ('Kisumu', 'county', 'kisumu', 3),
  ('Nakuru', 'county', 'nakuru', 4),
  ('Kiambu', 'county', 'kiambu', 5),
  ('Machakos', 'county', 'machakos', 6),
  ('Uasin Gishu', 'county', 'uasin-gishu', 7),
  ('Nyeri', 'county', 'nyeri', 8),
  ('Meru', 'county', 'meru', 9),
  ('Kakamega', 'county', 'kakamega', 10)
on conflict (slug) do nothing;

insert into locations (name, type, parent_id, slug, sort_order)
select n.name, 'neighborhood', c.id, n.slug, n.sort
from (values
  ('Kilimani', 'kilimani', 1),
  ('Westlands', 'westlands', 2),
  ('Kileleshwa', 'kileleshwa', 3),
  ('Lavington', 'lavington', 4),
  ('Parklands', 'parklands', 5),
  ('Upperhill', 'upperhill', 6),
  ('South C', 'south-c', 7),
  ('South B', 'south-b', 8),
  ('Langata', 'langata', 9),
  ('Embakasi', 'embakasi', 10),
  ('Kasarani', 'kasarani', 11),
  ('Roysambu', 'roysambu', 12),
  ('Ruaka', 'ruaka', 13),
  ('Rongai', 'rongai', 14),
  ('Syokimau', 'syokimau', 15),
  ('Ruiru', 'ruiru', 16),
  ('Ngong', 'ngong', 17),
  ('Thika', 'thika', 18)
) as n(name, slug, sort)
join locations c on c.type = 'county' and c.slug = 'nairobi'
on conflict (slug) do nothing;

insert into platform_settings (key, value, description) values
  ('site.name', '"RentHub"', 'Platform display name'),
  ('site.tagline', '"Find a place you will love to call home."', 'Hero tagline'),
  ('site.currency', '"KES"', 'ISO currency code'),
  ('site.currency_locale', '"en-KE"', 'Intl locale for currency formatting'),
  ('site.timezone', '"Africa/Nairobi"', 'Default display timezone'),
  ('site.contact_email', '"hello@renthub.co.ke"', 'Public contact email'),
  ('site.contact_phone', '"+254 700 000 000"', 'Public contact phone'),
  ('site.support_email', '"support@renthub.co.ke"', 'Support email'),
  ('site.address', '"Nairobi, Kenya"', 'Registered address'),
  ('site.safety_tip', '"Never send money outside the platform without verifying the property and recipient."', 'Safety warning shown on listings'),
  ('payments.provider', '"mock"', 'Active payment provider: mock | paystack'),
  ('payments.application_fee', '500', 'Application fee in KES (0 = none)'),
  ('payments.booking_fee', '0', 'Viewing booking fee in KES (0 = none)'),
  ('commissions.rent_rate', '5.0', 'Agent commission % on rent payments'),
  ('commissions.deposit_rate', '2.5', 'Agent commission % on deposits'),
  ('features.require_property_verification', 'true', 'Properties need admin approval before going public'),
  ('features.require_agent_verification', 'true', 'Agents need admin verification before listing'),
  ('features.allow_public_registration', 'true', 'Allow new signups'),
  ('features.allow_landlord_registration', 'true', 'Allow landlord role at signup'),
  ('seo.default_description', '"RentHub connects verified landlords, trusted rent agents and tenants across Kenya. Search rental properties, book viewings, apply and pay rent online."', 'Default meta description'),
  ('social.facebook', '"https://facebook.com/renthub"', 'Facebook URL'),
  ('social.instagram', '"https://instagram.com/renthub"', 'Instagram URL'),
  ('social.x', '"https://x.com/renthub"', 'X/Twitter URL')
on conflict (key) do nothing;
