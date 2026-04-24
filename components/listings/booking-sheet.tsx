"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { calculateRoomPrice } from "@/lib/helpers/pricing";
import { getBookedAndBufferDates } from "@/lib/helpers/room-availability";
import type { PublicListing } from "@/lib/services/public-listing-service";
import type { BookingDetails, PricingConfig, Room } from "@/lib/types";

// Flexible date types require both check-in and check-out date selection
const FLEXIBLE_DATE_TYPES = ["night"];
// Fixed duration types require only check-in date (duration is calculated automatically)
const FIXED_DURATION_TYPES = ["week", "month", "year", "semester"];

function getPricingOptions(listing: PublicListing) {
  const pricing = listing.pricing;
  const g = listing.globalConfig?.globalPricing as PricingConfig | undefined;
  const options: {
    key: string;
    label: string;
    amount: number;
    unit?: string;
  }[] = [];

  if (pricing?.perNight || g?.perNight)
    options.push({
      key: "night",
      label: "Per Night",
      unit: "night",
      amount: calculateRoomPrice(listing, "night", 1, g),
    });
  if (pricing?.perWeek || g?.perWeek)
    options.push({
      key: "week",
      label: "Per Week",
      unit: "week",
      amount: calculateRoomPrice(listing, "week", 1, g),
    });
  if (pricing?.perMonth || g?.perMonth)
    options.push({
      key: "month",
      label: "Per Month",
      unit: "month",
      amount: calculateRoomPrice(listing, "month", 1, g),
    });
  if (pricing?.perSemester || g?.perSemester)
    options.push({
      key: "semester",
      label: "Per Semester",
      amount: calculateRoomPrice(listing, "semester", undefined, g),
    });
  if (pricing?.perYear || g?.perYear)
    options.push({
      key: "year",
      label: "Per Year",
      amount: calculateRoomPrice(listing, "year", undefined, g),
    });

  const customs = [
    ...(pricing?.customPeriods || []),
    ...(g?.customPeriods?.filter(
      (gp) => !pricing?.customPeriods?.find((rp) => rp.id === gp.id),
    ) || []),
  ];
  customs.forEach((p) =>
    options.push({
      key: `custom-${p.id}`,
      label:
        p.label ||
        `${p.duration ?? p.years} ${
          p.durationUnit === "month(s)" ? "Month" : "Year"
        } Contract`,
      amount: p.amount,
    }),
  );

  return options;
}

function computeCheckOut(
  pricingType: string,
  checkIn: Date,
  duration: number,
  listing: PublicListing,
): Date {
  const g = listing.globalConfig?.globalPricing as PricingConfig | undefined;
  const pricing = listing.pricing;
  const out = new Date(checkIn);

  if (pricingType === "week") {
    out.setDate(out.getDate() + 7 * duration);
    return out;
  }
  if (pricingType === "month") {
    out.setMonth(out.getMonth() + duration);
    return out;
  }
  if (pricingType === "year") {
    out.setFullYear(out.getFullYear() + duration);
    return out;
  }
  if (pricingType === "semester") {
    out.setMonth(out.getMonth() + 4);
    return out;
  }
  if (pricingType.startsWith("custom-")) {
    const id = pricingType.replace("custom-", "");
    const period =
      pricing?.customPeriods?.find((p) => p.id === id) ??
      g?.customPeriods?.find((p) => p.id === id);
    const dur = period?.duration;
    const unit = period?.durationUnit;
    if (dur && unit === "month(s)") {
      out.setMonth(out.getMonth() + dur);
      return out;
    }
    if (dur && unit === "year(s)") {
      out.setFullYear(out.getFullYear() + dur);
      return out;
    }
    out.setFullYear(out.getFullYear() + (period?.years || 1));
    return out;
  }
  return out;
}

function computeTotal(
  pricingType: string,
  listing: PublicListing,
  checkIn?: Date,
  checkOut?: Date,
  duration?: number,
): number {
  const g = listing.globalConfig?.globalPricing as PricingConfig | undefined;
  const pricing = listing.pricing;

  if (pricingType === "night" && checkIn && checkOut) {
    const nights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000),
    );
    return calculateRoomPrice(listing, "night", nights, g);
  }
  if (pricingType === "week")
    return calculateRoomPrice(listing, "week", duration || 1, g);
  if (pricingType === "month")
    return calculateRoomPrice(listing, "month", duration || 1, g);
  if (pricingType === "semester")
    return calculateRoomPrice(listing, "semester", undefined, g);
  if (pricingType === "year")
    return calculateRoomPrice(listing, "year", duration || 1, g);
  if (pricingType.startsWith("custom-")) {
    const id = pricingType.replace("custom-", "");
    return calculateRoomPrice(listing, "custom", undefined, g, id);
  }
  return 0;
}

function getFriendlyError(error: string) {
  if (process.env.NODE_ENV === "development") {
    return error;
  }

  const msg = error.toLowerCase();
  if (msg.includes("missing") || msg.includes("required")) {
    return "Please make sure all your details are filled in correctly.";
  }
  if (msg.includes("not found")) {
    return "This room's availability might have changed. Please try refreshing the page.";
  }
  if (msg.includes("no price") || msg.includes("unavailable")) {
    return "The selected stay duration isn't currently available. Please try another option.";
  }
  if (msg.includes("payment") || msg.includes("paystack")) {
    return "We're having trouble reaching our payment partner. Please try again in a moment.";
  }
  if (msg.includes("server") || msg.includes("internal")) {
    return "We've hit a small snag on our end. Please give it another try.";
  }
  return "Something went wrong while setting up your booking. Please try again.";
}

interface BookingSheetProps {
  listing: PublicListing;
  trigger: React.ReactNode;
}

export function BookingSheet({ listing, trigger }: BookingSheetProps) {
  const [open, setOpen] = useState(false);
  const [roomBookings, setRoomBookings] = useState<BookingDetails[]>([]);

  const [selectedPricingType, setSelectedPricingType] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [duration, setDuration] = useState(1);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [serviceFee, setServiceFee] = useState(20);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isMobile = useIsMobile();
  const pricingOptions = getPricingOptions(listing);

  const checkArrows = useCallback((el: HTMLDivElement) => {
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const scrollCallbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      (scrollRef as React.RefObject<HTMLDivElement | null>).current = el;
      if (!el) return;
      checkArrows(el);
      el.addEventListener("scroll", () => checkArrows(el));
      new ResizeObserver(() => checkArrows(el)).observe(el);
    },
    [checkArrows],
  );

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -160 : 160,
      behavior: "smooth",
    });
  };

  const currency = listing.currency || "GHS";
  const requiresDateRange = FLEXIBLE_DATE_TYPES.includes(selectedPricingType);
  const requiresCheckInOnly =
    FIXED_DURATION_TYPES.includes(selectedPricingType) ||
    selectedPricingType.startsWith("custom-");

  // Fetch existing bookings and config when sheet opens
  useEffect(() => {
    if (!open) return;
    fetch(`/api/bookings/guest?roomId=${listing.id}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setRoomBookings(data))
      .catch(() => {});
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => d.serviceFee && setServiceFee(d.serviceFee))
      .catch(() => {});
  }, [open, listing.id]);

  // Auto-compute checkout for fixed-duration types
  useEffect(() => {
    if (!checkIn || !selectedPricingType || requiresDateRange) return;
    setCheckOut(
      computeCheckOut(selectedPricingType, checkIn, duration, listing),
    );
  }, [selectedPricingType, checkIn, duration]);

  const { bookedDates, bufferDates } = useMemo(
    () => getBookedAndBufferDates(listing as unknown as Room, roomBookings),
    [roomBookings, listing.id],
  );

  const total = useMemo(
    () =>
      computeTotal(selectedPricingType, listing, checkIn, checkOut, duration),
    [selectedPricingType, checkIn, checkOut, duration, listing],
  );

  const handleBook = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (
      !selectedPricingType ||
      !guestName ||
      !emailRegex.test(guestEmail) ||
      !phoneRegex.test(guestPhone)
    )
      return;

    if ((requiresDateRange || requiresCheckInOnly) && !checkIn) return;

    setIsBooking(true);
    setError("");
    try {
      const bookingId = crypto.randomUUID();
      const bookingType =
        selectedPricingType === "semester" ? "student" : "regular";
      const res = await fetch("/api/bookings/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          accommodationId: listing.accommodationId,
          roomId: listing.id,
          pricingType: selectedPricingType,
          bookingType,
          guestName,
          guestEmail,
          guestPhone,
          checkIn: checkIn?.toISOString().split("T")[0] ?? null,
          checkOut: checkOut?.toISOString().split("T")[0] ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(getFriendlyError(data.error || "Failed to initiate booking"));
        return;
      }
      // Redirect to Paystack to pay service fee
      window.location.href = data.authorization_url;
    } catch {
      setError(
        getFriendlyError(
          "We couldn't complete your request at this time. Please try again soon.",
        ),
      );
    } finally {
      setIsBooking(false);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9]{10,15}$/;

  const isEmailValid = emailRegex.test(guestEmail);
  const isPhoneValid = phoneRegex.test(guestPhone);

  const requiresDateSelection = requiresDateRange || requiresCheckInOnly;
  const canSubmitBooking =
    !!selectedPricingType &&
    !!guestName &&
    isEmailValid &&
    isPhoneValid &&
    (!requiresDateSelection || !!checkIn) &&
    (!requiresDateRange || !!checkOut);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-h-[92dvh] flex flex-col px-4 pb-0 pt-6"
            : "w-full sm:max-w-md flex flex-col pb-0 pt-6 px-6"
        }
      >
        <SheetHeader className="text-left shrink-0">
          <SheetTitle>Book {listing.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 pb-8 overflow-y-auto pr-2 -mr-2 flex-1">
          <div className="space-y-2">
            <Label>Select stay type</Label>
            <div className="relative">
              {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-linear-to-r from-background to-transparent z-10 pointer-events-none rounded-l-xl" />
              )}
              {showLeftArrow && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M7.5 2L4 6l3.5 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <div
                ref={scrollCallbackRef}
                className="grid grid-rows-2 grid-flow-col auto-cols-[calc(50%-0.25rem)] gap-2 overflow-x-auto no-scrollbar"
              >
                {pricingOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSelectedPricingType(opt.key);
                      setCheckIn(undefined);
                      setCheckOut(undefined);
                      setDuration(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedPricingType === opt.key
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{opt.label}</p>
                    <p className="font-semibold text-sm">
                      {currency} {opt.amount.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
              {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-background to-transparent z-10 pointer-events-none rounded-r-xl" />
              )}
              {showRightArrow && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M4.5 2L8 6l-3.5 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {requiresDateRange && (
            <div className="space-y-3">
              <Label>Select dates</Label>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Check-in date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start font-normal ${!checkIn && "text-muted-foreground"}`}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {checkIn
                          ? format(checkIn, "PPP")
                          : "Select check-in date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 max-w-[calc(100vw-2rem)]"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={(d) => {
                          setCheckIn(d ?? undefined);
                          // Reset checkout if it's before the new checkin
                          if (checkOut && d && checkOut <= d) {
                            setCheckOut(undefined);
                          }
                        }}
                        bookedDates={bookedDates}
                        bufferDates={bufferDates}
                        disabled={[{ before: new Date() }, ...bookedDates]}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Check-out date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start font-normal ${!checkOut && "text-muted-foreground"}`}
                        disabled={!checkIn}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {checkOut
                          ? format(checkOut, "PPP")
                          : checkIn
                            ? "Select check-out date"
                            : "Select check-in first"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 max-w-[calc(100vw-2rem)]"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={(d) => setCheckOut(d ?? undefined)}
                        bookedDates={bookedDates}
                        bufferDates={bufferDates}
                        disabled={[
                          {
                            before: checkIn
                              ? new Date(checkIn.getTime() + 86400000)
                              : new Date(),
                          },
                          ...bookedDates,
                        ]}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {checkIn && checkOut && (
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p className="font-medium">
                      {format(checkIn, "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p className="font-medium">
                      {format(checkOut, "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {Math.max(
                        1,
                        Math.ceil(
                          (checkOut.getTime() - checkIn.getTime()) / 86400000,
                        ),
                      )}{" "}
                      night(s)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {requiresCheckInOnly && (
            <div className="space-y-3">
              <Label>Check-in date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start font-normal ${!checkIn && "text-muted-foreground"}`}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "PPP") : "Select check-in date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 max-w-[calc(100vw-2rem)]"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(d) => setCheckIn(d ?? undefined)}
                    bookedDates={bookedDates}
                    bufferDates={bufferDates}
                    disabled={[{ before: new Date() }, ...bookedDates]}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {selectedPricingType !== "semester" &&
                !selectedPricingType.startsWith("custom-") && (
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0 text-sm text-muted-foreground">
                      Duration
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={(e) =>
                        setDuration(Math.max(1, Number(e.target.value)))
                      }
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedPricingType === "week"
                        ? "week(s)"
                        : selectedPricingType === "month"
                          ? "month(s)"
                          : "year(s)"}
                    </span>
                  </div>
                )}

              {checkIn && checkOut && (
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p className="font-medium">
                      {format(checkIn, "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p className="font-medium">
                      {format(checkOut, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <Label className="text-base font-semibold">Your details</Label>
            <div className="space-y-3 pl-1">
              <Input
                placeholder="Full name *"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="bg-muted/30 focus-visible:ring-primary"
              />
              <Input
                type="email"
                placeholder="Email address *"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="bg-muted/30 focus-visible:ring-primary"
              />
              <Input
                type="tel"
                placeholder="Phone number *"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="bg-muted/30 focus-visible:ring-primary"
              />
            </div>
          </div>

          {selectedPricingType && total > 0 && (
            <div className="rounded-2xl border-2 border-primary/10 bg-primary/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Booking Summary
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {requiresDateRange ? "Flexible dates" : "Fixed Term"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {requiresDateRange && checkIn && checkOut
                      ? `${Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000))} night(s)`
                      : pricingOptions.find(
                          (o) => o.key === selectedPricingType,
                        )?.label}
                  </span>
                  <span className="font-semibold">
                    {currency} {total.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {currency} {serviceFee}
                  </span>
                </div>
              </div>

              <Separator className="bg-primary/10" />

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                      Payable Now
                    </p>
                    <p className="text-sm font-medium">
                      Processing & Service Fee
                    </p>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {currency} {serviceFee}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <p className="flex-1 leading-relaxed">{error}</p>
              </div>
            )}
            <Button
              className="w-full h-12 text-base font-semibold"
              disabled={!canSubmitBooking || isBooking}
              onClick={handleBook}
            >
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Send Booking Request"
              )}
            </Button>

            <div className="flex justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 underline underline-offset-4 decoration-primary/30">
                    <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[10px] font-bold">
                      ?
                    </span>
                    Why a service fee?
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="center"
                  className="w-80 p-5 rounded-2xl shadow-xl border-primary/10"
                >
                  <div className="space-y-4 text-sm leading-relaxed">
                    <div className="space-y-1">
                      <p className="font-bold text-primary uppercase text-[10px] tracking-wider">
                        Effortless Search
                      </p>
                      <p className="text-muted-foreground">
                        Finding a place manually often costs days of searching
                        and significant transport expenses. We curate the best
                        listings to save you the stress and money.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-primary uppercase text-[10px] tracking-wider">
                        Spam Prevention
                      </p>
                      <p className="text-muted-foreground">
                        This small processing fee helps us filter out casual
                        inquiries, ensuring that hosts only receive serious
                        requests. This protects your slot for the room you want.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-primary uppercase text-[10px] tracking-wider">
                        Quality Guarantee
                      </p>
                      <p className="text-muted-foreground">
                        The fee supports continuous identity verification of
                        hosts and manual vetting of accommodations for your
                        safety.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
