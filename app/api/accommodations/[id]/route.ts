import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Accommodation, Room } from "@/lib/types";
import { getRoomMinPrice } from "@/lib/helpers/pricing";
import { calculateAvailableBeds } from "@/lib/helpers/room-availability";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: accommodationData, error: accError } = await supabase
      .from("accommodations")
      .select("*")
      .eq("id", id)
      .single();

    if (accError || !accommodationData) {
      return NextResponse.json(
        { error: "Accommodation not found" },
        { status: 404 },
      );
    }

    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .eq("accommodation_id", accommodationData.id);

    const rooms: Room[] = [];
    let totalAvailableBeds = 0;
    let minPrice = Infinity;

    if (roomsData && !roomsError) {
      const roomIds = roomsData.map((r) => r.id);
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, room_id, check_in, check_out, status")
        .in("room_id", roomIds)
        .in("status", ["active", "upcoming", "pending"]);

      const bookings = (bookingsData || []).map((b: any) => ({
        id: b.id,
        roomId: b.room_id,
        checkIn: b.check_in,
        checkOut: b.check_out,
        status: b.status,
        // stub unused BookingDetails fields
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

      roomsData.forEach((roomData) => {
        const room = { ...roomData } as Room;
        const available = calculateAvailableBeds(room, bookings);
        rooms.push({ ...room, availableBeds: available });
        totalAvailableBeds += available;
        const roomMin = getRoomMinPrice(
          room,
          accommodationData.globalConfig?.globalPricing,
        );
        if (roomMin > 0) minPrice = Math.min(minPrice, roomMin);
      });
    }

    const accommodation: Accommodation & {
      totalAvailableBeds: number;
      minPrice: number;
    } = {
      id: accommodationData.id,
      owner_id: accommodationData.owner_id || "",
      accommodationName:
        accommodationData.accommodationName || "Unknown Accommodation",
      listingType: accommodationData.listingType || "hostel",
      address: accommodationData.address || "",
      phone: accommodationData.phone || "",
      email: accommodationData.email || "",
      manager: accommodationData.manager || "",
      rooms,
      totalAvailableBeds,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      isVerified: accommodationData.isVerified === true,
      description: accommodationData.description || "",
      media: accommodationData.media || [],
      nearbyInstitutions: accommodationData.nearbyInstitutions || [],
      isLocationVerified: accommodationData.isLocationVerified === true,
      globalConfig: accommodationData.globalConfig || null,
      currency: accommodationData.currency || "GHS",
    };

    return NextResponse.json(accommodation);
  } catch (error) {
    console.error("Error fetching accommodation:", error);
    return NextResponse.json(
      { error: "Failed to fetch accommodation" },
      { status: 500 },
    );
  }
}
