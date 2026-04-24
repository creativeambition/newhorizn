import { SubscriptionStatus } from "../types";
import type { AccountLimits, Plans } from "../types";

/** Per-plan media upload limits for room media managers. */
export type MediaLimits = {
  /** Max image uploads per room. 999_999 = unlimited. */
  photosPerRoom: number;
  /** Max image uploads per accommodation cover. */
  photosPerAccommodation: number;
  /** Max video uploads per room. 0 = not allowed. 999_999 = unlimited. */
  videosPerRoom: number;
  /** Max bytes for a single image file. */
  maxImageBytes: number;
  /** Max bytes for a single video file. 0 = videos not allowed. */
  maxVideoBytes: number;
};

const MB = 1_048_576;

export const MEDIA_LIMITS: Record<Plans, MediaLimits> = {
  starter: {
    photosPerRoom: 999_999,
    photosPerAccommodation: 999_999,
    videosPerRoom: 999_999,
    maxImageBytes: 50 * MB,
    maxVideoBytes: 500 * MB,
  },
  standard: {
    photosPerRoom: 999_999,
    photosPerAccommodation: 999_999,
    videosPerRoom: 999_999,
    maxImageBytes: 50 * MB,
    maxVideoBytes: 500 * MB,
  },
  pro: {
    photosPerRoom: 999_999,
    photosPerAccommodation: 999_999,
    videosPerRoom: 999_999,
    maxImageBytes: 50 * MB,
    maxVideoBytes: 500 * MB,
  },
};

export function getMediaLimitsForPlan(plan?: string | null): MediaLimits {
  if (!plan) return MEDIA_LIMITS.starter;
  const key = plan === "free" ? "starter" : plan;
  return MEDIA_LIMITS[key as Plans] ?? MEDIA_LIMITS.starter;
}

export const subscriptionFeatures = {
  starter: [
    `Unlimited rooms & guests`,
    `First 20 bookings free`,
    `Standard support`,
    `Basic analytics`,
  ],
  standard: [
    `Unlimited rooms & guests`,
    `First 20 bookings free`,
    `Priority support`,
    `Advanced reporting`,
  ],
  pro: [
    `Unlimited everything`,
    `First 20 bookings free`,
    `24/7 Priority support`,
    `Custom branding & analytics`,
  ],
};

/** Limits per plan: rooms, guests, bookings. Pro uses a high sentinel for "unlimited". */
export const PLAN_LIMITS: Record<Plans, AccountLimits> = {
  starter: { roomsLimit: 999_999, guestsLimit: 999_999, bookingsLimit: 999_999 },
  standard: { roomsLimit: 999_999, guestsLimit: 999_999, bookingsLimit: 999_999 },
  pro: { roomsLimit: 999_999, guestsLimit: 999_999, bookingsLimit: 999_999 },
};

export function getLimitsForPlan(
  plan: string | undefined | null,
): AccountLimits {
  if (!plan) return PLAN_LIMITS.starter;
  const key = plan === "free" ? "starter" : plan;
  return PLAN_LIMITS[key as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter;
}

type PlanDocData = {
  plan?: string;
  planExpiry?: unknown;
  planStatus?: string;
} | null;

/** Normalize plan value from DB (e.g. "free" -> "starter"). */
function normalizePlan(plan: string | undefined): SubscriptionStatus["plan"] {
  if (!plan) return "starter";
  if (plan === "free") return "starter";
  if (plan === "starter" || plan === "pro" || plan === "standard") return plan;
  return "starter";
}

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  )
    return (value as { toDate: () => Date }).toDate();
  if (typeof value === "number") return new Date(value);
  return null;
}

/**
 * Compute subscription status from accommodation document data (sync).
 * Pass snapshot data from Firestore; normalizes "free" -> "starter" and handles expiry.
 */
export function checkSubscriptionStatus(
  data: PlanDocData,
): SubscriptionStatus | null {
  if (!data) return null;

  const plan = normalizePlan(data.plan);
  const planExpiry = toDate(data.planExpiry);
  const now = new Date();

  return {
    plan,
    planExpiry: planExpiry ?? toDate(data.planExpiry) ?? null,
    planStatus: "active", // Unlimited model: always active
  };
}
