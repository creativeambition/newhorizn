import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Public endpoint to fetch non-sensitive booking status for the accountless guest flow.
 * Takes an array of booking IDs (UUIDs) from localStorage.
 */
export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ bookings: [] });
    }

    const supabase = await createClient();

    // Fetch basic info for the requested booking IDs
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        accommodation_id,
        room_id,
        status,
        payment_status,
        total_price,
        payment_amount,
        check_in,
        check_out,
        room_name,
        accommodation:accommodations(accommodationName, currency, "managerImage"),
        room:rooms(media)
      `)
      .in("id", ids);

    if (error) {
      console.error("Public status fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch booking statuses" }, { status: 500 });
    }

    // Map DB fields to the format expected by the frontend GuestBooking type
    const mappedBookings = (data || []).map((b: any) => ({
      id: b.id,
      accommodationId: b.accommodation_id,
      roomId: b.room_id,
      status: b.status,
      paymentStatus: b.payment_status,
      totalPrice: b.total_price || 0,
      paymentAmount: b.payment_amount || 0,
      checkIn: b.check_in,
      checkOut: b.check_out,
      roomName: b.room_name,
      accommodationName: b.accommodation?.accommodationName || "Unknown",
      currency: b.accommodation?.currency || "GHS",
      managerImage: b.accommodation?.managerImage || null,
      imageUrl: b.room?.media?.[0]?.url || null,
    }));

    return NextResponse.json({ bookings: mappedBookings });
  } catch (error) {
    console.error("Public status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
