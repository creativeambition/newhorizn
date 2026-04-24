"use client";
import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  CalendarDays,
  MapPin,
  Ticket,
  Calendar,
  Home,
  CreditCard,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  guestBookingService,
  type GuestBooking,
} from "@/lib/services/guest-booking-service";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

export function BookingsDrawer() {
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  const fetchLock = useRef(false);

  const loadAndRefreshBookings = async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    const localBookings = guestBookingService.getBookings();
    if (localBookings.length === 0) {
      setBookings([]);
      fetchLock.current = false;
      return;
    }

    setLoading(true);
    try {
      // Fetch latest status for all local booking IDs
      const res = await fetch("/api/bookings/public-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: localBookings.map((b) => b.id) }),
      });

      const data = await res.json();
      if (data.bookings && Array.isArray(data.bookings)) {
        // Merge remote updates with local bookings to prevent disappearing records
        // especially during the "pending" period right after a request is sent
        const updated = localBookings.map((local) => {
          const remote = data.bookings.find((b: any) => b.id === local.id);
          return remote ? { ...local, ...remote } : local;
        });
        setBookings(updated);

        // Sync back to localStorage silently while refresh is in progress
        data.bookings.forEach((b: GuestBooking) => {
          guestBookingService.updateBooking(b.id, b, false);
        });
      } else {
        setBookings(localBookings);
      }
    } catch (e) {
      console.error("Failed to sync booking statuses:", e);
      setBookings(localBookings);
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  };

  useEffect(() => {
    setBookings(guestBookingService.getBookings());
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (open) {
      loadAndRefreshBookings();
    }
  }, [open]);

  // Listen for updates from other components (like the success page)
  useEffect(() => {
    const handleUpdate = () => {
      setBookings(guestBookingService.getBookings());
      if (openRef.current) {
        loadAndRefreshBookings();
      }
    };

    window.addEventListener("guest-bookings-updated", handleUpdate);
    return () =>
      window.removeEventListener("guest-bookings-updated", handleUpdate);
  }, []);

  const getStatusInfo = (
    status: string | null,
    paymentStatus?: string | null,
  ) => {
    if (!status || status === "pending")
      return {
        text: "Awaiting Review",
        color: "bg-amber-500/10 text-amber-600 border-amber-200",
        icon: <Clock className="h-3 w-3" />,
      };

    switch (status) {
      case "upcoming":
        const isPaid =
          paymentStatus === "paid_in_full" || paymentStatus === "paid";
        return {
          text: isPaid ? "Confirmed" : "Approved",
          color: isPaid
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
            : "bg-blue-500/10 text-blue-600 border-blue-200",
          icon: isPaid ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Calendar className="h-3 w-3" />
          ),
        };
      case "active":
        return {
          text: "Active",
          color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
          icon: null,
        };
      case "declined":
        return {
          text: "Declined",
          color: "bg-red-500/10 text-red-600 border-red-200",
          icon: <XCircle className="h-3 w-3" />,
        };
      case "completed":
        return {
          text: "Completed",
          color: "bg-zinc-500/10 text-zinc-600 border-zinc-200",
          icon: <Archive className="h-3 w-3" />,
        };
      default:
        return {
          text: status,
          color: "bg-zinc-500/10 text-zinc-600 border-zinc-200",
          icon: <AlertCircle className="h-3 w-3" />,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Ticket className="h-5 w-5" />
          {bookings.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {bookings.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left flex items-center gap-2">
            My Bookings ({bookings.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <p className="text-sm text-muted-foreground">
                Checking status...
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-bold text-lg mb-1">No bookings yet</h3>
              <p className="text-muted-foreground text-sm">
                Bookings you make on this device will appear here. No account
                needed.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const statusInfo = getStatusInfo(
                booking.status,
                booking.paymentStatus,
              );
              return (
                <div
                  key={booking.id}
                  className="group border rounded-2xl p-3 hover:shadow-md transition-all bg-card overflow-hidden"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                      {booking.imageUrl ? (
                        <img
                          src={booking.imageUrl}
                          alt={booking.accommodationName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Home className="h-8 w-8 text-primary/20" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold truncate pr-4">
                          {booking.accommodationName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="truncate">{booking.roomName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0 h-5 flex items-center gap-1",
                            statusInfo.color,
                          )}
                        >
                          {statusInfo.icon}
                          {statusInfo.text}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 p-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span>{formatDate(booking.checkIn)}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                        <span>{formatDate(booking.checkOut)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="mt-3 flex items-center justify-between pr-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                        Total Amount
                      </span>
                      <span className="text-sm font-black text-primary">
                        {booking.currency}{" "}
                        {(booking.totalPrice || 0).toLocaleString()}
                      </span>
                    </div>

                    {(booking.status === "upcoming" ||
                      booking.status === "active") &&
                    (booking.paymentStatus === "pending" ||
                      !booking.paymentStatus) ? (
                      <Button
                        size="sm"
                        className="rounded-xl h-8 font-bold px-3 gap-1.5 shadow-sm"
                        asChild
                        onClick={() => setOpen(false)}
                      >
                        <Link href={`/booking/pay/${booking.id}`}>
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay Now
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl h-8 font-bold text-xs px-3"
                        asChild
                        onClick={() => setOpen(false)}
                      >
                        <Link
                          href={`/accommodations/${booking.accommodationId}`}
                        >
                          View Room
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {bookings.length > 0 && (
          <div className="p-4 bg-muted/30 border-t">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                Bookings are saved anonymously to this browser. If you clear
                your history or change devices, you'll need to use the link sent
                to your email to access your payment page.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
