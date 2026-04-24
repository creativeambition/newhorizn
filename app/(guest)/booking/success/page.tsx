"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, XCircle, Loader2, Phone, ClipboardCheck, BellRing, CreditCard, BadgeCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { guestBookingService } from "@/lib/services/guest-booking-service";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const isRentPayment = searchParams.get("rent") === "true";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!reference) { setStatus("error"); return; }

    fetch("/api/bookings/guest/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBooking(d.booking);
          setStatus("success");
          // Save or refresh the local guest booking record
          guestBookingService.addBooking(d.booking);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [reference]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 p-8 bg-background/50 backdrop-blur-sm rounded-3xl">
        <Loader2 className="h-16 w-16 animate-spin text-primary stroke-[1.5]" />
        <div className="text-center space-y-1">
          <p className="text-xl font-bold">Verifying Payment</p>
          <p className="text-muted-foreground animate-pulse">This normally takes a few seconds...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-background px-4 py-12">


        <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative flex flex-col items-center text-center font-sans">
            <div className="flex items-center justify-center -space-x-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/70 p-3 shadow-xl border border-primary/5 z-10 rotate-[-4deg] flex items-center justify-center">
                <img src="/logo.svg" alt="App Logo" className="w-full h-full object-contain" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-sm p-3 shadow-xl border border-primary/5 z-20 rotate-[4deg] flex items-center justify-center overflow-hidden">
                <img
                  src="/paystack.jpg"
                  alt="Paystack Logo"
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isRentPayment ? "Payment Complete!" : "Booking Received!"}
            </h1>
            <p className="text-muted-foreground text-center">
              {isRentPayment
                ? `Your payment for ${booking?.roomName} is confirmed.`
                : `Your request for ${booking?.roomName} has been received.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-left border border-primary/5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Name</p>
              <p className="text-sm font-semibold">{booking?.guestName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Check-in</p>
              <p className="text-sm font-semibold">{formatDate(booking?.checkIn)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Room</p>
              <p className="text-sm font-semibold truncate">{booking?.roomName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Check-out</p>
              <p className="text-sm font-semibold">{formatDate(booking?.checkOut)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Payment Status</p>
              <p className="text-sm font-semibold">{booking?.paymentStatus?.replace(/_/g, " ") || "Pending"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Amount</p>
              <p className="text-sm font-semibold">
                {booking?.currency || "GHS"} {(booking?.paymentAmount ?? booking?.totalPrice ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">What happens next?</h2>
            <div className="rounded-2xl border border-border overflow-hidden divide-y">
              {isRentPayment ? (
                <>
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Booking Activated</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Your rent has been paid in full. Your booking for <span className="font-medium text-foreground">{booking?.roomName}</span> is now confirmed and active.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BellRing className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Host Notified</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">The host has been notified of your payment. Expect a call or message to coordinate your move-in date and key handover.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Stay in Touch</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Keep your phone reachable. The host may contact you to confirm your check-in time and share any arrival instructions.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Request Under Review</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Your booking request for <span className="font-medium text-foreground">{booking?.roomName}</span> has been sent to the host. They'll verify bed availability and respond shortly.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Expect a Call or SMS</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Once the host confirms availability, you'll be contacted via phone or SMS with a secure payment link to complete your rent.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Pay Rent to Confirm</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Your spot is reserved once you complete the rent payment. The service fee you paid today is non-refundable but goes toward securing your request.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-8 flex justify-center">
            <Button size="lg" className="rounded-2xl font-bold bg-primary px-8" asChild>
              <Link href={booking?.accommodationId ? `/accommodations/${booking.accommodationId}` : '/accommodations'}>Done</Link>
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] px-4 font-mono">
            Ref: {reference}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <XCircle className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm">
        We couldn't confirm your payment. Please contact support with reference: <span className="font-mono font-medium">{reference}</span>
      </p>
      <Button variant="outline" asChild className="mt-2">
        <Link href="/accommodations">Go back</Link>
      </Button>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <BookingSuccessContent />
      </Suspense>
    </div>
  );
}
