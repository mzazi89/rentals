"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Save,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/core";
import { useToast, Alert } from "@/components/ui/feedback";
import { cn, formatMoney } from "@/lib/utils";
import { uploadImageFile } from "@/lib/storage";
import {
  propertyBasicSchema,
  propertyLocationSchema,
  propertyPricingSchema,
  propertySpecsSchema,
  propertyAmenitiesSchema,
} from "@/lib/validations";
import {
  savePropertyStep,
  submitPropertyForReview,
  addPropertyImage,
  removePropertyImage,
  setPrimaryImage,
} from "@/app/actions/properties";
import type { Amenity, Property, PropertyImage, PropertyType } from "@/types";
import type { z } from "zod";

type StepName = "basic" | "location" | "pricing" | "specs" | "amenities" | "images" | "review";

const STEPS: { id: StepName; label: string }[] = [
  { id: "basic", label: "Basics" },
  { id: "location", label: "Location" },
  { id: "pricing", label: "Pricing" },
  { id: "specs", label: "Specs" },
  { id: "amenities", label: "Amenities" },
  { id: "images", label: "Images" },
  { id: "review", label: "Review" },
];

interface WizardData {
  title: string;
  description: string;
  propertyTypeId: string;
  county: string;
  city: string;
  neighborhood: string;
  address: string;
  latitude: string;
  longitude: string;
  monthlyRent: string;
  depositAmount: string;
  availabilityDate: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  furnished: boolean;
  amenityIds: string[];
}

const emptyData: WizardData = {
  title: "",
  description: "",
  propertyTypeId: "",
  county: "Nairobi",
  city: "",
  neighborhood: "",
  address: "",
  latitude: "",
  longitude: "",
  monthlyRent: "",
  depositAmount: "0",
  availabilityDate: "",
  bedrooms: "",
  bathrooms: "",
  size: "",
  furnished: false,
  amenityIds: [],
};

export function PropertyWizard({
  propertyTypes,
  amenities,
  initial,
}: {
  propertyTypes: PropertyType[];
  amenities: Amenity[];
  initial?: (Property & { images?: PropertyImage[]; amenity_ids?: string[] }) | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState<StepName>("basic");
  const [data, setData] = React.useState<WizardData>(() => {
    if (!initial) return emptyData;
    return {
      title: initial.title,
      description: initial.description ?? "",
      propertyTypeId: initial.property_type_id ?? "",
      county: initial.county ?? "Nairobi",
      city: initial.city ?? "",
      neighborhood: initial.neighborhood ?? "",
      address: initial.address ?? "",
      latitude: initial.latitude ? String(initial.latitude) : "",
      longitude: initial.longitude ? String(initial.longitude) : "",
      monthlyRent: String(initial.monthly_rent ?? ""),
      depositAmount: String(initial.deposit_amount ?? "0"),
      availabilityDate: initial.availability_date ?? "",
      bedrooms: initial.bedrooms != null ? String(initial.bedrooms) : "",
      bathrooms: initial.bathrooms != null ? String(initial.bathrooms) : "",
      size: initial.size != null ? String(initial.size) : "",
      furnished: initial.furnished ?? false,
      amenityIds: initial.amenity_ids ?? [],
    };
  });
  const [images, setImages] = React.useState<PropertyImage[]>(initial?.images ?? []);
  const [propertyId, setPropertyId] = React.useState<string | null>(initial?.id ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [stepError, setStepError] = React.useState<string | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    if (stepError) setStepError(null);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep = (name: StepName): boolean => {
    try {
      switch (name) {
        case "basic":
          propertyBasicSchema.parse({
            title: data.title,
            description: data.description,
            propertyTypeId: data.propertyTypeId,
          });
          break;
        case "location":
          propertyLocationSchema.parse({
            county: data.county,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address,
            latitude: data.latitude || undefined,
            longitude: data.longitude || undefined,
          });
          break;
        case "pricing":
          propertyPricingSchema.parse({
            monthlyRent: data.monthlyRent || "0",
            depositAmount: data.depositAmount || "0",
            availabilityDate: data.availabilityDate || undefined,
          });
          break;
        case "specs":
          propertySpecsSchema.parse({
            propertyTypeId: data.propertyTypeId,
            bedrooms: data.bedrooms || undefined,
            bathrooms: data.bathrooms || undefined,
            size: data.size || undefined,
            furnished: data.furnished,
          });
          break;
        case "amenities":
          propertyAmenitiesSchema.parse({ amenityIds: data.amenityIds });
          break;
        default:
          return true;
      }
      return true;
    } catch (err) {
      const issue = (err as z.ZodError).issues?.[0];
      const message = issue ? issue.message : "Please fix the highlighted fields.";
      toast(message, "error");
      setStepError(message);
      return false;
    }
  };

  const persist = async (name: StepName) => {
    if (!validateStep(name)) return false;
    // Image/review steps persist nothing to the property row itself.
    if (name === "images" || name === "review") return true;
    setSaving(true);
    try {
      const result = await savePropertyStep({
        propertyId,
        step: name,
        ...data,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        monthlyRent: Number(data.monthlyRent || 0),
        depositAmount: Number(data.depositAmount || 0),
        bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
        size: data.size ? Number(data.size) : null,
      });
      if (result.ok) {
        setPropertyId((result.propertyId as string | undefined) ?? propertyId);
        toast("Changes saved", "success");
        return true;
      }
      toast(result.error ?? "Could not save.", "error");
      return false;
    } catch {
      toast("Something went wrong while saving.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    const ok = await persist(step);
    if (!ok) return;
    setStepError(null);
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
    else setStep("review");
  };

  const back = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!propertyId) {
      toast("Save the previous steps first.", "error");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImageFile(file, "property-images", propertyId);
        const result = await addPropertyImage(propertyId, url);
        if (!result.ok) throw new Error(result.error ?? "Failed to record image");
        setImages((prev) => [...prev, { id: String(result.imageId), property_id: propertyId, url, position: prev.length, is_primary: prev.length === 0, created_at: new Date().toISOString() }]);
      }
      toast("Images uploaded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (img: PropertyImage) => {
    const result = await removePropertyImage(img.id, img.url);
    if (result.ok) {
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      toast("Image removed", "info");
    } else {
      toast(result.error ?? "Could not remove image.", "error");
    }
  };

  const makePrimary = async (img: PropertyImage) => {
    const result = await setPrimaryImage(img.id, propertyId!);
    if (result.ok) {
      setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })));
      toast("Primary image updated", "success");
    }
  };

  const submitForReview = async () => {
    if (!propertyId) return;
    setSubmitting(true);
    try {
      const result = await submitPropertyForReview(propertyId);
      if (result.ok) {
        toast("Property submitted for review.", "success");
        router.push("/dashboard/agent/properties");
        router.refresh();
      } else {
        toast(result.error ?? "Could not submit.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const input = (key: keyof WizardData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, full?: boolean) => (
    <Field label={label} className={full ? "sm:col-span-2" : undefined}>
      <Input {...props} value={data[key] as string} onChange={(e) => set(key, e.target.value as WizardData[keyof WizardData])} />
    </Field>
  );

  return (
    <div>
      {/* Stepper */}
      <ol aria-label="Property creation steps" className="no-scrollbar mb-6 flex gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => i < stepIndex && setStep(s.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                step === s.id ? "bg-primary text-primary-foreground" : i < stepIndex ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
              aria-current={step === s.id ? "step" : undefined}
            >
              {i < stepIndex ? <Check className="size-3" /> : <span>{i + 1}</span>}
              {s.label}
            </button>
            {i < STEPS.length - 1 ? <span className="h-px w-4 bg-border" /> : null}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border bg-card p-5">
        {stepError ? (
          <div className="mb-4">
            <Alert variant="error" title="Please fix the following">
              {stepError}
            </Alert>
          </div>
        ) : null}
        {step === "basic" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required className="sm:col-span-2">
              <Input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 2 Bedroom Apartment in Kilimani" />
            </Field>
            <Field label="Property type" required className="sm:col-span-2">
              <Select value={data.propertyTypeId} onChange={(e) => set("propertyTypeId", e.target.value)}>
                <option value="">Select type…</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Description" required className="sm:col-span-2">
              <Textarea rows={5} value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the property, its condition, nearby amenities and what makes it special." />
            </Field>
          </div>
        ) : step === "location" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {input("county", "County")}
            {input("city", "City / Town")}
            {input("neighborhood", "Neighborhood")}
            {input("address", "Street address (optional)")}
            {input("latitude", "Latitude (optional)", { placeholder: "-1.2921" })}
            {input("longitude", "Longitude (optional)", { placeholder: "36.8219" })}
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Coordinates are used to show the location on a map. Exact coordinates are never
              displayed publicly if the property is marked approximate.
            </p>
          </div>
        ) : step === "pricing" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly rent (KSh)" required>
              <Input inputMode="numeric" value={data.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value.replace(/\D/g, ""))} placeholder="45000" />
            </Field>
            <Field label="Deposit (KSh)">
              <Input inputMode="numeric" value={data.depositAmount} onChange={(e) => set("depositAmount", e.target.value.replace(/\D/g, ""))} placeholder="45000" />
            </Field>
            <Field label="Available from" className="sm:col-span-2">
              <Input type="date" value={data.availabilityDate} onChange={(e) => set("availabilityDate", e.target.value)} />
            </Field>
          </div>
        ) : step === "specs" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {input("bedrooms", "Bedrooms", { inputMode: "numeric", placeholder: "2" })}
            {input("bathrooms", "Bathrooms", { inputMode: "numeric", placeholder: "2" })}
            {input("size", "Size (m²)", { inputMode: "decimal", placeholder: "85" })}
            <Field label="Furnished">
              <div className="flex h-10 items-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.furnished}
                  onClick={() => set("furnished", !data.furnished)}
                  className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", data.furnished ? "bg-primary" : "bg-input")}
                >
                  <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", data.furnished ? "translate-x-5" : "translate-x-0.5")} />
                </button>
                <span className="ml-2 text-sm text-muted-foreground">{data.furnished ? "Yes, furnished" : "Not furnished"}</span>
              </div>
            </Field>
          </div>
        ) : step === "amenities" ? (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Select all amenities available in this property.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {amenities.map((a) => {
                const active = data.amenityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set("amenityIds", active ? data.amenityIds.filter((x) => x !== a.id) : [...data.amenityIds, a.id])}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      active ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted"
                    )}
                  >
                    {active ? <Check className="size-4" /> : <span className="size-4 rounded border border-input" />}
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : step === "images" ? (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Add up to 10 photos. The first photo is your cover image — tap the star to choose a different primary.
            </p>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary",
                uploading && "opacity-60"
              )}
            >
              <UploadCloud className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium">{uploading ? "Uploading…" : "Click to upload images"}</span>
              <span className="text-xs text-muted-foreground">JPG/PNG/WebP · optimized automatically · max 10MB each</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
            </label>
            {images.length > 0 ? (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <li key={img.id} className="group relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" aria-label="Set as primary" onClick={() => makePrimary(img)} className="rounded-full bg-white p-2 hover:bg-white/90">
                        <Star className={cn("size-4", img.is_primary ? "fill-amber-400 text-amber-400" : "text-foreground")} />
                      </button>
                      <button type="button" aria-label="Delete image" onClick={() => deleteImage(img)} className="rounded-full bg-white p-2 hover:bg-white/90">
                        <Trash2 className="size-4 text-destructive" />
                      </button>
                    </div>
                    {img.is_primary ? (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">{data.title || "Untitled property"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[data.neighborhood, data.city, data.county].filter(Boolean).join(", ") || "No location set"}
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">{formatMoney(Number(data.monthlyRent) || 0)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {data.bedrooms ? <span>{data.bedrooms} beds</span> : null}
                  {data.bathrooms ? <span>{data.bathrooms} baths</span> : null}
                  {data.furnished ? <span>Furnished</span> : null}
                  {data.size ? <span>{data.size} m²</span> : null}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Amenities ({data.amenityIds.length})</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.amenityIds.map((id) => {
                    const a = amenities.find((x) => x.id === id);
                    return a ? (
                      <span key={id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{a.name}</span>
                    ) : null;
                  })}
                  {data.amenityIds.length === 0 ? <span className="text-xs text-muted-foreground">None selected</span> : null}
                </div>
                <h4 className="mt-4 text-sm font-semibold">Images ({images.length})</h4>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {images.slice(0, 5).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img.id} src={img.url} alt="" className="h-16 w-20 rounded-md object-cover" />
                  ))}
                  {images.length === 0 ? <span className="text-xs text-muted-foreground">No images yet — add them in the Images step.</span> : null}
                </div>
              </div>
            </div>
            {images.length === 0 ? (
              <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
                Tip: properties with photos get significantly more interest. Add images before submitting.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" onClick={back} disabled={stepIndex === 0}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {propertyId ? (
            <Button variant="ghost" onClick={() => void persist(step)} loading={saving}>
              <Save className="size-4" /> Save
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          {step === "review" ? (
            <>
              <Button variant="outline" onClick={() => router.push("/dashboard/agent/properties")}>
                Cancel
              </Button>
              <Button onClick={submitForReview} loading={submitting}>
                <Check className="size-4" /> Submit for review
              </Button>
            </>
          ) : (
            <Button onClick={() => void next()} loading={saving}>
              Continue <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
