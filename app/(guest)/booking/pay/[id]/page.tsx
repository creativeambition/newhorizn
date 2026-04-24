"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  CreditCard,
  Calendar,
  ShieldCheck,
  Info,
  ArrowLeft,
  DoorOpen,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

export default function PublicBookingCheckout() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch("/api/bookings/public-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        });
        const data = await res.json();
        if (data.bookings && data.bookings.length > 0) {
          setBooking(data.bookings[0]);
        } else {
          toast({ title: "Booking not found", variant: "destructive" });
        }
      } catch (e) {
        console.error("Failed to load booking:", e);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/bookings/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || "Payment failed to initialize");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Securing your payment session...
        </p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto gap-4">
        <div className="h-14 w-14 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <Info className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Booking Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This link may have expired or the booking was already completed.
          </p>
        </div>
        <Button
          onClick={() => router.push("/accommodations")}
          variant="outline"
          className="rounded-2xl w-full h-11"
        >
          Back to Search
        </Button>
      </div>
    );
  }

  const isAlreadyPaid = booking.paymentStatus === "paid_in_full";
  const isAccepted =
    booking.status === "upcoming" || booking.status === "active";
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <div className="flex-1 bg-background flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Property card */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="bg-primary/5 px-5 py-4 flex items-center gap-3 border-b">
            <div className="h-9 w-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {booking.managerImage ? (
                <img
                  src={booking.managerImage}
                  alt="Host"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {booking.accommodationName?.[0]?.toUpperCase() || "H"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {booking.accommodationName}
              </p>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DoorOpen className="h-3 w-3 shrink-0" />
                <p className="text-xs truncate">{booking.roomName}</p>
              </div>
            </div>
            <div className="ml-auto shrink-0">
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 divide-x">
            <div className="px-5 py-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3 w-3" /> Check-in
              </div>
              <p className="text-sm font-medium">
                {formatDate(booking.checkIn)}
              </p>
            </div>
            <div className="px-5 py-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3 w-3" /> Check-out
              </div>
              <p className="text-sm font-medium">
                {formatDate(booking.checkOut)}
              </p>
            </div>
          </div>
        </div>

        {/* Paid indicator — only shown when already paid */}
        {isAlreadyPaid && (
          <div className="rounded-2xl border bg-card px-5 py-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Amount Paid
              </p>
              <p className="text-3xl font-bold tracking-tight text-primary">
                {booking.currency} {booking.paymentAmount.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 text-emerald-500">
              <CreditCard className="h-9 w-9" />
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Paid
              </span>
            </div>
          </div>
        )}

        {/* Pending notice */}
        {!isAccepted && !isAlreadyPaid && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
              Your booking is pending host approval. The payment link will
              activate once the host confirms availability.
            </p>
          </div>
        )}

        {/* Spacer pushes CTA to bottom on tall screens */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="space-y-3 pb-2">
          {!isAlreadyPaid && isAccepted && (
            <>
              {/* <span className="text-sm text-red-300">
                *Pay with MoMo unavailable- will be restored in 30mins
              </span> */}

              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">
                  Rent Balance Due
                </span>
                <span className="text-lg font-bold text-primary">
                  {booking.currency} {booking.totalPrice.toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full h-13 rounded-2xl text-base font-medium gap-2.5 shadow-lg shadow-primary/20"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Pay with MoMo
                  </>
                )}
              </Button>
            </>
          )}

          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <Lock className="h-3 w-3" />
            <p className="text-[10px] uppercase tracking-[0.15em] font-medium">
              Secured by Paystack
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
