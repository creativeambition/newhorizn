import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch booking details and host subaccount
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        total_price,
        guest_email,
        accommodation:accommodations(
          id,
          paystack_subaccount_code,
          currency,
          accommodationName
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const accommodation = booking.accommodation as any;
    const subaccountCode = accommodation.paystack_subaccount_code;

    if (!subaccountCode) {
      return NextResponse.json({
        error: "Rent payment is currently unavailable."
      }, { status: 400 });
    }

    // Initialize Paystack Split Payment
    const amount = booking.total_price;
    const currency = accommodation.currency || "GHS";

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: booking.guest_email,
        amount: Math.round(amount * 100),
        currency: currency,
        subaccount: subaccountCode, // The Paystack magic: splits the payment automatically!
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?rent=true`,
        metadata: {
          bookingId: booking.id,
          type: "rent_payment",
          accommodationName: accommodation.accommodationName,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || "Failed to initialize payment" }, { status: 500 });
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    });

  } catch (error) {
    console.error("Rent payment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
