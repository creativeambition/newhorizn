import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    commissionRate: process.env.COMMISSION_RATE
      ? parseFloat(process.env.COMMISSION_RATE)
      : 0.01,
    freeBookings: process.env.FREE_BOOKINGS
      ? parseInt(process.env.FREE_BOOKINGS, 10)
      : 20,
    serviceFee: process.env.SERVICE_FEE
      ? parseFloat(process.env.SERVICE_FEE)
      : 20,
  });
}
