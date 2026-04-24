import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateRoomPrice } from "@/lib/helpers/pricing";
import type { PricingConfig, Room } from "@/lib/types";

const COMMISSION_RATE = process.env.COMMISSION_RATE
  ? parseFloat(process.env.COMMISSION_RATE)
  : 0.01;
const FREE_BOOKINGS = process.env.FREE_BOOKINGS
  ? parseInt(process.env.FREE_BOOKINGS, 10)
  : 20;
const SERVICE_FEE = process.env.SERVICE_FEE
  ? parseFloat(process.env.SERVICE_FEE)
  : 20;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    if (!roomId)
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });

    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("check_in, check_out, status, room_id")
      .eq("room_id", roomId)
      .in("status", ["active", "upcoming", "pending"]);

    const bookings = (data || []).map((b: any) => ({
      id: b.room_id + b.check_in,
      roomId: b.room_id,
      checkIn: b.check_in,
      checkOut: b.check_out,
      status: b.status,
      // stub required BookingDetails fields
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

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accommodationId,
      roomId,
      pricingType,
      bookingType,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
    } = body;

    if (
      !accommodationId ||
      !roomId ||
      !pricingType ||
      !bookingType ||
      !guestName ||
      !guestEmail
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: accommodation } = await supabase
      .from("accommodations")
      .select("globalConfig, currency")
      .eq("id", accommodationId)
      .single();

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .eq("accommodation_id", accommodationId)
      .single();

    if (!room)
      return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const globalPricing: PricingConfig | undefined =
      accommodation?.globalConfig?.globalPricing;
    const currency = accommodation?.currency || "GHS";

    // Determine price from pricingType (e.g. "night", "week", "month", "semester", "year", "custom-<id>")
    let stayType: "night" | "week" | "month" | "semester" | "year" | "custom" =
      "night";
    let customPeriodId: string | undefined;

    if (pricingType.startsWith("custom-")) {
      stayType = "custom";
      customPeriodId = pricingType.replace("custom-", "");
    } else {
      stayType = pricingType as typeof stayType;
    }

    // Validate booking type (legacy support for student vs regular, though pricing is now unified)
    if (!["student", "regular"].includes(bookingType)) {
      return NextResponse.json(
        { error: "Invalid booking type" },
        { status: 400 },
      );
    }

    const isStudentBooking = bookingType === "student";

    // For nightly bookings, calculate duration from the actual dates
    let duration = 1;
    if (stayType === "night" && checkIn && checkOut) {
      duration = Math.max(
        1,
        Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            86400000,
        ),
      );
    }

    const roomChargeAmount = calculateRoomPrice(
      room as Room,
      stayType,
      duration,
      globalPricing,
      customPeriodId,
    );

    if (!roomChargeAmount || roomChargeAmount <= 0) {
      return NextResponse.json(
        { error: "No price configured for this option" },
        { status: 400 },
      );
    }

    // Count existing bookings for this accommodation to determine commission
    const { count: bookingCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("accommodation_id", accommodationId)
      .neq("status", "pending");

    const hasExceededFreeBookings = (bookingCount ?? 0) >= FREE_BOOKINGS;
    const commission = hasExceededFreeBookings
      ? roomChargeAmount * COMMISSION_RATE
      : 0;
    const serviceFee = SERVICE_FEE;

    // Guest pays ONLY service fee upfront (prevents spam, creates pending booking)
    const serviceFeeAmount = serviceFee;
    const paymentReference =
      body.bookingId ||
      `nhz_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    const paymentInitializationResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: guestEmail,
          amount: Math.round(serviceFeeAmount * 100),
          currency: currency ?? "GHS",
          reference: paymentReference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success`,
          metadata: {
            accommodationId,
            roomId,
            pricingType,
            bookingType,
            guestName,
            guestPhone: guestPhone || "",
            roomPrice: roomChargeAmount,
            serviceFee,
            commission,
            isStudentBooking,
            currency,
            checkIn: checkIn || null,
            checkOut: checkOut || null,
          },
        }),
      },
    );

    const paymentInitializationData =
      await paymentInitializationResponse.json();

    if (!paymentInitializationData.status) {
      return NextResponse.json(
        { error: paymentInitializationData.message || "Payment init failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      authorization_url: paymentInitializationData.data.authorization_url,
      reference: paymentReference,
      amount: serviceFee,
      serviceFee,
      currency,
    });
  } catch (error) {
    console.error("Guest booking init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
