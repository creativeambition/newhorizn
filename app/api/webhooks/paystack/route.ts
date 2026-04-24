import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify Paystack signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Only handle successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ status: "ignored" });
    }

    const data = event.data;
    const metadata = data.metadata || {};
    const supabase = createServiceClient();

    // HANDLE VERIFICATION PAYMENT
    if (metadata.type === "verification") {
      const { accommodationId } = metadata;
      
      // Mark as verified
      const { error } = await supabase
        .from("accommodations")
        .update({
          payout_verified: true
        })
        .eq("id", accommodationId);

      if (error) {
        console.error("Webhook verification update error:", error);
        return NextResponse.json({ error: "Verification update failed" }, { status: 500 });
      }

      // Initiate refund for the verification charge
      try {
        const refundRes = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction: data.reference,
            amount: data.amount // Refund the full verification charge
          }),
        });

        const refundData = await refundRes.json();
        console.log("Verification refund initiated:", { status: refundRes.status, data: refundData });
      } catch (refundError) {
        console.error("Failed to initiate verification refund:", refundError);
        // Don't fail the verification if refund fails
      }

      return NextResponse.json({ status: "success", type: "verification_completed" });
    }

    // HANDLE RENT PAYMENT (SPLIT PAYMENT FOR EXISTING BOOKING)
    if (metadata.type === "rent_payment") {
      const { bookingId } = metadata;
      
      const { error } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid_in_full",
          payment_amount: data.amount / 100, // Paystack amount is in kobo/pesewas
          status: "upcoming",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Webhook rent update error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      return NextResponse.json({ status: "success", type: "rent_updated" });
    }

    // DEFAULT: HANDLE INITIAL SERVICE FEE (CREATE NEW BOOKING)
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
      checkOut: metaCheckOut
    } = metadata;

    const reference = data.reference;
    const bookingId = reference;

    // Deduplication check
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .single();

    if (existing) {
      return NextResponse.json({ status: "already_processed" });
    }

    // Fetch room details for the record
    const { data: room } = await supabase
      .from("rooms")
      .select("name, type")
      .eq("id", roomId)
      .single();

    const checkIn = metaCheckIn || new Date().toISOString();
    const checkOut = metaCheckOut || null;

    // Insert pending booking
    const { error: insertError } = await supabase.from("bookings").insert({
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

    if (insertError) {
      console.error("Webhook booking insertion error:", insertError);
      return NextResponse.json({ error: "Insertion failed" }, { status: 500 });
    }

    return NextResponse.json({ status: "success", type: "booking_created" });
  } catch (error) {
    console.error("Paystack Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
