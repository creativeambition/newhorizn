import type { Room, PricingConfig } from "../types";

export function calculateRoomPrice(
  room: Room,
  stayType: "night" | "week" | "month" | "semester" | "year" | "custom",
  duration?: number,
  globalPricing?: PricingConfig,
  customPeriodId?: string,
): number {
  // Room-specific pricing fields override global pricing fields
  const r = room.pricing;
  const g = globalPricing;

  switch (stayType) {
    case "night":
      return (r?.perNight ?? g?.perNight ?? 0) * (duration || 1);
    case "week":
      return (r?.perWeek ?? g?.perWeek ?? 0) * (duration || 1);
    case "month":
      return (r?.perMonth ?? g?.perMonth ?? 0) * (duration || 1);
    case "semester":
      return r?.perSemester ?? g?.perSemester ?? 0;
    case "year":
      return (r?.perYear ?? g?.perYear ?? 0) * (duration || 1);
    case "custom":
      if (customPeriodId) {
        const customPeriod =
          r?.customPeriods?.find((p) => p.id === customPeriodId) ??
          g?.customPeriods?.find((p) => p.id === customPeriodId);
        return customPeriod?.amount || 0;
      }
      return 0;
    default:
      return 0;
  }
}

export function getAvailablePricingOptions(
  room: Room,
  globalPricing?: PricingConfig,
): string[] {
  // Room-specific pricing takes precedence over global pricing
  const r = room.pricing;
  const g = globalPricing;

  const options: string[] = [];
  if (r?.perNight || g?.perNight) options.push("Per Night");
  if (r?.perWeek || g?.perWeek) options.push("Per Week");
  if (r?.perMonth || g?.perMonth) options.push("Per Month");
  if (r?.perSemester || g?.perSemester) options.push("Per Semester");
  if (r?.perYear || g?.perYear) options.push("Per Year");

  const customPeriods = [...(r?.customPeriods || [])];
  if (g?.customPeriods) {
    g.customPeriods.forEach((gp) => {
      if (!customPeriods.find((rp) => rp.id === gp.id)) {
        customPeriods.push(gp);
      }
    });
  }

  if (customPeriods.length) {
    customPeriods.forEach((period) => {
      const dur = (period as any).duration ?? (period as any).years;
      const unit = (period as any).durationUnit ?? "years";
      const label =
        period.label ||
        `${dur} ${unit === "months" ? "Month" : "Year"}${dur !== 1 ? "s" : ""}`;
      options.push(label);
    });
  }

  return options;
}

export function formatPrice(amount: number, currency = "GHS"): string {
  return `${currency} ${amount.toLocaleString()}`;
}

/** Representative price for display (e.g. room selector). Uses first available: perNight, perMonth, perSemester, perYear. */
export function getRoomDisplayPrice(
  room: Room,
  globalPricing?: PricingConfig,
): number {
  const r = room.pricing;
  const g = globalPricing;

  return (
    r?.perNight ??
    g?.perNight ??
    r?.perMonth ??
    g?.perMonth ??
    r?.perSemester ??
    g?.perSemester ??
    r?.perYear ??
    g?.perYear ??
    0
  );
}

/** Per-night rate for a room by booking type (for storing roomPrice on booking). */
export function getRoomPerNightRate(
  room: Room,
  globalPricing?: PricingConfig,
): number {
  const r = room.pricing;
  const g = globalPricing;
  return r?.perNight ?? g?.perNight ?? 0;
}

/** Minimum price across all pricing options (for search/filter). */
export function getRoomMinPrice(
  room: Room,
  globalPricing?: PricingConfig,
): number {
  const r = room.pricing;
  const g = globalPricing;

  const values = [
    r?.perNight,
    g?.perNight,
    r?.perWeek,
    g?.perWeek,
    r?.perMonth,
    g?.perMonth,
    r?.perSemester,
    g?.perSemester,
    r?.perYear,
    g?.perYear,
    ...(r?.customPeriods?.map((p) => p.amount) || []),
    ...(g?.customPeriods?.map((p) => p.amount) || []),
  ].filter((n): n is number => typeof n === "number" && n > 0);
  return values.length > 0 ? Math.min(...values) : 0;
}
