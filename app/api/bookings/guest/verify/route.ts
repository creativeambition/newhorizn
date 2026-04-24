import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();
    if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    const verifyJson = await verifyRes.json();

    if (!verifyJson.status || verifyJson.data?.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    const data = verifyJson.data;

    const metadata = data.metadata || {};
    const type = metadata.type;
    const {
      accommodationId,
      roomId,
      pricingType,
      guestName,
      guestPhone,
      roomPrice,
      serviceFee,
      commission,
      isStudent,
      currency,
      checkIn: metaCheckIn,
      checkOut: metaCheckOut,
    } = metadata;

    const supabase = await createClient();
    const bookingId = reference;

    const mapBooking = (bookingRow: any) => ({
      id: bookingRow.id,
      guestName: bookingRow.guest_name,
      accommodationId: bookingRow.accommodation_id,
      accommodationName: bookingRow.accommodation?.accommodationName || "",
      roomId: bookingRow.room_id,
      roomName: bookingRow.room_name,
      checkIn: bookingRow.check_in,
      checkOut: bookingRow.check_out,
      currency: bookingRow.accommodation?.currency || currency || "GHS",
      totalPrice: bookingRow.total_price,
      status: bookingRow.status,
      paymentType: bookingRow.payment_type,
      bookingType: bookingRow.booking_type,
      paymentStatus: bookingRow.payment_status,
      paymentAmount: bookingRow.payment_amount,
      serviceFee: metadata.serviceFee || 0,
      imageUrl: bookingRow.room?.media?.[0]?.url || null,
    });

    // Handle rent payment confirmation for an existing booking
    if (type === "rent_payment") {
      const rentBookingId = metadata.bookingId;
      if (!rentBookingId) {
        return NextResponse.json({ error: "Missing bookingId in metadata" }, { status: 400 });
      }

      const { data: existingBooking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          id,
          accommodation_id,
          room_id,
          guest_name,
          room_name,
          check_in,
          check_out,
          status,
          total_price,
          payment_type,
          booking_type,
          payment_status,
          payment_amount,
          accommodation:accommodations(accommodationName, currency),
          room:rooms(media)
        `)
        .eq("id", rentBookingId)
        .single();

      if (bookingError || !existingBooking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const paymentAmount = data.amount / 100;
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid_in_full",
          payment_amount: paymentAmount,
          status: "upcoming",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rentBookingId);

      if (updateError) {
        console.error("Rent payment update error:", updateError);
        return NextResponse.json({ error: "Failed to update booking record" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        bookingId: rentBookingId,
        booking: mapBooking({
          ...existingBooking,
          payment_status: "paid_in_full",
          payment_amount: paymentAmount,
          status: "upcoming",
        }),
      });
    }

    // Deduplication: Check if booking already exists (e.g. webhook finished first)
    const { data: existing } = await supabase
      .from("bookings")
      .select(`
        id,
        accommodation_id,
        room_id,
        guest_name,
        room_name,
        check_in,
        check_out,
        status,
        total_price,
        payment_type,
        booking_type,
        payment_status,
        payment_amount,
        accommodation:accommodations(accommodationName, currency),
        room:rooms(media)
      `)
      .eq("id", bookingId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        bookingId,
        booking: mapBooking(existing),
      });
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("name, type, media, accommodation:accommodations(accommodationName)")
      .eq("id", roomId)
      .eq("accommodation_id", accommodationId)
      .single();

    const checkIn = metaCheckIn || new Date().toISOString();
    const checkOut = metaCheckOut || null;

    await supabase.from("bookings").insert({
      id: bookingId,
      accommodation_id: accommodationId,
      guest_id: null,
      guest_name: guestName,
      guest_email: data.customer.email,
      guest_phone: guestPhone,
      room_id: roomId,
      room_name: room?.name || "",
      room_type: room?.type || "",
      room_price: roomPrice,
      check_in: checkIn,
      check_out: checkOut,
      status: "pending",
      total_price: roomPrice,
      payment_type: pricingType,
      booking_type: isStudent ? "student" : "regular",
      payment_status: "pending",
      payment_amount: 0,
      payment_notes: "",
      notes: "",
      commission,
      created_at: new Date().toISOString(),
    });

    const accommodationName = (room as any)?.accommodation?.accommodationName || "";

    return NextResponse.json({
      success: true,
      bookingId,
      booking: {
        id: bookingId,
        guestName,
        accommodationId,
        accommodationName,
        roomId,
        roomName: room?.name || "",
        checkIn,
        checkOut,
        currency,
        serviceFee,
        totalPrice: roomPrice,
        status: "pending",
        paymentStatus: "pending",
        imageUrl: room?.media?.[0]?.url || null,
      }
    });
  } catch (error) {
    console.error("Booking verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
