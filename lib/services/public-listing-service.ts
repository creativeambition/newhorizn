import { createClient } from "../supabase/client";
import type { Room, BookingDetails, PricingConfig } from "../types";
import { calculateAvailableBeds } from "../helpers/room-availability";

export type PublicListing = Room & {
  accommodationId: string;
  accommodationName: string;
  accommodationAddress: string;
  accommodationPhone: string;
  isVerified?: boolean;
  currency?: string;
  globalConfig?: {
    globalPricing?: PricingConfig;
    semesterEndDate?: string;
  };
};

async function fetchAvailableBeds(
  supabase: any,
  roomId: string,
  room: Room,
): Promise<number> {
  const { data } = await supabase
    .from("bookings")
    .select("id, room_id, check_in, check_out, status")
    .eq("room_id", roomId)
    .in("status", ["active", "upcoming"]);

  const bookings: BookingDetails[] = (data || []).map((b: any) => ({
    id: b.id,
    roomId: b.room_id,
    checkIn: b.check_in,
    checkOut: b.check_out,
    status: b.status,
    guestId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomName: "",
    roomType: "",
    roomPrice: 0,
    totalPrice: 0,
    paymentType: "",
    bookingType: "regular" as const,
    paymentStatus: "pending" as const,
    paymentAmount: 0,
    paymentNotes: "",
    notes: "",
    createdAt: new Date(),
  }));

  return calculateAvailableBeds(room, bookings);
}

export async function getAllPublicListings(): Promise<PublicListing[]> {
  const supabase = createClient();
  const listings: PublicListing[] = [];

  const { data: accommodations, error: authError } = await supabase.from(
    "accommodations",
  ).select(`
      id,
      owner_id,
      "accommodationName",
      address,
      phone,
      "globalConfig"`);

  if (accommodations) {
    for (const accommodation of accommodations) {
      const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("accommodation_id", accommodation.id);

      for (const roomData of rooms || []) {
        const room = { ...roomData } as Room;
        const availableBeds = await fetchAvailableBeds(supabase, room.id, room);
        listings.push({
          ...room,
          availableBeds,
          accommodationId: accommodation.id,
          accommodationName:
            accommodation.accommodationName || "Unknown Accommodation",
          accommodationAddress: accommodation.address || "",
          accommodationPhone: accommodation.phone || "",
          currency: accommodation.currency || "GHS",
          globalConfig: accommodation.globalConfig,
        });
      }
    }
  }

  return listings;
}

export async function getListingById(
  accommodationId: string,
  roomId: string,
): Promise<PublicListing | null> {
  const supabase = createClient();
  const { data: accommodation, error: accError } = await supabase
    .from("accommodations")
    .select("*")
    .eq("id", accommodationId)
    .single();

  if (accError || !accommodation) return null;

  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("accommodation_id", accommodationId)
    .eq("id", roomId)
    .single();

  if (roomError || !roomData) return null;

  const room = { ...roomData } as Room;
  const availableBeds = await fetchAvailableBeds(supabase, room.id, room);

  return {
    ...room,
    availableBeds,
    accommodationId,
    accommodationName:
      accommodation.accommodationName || "Unknown Accommodation",
    accommodationAddress: accommodation.address || "",
    accommodationPhone: accommodation.phone || "",
    isVerified: accommodation.isVerified === true,
    currency: accommodation.currency || "GHS",
    globalConfig: accommodation.globalConfig,
  };
}
