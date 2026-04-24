// Guest types
export type Guest = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status?: string;
  address?: string;
};

export type NewGuestData = {
  name: string;
  email?: string;
  phone: string;
  address?: string;
};

// Room types
export type PricingConfig = {
  perNight?: number;
  perWeek?: number;
  perMonth?: number;
  perSemester?: number;
  perYear?: number;
  customPeriods?: {
    id: string;
    amount: number;
    /** Duration in whole units (see durationUnit). Prefer using `duration` and `durationUnit` for new periods. */
    duration?: number;
    /** Unit for duration: 'months' or 'years'. Defaults to 'years' when omitted. */
    durationUnit?: "month(s)" | "year(s)";
    /** Backwards-compatible years field (deprecated) */
    years?: number;
    label?: string;
  }[];
};

export type Room = {
  id: string;
  name: string;
  type: string;
  pricing?: PricingConfig;
  /** Media items for room (image URLs, optional title/description) */
  media?: {
    url: string;
    title?: string;
    description?: string;
  }[];
  /** Public description shown on explore/listing pages */
  description?: string;
  capacity: number;
  availableBeds: number;
  /** Number of beds in private rooms (for display purposes only) */
  beds?: number;
  amenities: string[];
};

export type AccommodationGlobalConfig = {
  globalPricing?: PricingConfig;
  semesterEndDate?: string;
};

// Booking types
export type PaymentStatus =
  | "pending"
  | "deposit_paid"
  | "installment_plan"
  | "paid_in_full";

export type BookingStatus =
  | "pending"
  | "declined"
  | "upcoming"
  | "active"
  | "completed";

export type BookingType = "student" | "regular";

export type BookingDetails = {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomName: string;
  roomType: string;
  roomPrice: number;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  paymentType: string;
  bookingType: BookingType;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentNotes: string;
  createdAt: Date;
  notes: string;
  commission?: number;
};

export type NewBookingData = {
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  bookingType: BookingType;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentNotes: string;
  totalPrice: number;
  paymentType: string;
  commission?: number;
};

/** Listing type shown in explore filters (apartment, hostel, etc.). */
export type ListingType =
  | "hostel"
  | "apartment"
  | "hotel"
  | "guesthouse"
  | "studio"
  | "other";

export type Accommodation = {
  id: string;
  owner_id: string;
  accommodationName: string;
  /** Listing type for filtering (hostel, apartment, guesthouse, etc.). */
  listingType?: ListingType;
  address: string;
  manager: string;
  email: string;
  phone: string;
  isVerified?: boolean;
  globalConfig?: AccommodationGlobalConfig;
  description?: string;
  nearbyInstitutions?: string[];
  isLocationVerified?: boolean;
  media?: { url: string; title?: string; description?: string }[];
  managerImage?: string;
  currency?: string;
  rooms?: Room[];
  payout_network?: string;
  payout_number?: string;
  paystack_subaccount_code?: string;
  payout_verified?: boolean;
};

export type SubscriptionStatus = {
  plan: "starter" | "free" | "pro" | "standard";
  planExpiry: Date | string | null;
  planStatus: "pending" | "active" | "expired" | "canceled";
};

export type SemesterInfo = {
  name: string;
  startDate: Date | string;
  endDate: Date | string;
};

export type AccountLimits = {
  roomsLimit: number;
  guestsLimit: number;
  bookingsLimit: number;
};

export enum Plans {
  BASE = "starter",
  PRO = "pro",
  STANDARD = "standard",
}

export const KNOWN_INSTITUTIONS = [
  "KNUST",
  "University of Ghana",
  "UCC",
  "GCTU",
  "UPSA",
  "GIJ",
  "ATU",
  "UEW",
  "UMaT",
  "UENR",
  "UHAS",
  "Central University",
  "Ashesi University",
  "Pentecost University",
  "Valley View University",
  "Radford University",
];
