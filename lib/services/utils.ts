import { createClient } from "../supabase/client";
import { BookingDetails } from "../types";

async function fetchBookings(
  accommodationId: string,
): Promise<BookingDetails[]> {
  try {
    const supabase = createClient();
    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("accommodation_id", accommodationId);

    if (error) throw error;

    return bookingsData.map((b: any) => ({
      id: b.id,
      guestId: b.guest_id,
      guestName: b.guest_name,
      guestEmail: b.guest_email,
      guestPhone: b.guest_phone,
      roomId: b.room_id,
      roomName: b.room_name,
      roomType: b.room_type,
      roomPrice: b.room_price,
      checkIn: b.check_in,
      checkOut: b.check_out,
      status: b.status,
      totalPrice: b.total_price,
      paymentType: b.payment_type,
      bookingType: b.booking_type,
      paymentStatus: b.payment_status,
      paymentAmount: b.payment_amount,
      paymentNotes: b.payment_notes,
      notes: b.notes,
      createdAt: new Date(b.created_at),
    })) as BookingDetails[];
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}

export { fetchBookings };
