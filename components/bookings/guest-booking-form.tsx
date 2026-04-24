"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CalendarDays,
  ArrowLeft,
  Search,
  CreditCard,
  Loader,
  RefreshCcw,
  Bed,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useToast } from "@/hooks/use-toast";
import {
  Room,
  PaymentStatus,
  Guest,
  NewBookingData,
  NewGuestData,
  BookingDetails,
  BookingType,
} from "@/lib/types";
import {
  calculateRoomPrice,
  getAvailablePricingOptions,
  getRoomDisplayPrice,
  formatPrice,
} from "@/lib/helpers/pricing";
import {
  getFullyBookedDates,
  getBookedAndBufferDates,
  calculateAvailableBeds,
} from "@/lib/helpers/room-availability";
import clsx from "clsx";
import { useAppContext } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";

type BookingFormProps = {
  guests: Guest[];
  roomOptions: Room[];
  onAddGuest: (guestData: NewGuestData) => Promise<string | null>;
  onClose: () => void;
  isBooking: boolean;
  onAddBooking: (
    bookingData: NewBookingData,
    paymentType: string,
    isNewGuest: boolean,
    newGuestData: NewGuestData,
    manualPrice?: number | null,
  ) => Promise<BookingDetails | null>;
  isEdit?: boolean;
  isEditRoomInfo?: boolean;
  bookingToEdit?: BookingDetails | null;
  onUpdateBooking?: (
    updatedBooking: NewBookingData & {
      id: string;
    },
  ) => Promise<NewBookingData | null>;
  onUpdateRoomInfo?: (
    bookingId: string,
    roomId: string,
    paymentType: string,
    totalPrice?: number,
  ) => Promise<BookingDetails | null>;
};

// Calculate semester end date (4 months from now)
const calculateSemesterEndDate = (startDate = new Date()) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 4);
  return endDate.toISOString().split("T")[0];
};

// Determine if a room can be booked based on capacity.
// For private rooms, only 1 booking allowed regardless of bed count.
// For shared rooms, count overlapping bookings against capacity.
// Requires 1-day gap before upcoming bookings.
const isRoomAvailable = (
  room: Room,
  bookings: BookingDetails[],
  desiredCheckIn?: string,
  desiredCheckOut?: string,
  excludeBookingId?: string,
) => {
  // If no dates provided, room is available (for initial load)
  if (!desiredCheckIn || !desiredCheckOut) {
    return true;
  }

  const futureBookings = bookings.filter(
    (b) =>
      b.roomId === room.id &&
      b.id !== excludeBookingId && // Exclude current booking when editing
      (b.status === "upcoming" || b.status === "active") &&
      b.checkIn &&
      b.checkOut,
  );

  const desiredIn = new Date(desiredCheckIn).getTime();
  const desiredOut = new Date(desiredCheckOut).getTime();

  const overlappingCount = futureBookings.filter((b) => {
    const bIn = new Date(b.checkIn).getTime();
    const bOut = new Date(b.checkOut).getTime();

    const oneDayMs = 1 * 24 * 60 * 60 * 1000;

    // Check for actual date overlap (+ 1-day buffer after checkout for cleaning)
    const bOutWithBuffer = bOut + oneDayMs;
    const desiredOutWithBuffer = desiredOut + oneDayMs;

    return desiredIn <= bOutWithBuffer && desiredOutWithBuffer >= bIn;
  }).length;

  // Private rooms: no overlaps allowed (entire room booked by one party)
  const isPrivate = room.type.toLowerCase().includes("private");
  if (isPrivate) {
    return overlappingCount === 0;
  }

  // Shared rooms: check against capacity
  return overlappingCount < room.capacity;
};

export default function GuestBookingForm({
  guests,
  roomOptions,
  onAddGuest,
  onClose,
  isBooking = false,
  onAddBooking,
  isEdit,
  isEditRoomInfo,
  bookingToEdit,
  onUpdateBooking,
  onUpdateRoomInfo,
}: BookingFormProps) {
  const { getBookingById, bookings } = useAppContext();
  const { accommodationData } = useAuth();

  const [newBooking, setNewBooking] = useState<
    NewBookingData & {
      id: string;
    }
  >({
    id: "",
    guestId: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    bookingType: "regular",
    paymentStatus: "pending",
    paymentAmount: 0,
    paymentNotes: "",
    totalPrice: 0,
    paymentType: (isEdit || isEditRoomInfo)
      ? (bookingToEdit?.paymentType ?? "night")
      : "night",
  });

  useEffect(() => {
    if (bookingToEdit) {
      setNewBooking({
        id: bookingToEdit.id,
        guestId: bookingToEdit.guestId,
        roomId: bookingToEdit.roomId,
        checkIn: bookingToEdit.checkIn,
        checkOut: bookingToEdit.checkOut,
        bookingType: bookingToEdit.bookingType || "student",
        paymentStatus: bookingToEdit.paymentStatus,
        paymentAmount: bookingToEdit.paymentAmount,
        paymentNotes: bookingToEdit.paymentNotes || "",
        totalPrice: bookingToEdit.totalPrice || 0,
        paymentType: bookingToEdit.paymentType || "night",
      });
    }
  }, [bookingToEdit]);

  const [paymentType, setPaymentType] = useState(() =>
    isEdit || isEditRoomInfo ? (bookingToEdit?.paymentType ?? "night") : "night",
  );

  const [duration, setDuration] = useState(() => {
    if (bookingToEdit && (isEdit || isEditRoomInfo)) {
      const start = new Date(bookingToEdit.checkIn);
      const end = new Date(bookingToEdit.checkOut);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      switch (bookingToEdit.paymentType) {
        case "week":
          return Math.ceil(diffDays / 7) || 1;
        case "month":
          return Math.ceil(diffDays / 30) || 1;
        case "year":
          return Math.ceil(diffDays / 365) || 1;
        case "night":
          return diffDays || 1;
        default:
          return 1;
      }
    }
    return 1;
  });

  useEffect(() => {
    if (bookingToEdit && (isEdit || isEditRoomInfo)) {
      setPaymentType(bookingToEdit.paymentType || "night");

      const start = new Date(bookingToEdit.checkIn);
      const end = new Date(bookingToEdit.checkOut);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let newDuration = 1;
      switch (bookingToEdit.paymentType) {
        case "week":
          newDuration = Math.ceil(diffDays / 7) || 1;
          break;
        case "month":
          newDuration = Math.ceil(diffDays / 30) || 1;
          break;
        case "year":
          newDuration = Math.ceil(diffDays / 365) || 1;
          break;
        case "night":
          newDuration = diffDays || 1;
          break;
      }
      setDuration(newDuration);
    }
  }, [bookingToEdit, isEdit, isEditRoomInfo]);

  const [isNewGuest, setIsNewGuest] = useState(false);
  const [newGuestData, setNewGuestData] = useState<NewGuestData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [activeForm, setActiveForm] = useState<
    "booking" | "newGuest" | "payment"
  >("booking");
  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const { toast } = useToast();

  // Get available payment types for selected room and booking type
  // NOTE: the payment type selector should be usable even before a room is chosen.
  // we provide a sensible default list and then narrow it further when a room is
  // selected. room-specific pricing takes precedence over default accommodation pricing.
  const getPaymentTypeOptions = () => {
    const selectedRoom = roomOptions.find(
      (room) => room.id === newBooking.roomId,
    );

    const r = selectedRoom?.pricing;
    const g = accommodationData?.globalConfig?.globalPricing;

    const options: { value: string; label: string }[] = [
      { value: "night", label: "Nightly Rate" },
      { value: "week", label: "Weekly Rate" },
      { value: "month", label: "Monthly Rate" },
      { value: "year", label: "Yearly Rate" },
    ];

    const customPeriods = [...(r?.customPeriods || [])];
    if (g?.customPeriods) {
      g.customPeriods.forEach((gp) => {
        if (!customPeriods.find((rp) => rp.id === gp.id)) {
          customPeriods.push(gp);
        }
      });
    }

    if (customPeriods.length) {
      customPeriods.forEach((period) => {
        const dur = period.duration ?? period.years;
        const unit = period.durationUnit ?? "years";
        const label =
          period.label ||
          `${dur} ${
            unit === "month(s)" ? "Month" : unit === "year(s)" ? "Year" : ""
          }${dur !== 1 ? "s" : ""} Contract`;
        options.push({ value: `custom-${period.id}`, label });
      });
    }

    return options;
  };

  // Auto-calculate checkout date based on payment type, check-in, and duration
  useEffect(() => {
    if (!newBooking.checkIn) return;

    const checkInDate = new Date(newBooking.checkIn);
    let checkOutDate: Date;

    switch (paymentType) {
      case "week":
        checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 7 * duration);
        break;
      case "month":
        checkOutDate = new Date(checkInDate);
        checkOutDate.setMonth(checkOutDate.getMonth() + duration);
        break;
      case "year":
        checkOutDate = new Date(checkInDate);
        checkOutDate.setFullYear(checkOutDate.getFullYear() + duration);
        break;
      case "custom":
      default:
        if (paymentType.startsWith("custom-")) {
          const customPeriodId = paymentType.replace("custom-", "");
          const selectedRoom = roomOptions.find(
            (r) => r.id === newBooking.roomId,
          );
          // Room-specific pricing takes precedence over global pricing
          const r = selectedRoom?.pricing;
          const g = accommodationData?.globalConfig?.globalPricing;
          const customPeriod =
            r?.customPeriods?.find((p) => p.id === customPeriodId) ??
            g?.customPeriods?.find((p) => p.id === customPeriodId);
          const dur = customPeriod?.duration;
          const unit = customPeriod?.durationUnit;
          checkOutDate = new Date(checkInDate);
          if (dur && unit === "month(s)") {
            checkOutDate.setMonth(checkOutDate.getMonth() + dur);
          } else if (dur && unit === "year(s)") {
            checkOutDate.setFullYear(checkOutDate.getFullYear() + dur);
          } else {
            const years = customPeriod?.years || 1;
            checkOutDate.setFullYear(checkOutDate.getFullYear() + years);
          }
          break;
        }
        // For nightly, don't auto-calculate - let user select range
        return;
    }

    setNewBooking((prev) => ({
      ...prev,
      checkOut: checkOutDate.toISOString().split("T")[0],
    }));
  }, [
    paymentType,
    newBooking.checkIn,
    duration,
    newBooking.roomId,
    newBooking.bookingType,
    accommodationData?.globalConfig?.semesterEndDate,
    accommodationData?.globalConfig?.globalPricing,
    roomOptions,
  ]);

  // Track previous room ID to only clear manual price on room change
  const prevRoomIdRef = useRef(newBooking.roomId);
  const prevRoomId = prevRoomIdRef.current;
  prevRoomIdRef.current = newBooking.roomId;

  // Calculate total price when room, dates, or booking type change
  useEffect(() => {
    if (newBooking.roomId) {
      const selectedRoom = roomOptions.find(
        (room) => room.id === newBooking.roomId,
      );

      if (selectedRoom) {
        if (paymentType === "week") {
          const price = calculateRoomPrice(
            selectedRoom,
            "week",
            duration,
            accommodationData?.globalConfig?.globalPricing,
          );
          setTotalPrice(price || 0);
        } else if (paymentType === "month") {
          const price = calculateRoomPrice(
            selectedRoom,
            "month",
            duration,
            accommodationData?.globalConfig?.globalPricing,
          );
          setTotalPrice(price || 0);
        } else if (paymentType === "year") {
          const price = calculateRoomPrice(
            selectedRoom,
            "year",
            duration,
            accommodationData?.globalConfig?.globalPricing,
          );
          setTotalPrice(price || 0);
        } else if (paymentType.startsWith("custom-")) {
          const customPeriodId = paymentType.replace("custom-", "");
          const price = calculateRoomPrice(
            selectedRoom,
            "custom",
            undefined,
            accommodationData?.globalConfig?.globalPricing,
            customPeriodId,
          );
          setTotalPrice(price);
        } else {
          // Nightly - calculate from actual dates if available, otherwise show per-night rate
          if (newBooking.checkIn && newBooking.checkOut) {
            const checkInDate = new Date(newBooking.checkIn);
            const checkOutDate = new Date(newBooking.checkOut);
            const nights = Math.ceil(
              (checkOutDate.getTime() - checkInDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            const price = calculateRoomPrice(
              selectedRoom,
              "night",
              nights,
              accommodationData?.globalConfig?.globalPricing,
            );
            setTotalPrice(price || 0);
          } else {
            const price = calculateRoomPrice(
              selectedRoom,
              "night",
              1,
              accommodationData?.globalConfig?.globalPricing,
            );
            setTotalPrice(price || 0);
          }
        }
      }
    }
    // Only clear manual price when room changes, not when payment type changes
    if (prevRoomId !== newBooking.roomId) {
      setManualPrice(null);
    }
  }, [
    newBooking.roomId,
    newBooking.checkIn,
    newBooking.checkOut,
    newBooking.bookingType,
    paymentType,
    duration,
    roomOptions,
    accommodationData?.globalConfig?.globalPricing,
    prevRoomId,
  ]);

  // Validate payment type when room or booking type changes
  useEffect(() => {
    if (newBooking.roomId) {
      const availableOptions = getPaymentTypeOptions();
      if (!availableOptions.some((opt) => opt.value === paymentType)) {
        setPaymentType(availableOptions[0]?.value || "night");
      }
    }
  }, [newBooking.roomId, newBooking.bookingType]);

  // Memoize room availability calculations for performance
  const roomAvailabilityMap = useMemo(() => {
    return roomOptions.reduce(
      (acc, room) => {
        acc[room.id] = isRoomAvailable(
          room,
          bookings,
          newBooking.checkIn,
          newBooking.checkOut,
          newBooking.id,
        );
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }, [
    roomOptions,
    bookings,
    newBooking.checkIn,
    newBooking.checkOut,
    newBooking.id,
  ]);

  // Filter guests based on search query
  const filteredGuests = guests.filter(
    (guest) =>
      guest.name?.toLowerCase().includes(guestSearchQuery.toLowerCase()) ||
      guest.email?.toLowerCase().includes(guestSearchQuery.toLowerCase()) ||
      guest.phone?.includes(guestSearchQuery),
  );

  // determine which rooms should appear in the dropdown.
  // For the guest form, we show only rooms that are available for the selected dates.
  const filteredRoomOptions = useMemo(() => {
    if (isEditRoomInfo) {
      // when editing room info, we want to see available rooms for the original dates
      return roomOptions.filter((room) => roomAvailabilityMap[room.id]);
    }

    const list = roomOptions.filter((room) => {
      // We only filter if dates have been selected.
      if (newBooking.checkIn && newBooking.checkOut) {
        return roomAvailabilityMap[room.id];
      }
      return true; // if dates not selected yet, show theoretically all
    });

    if (isEdit && newBooking.roomId) {
      const current = roomOptions.find((r) => r.id === newBooking.roomId);
      if (current && !list.some((r) => r.id === current.id)) {
        return [current, ...list];
      }
    }

    return list;
  }, [
    isEditRoomInfo,
    roomOptions,
    roomAvailabilityMap,
    newBooking.checkIn,
    newBooking.checkOut,
    newBooking.id,
    newBooking.roomId,
    isEdit,
  ]);

  // Filter rooms based on search query and calculate dynamic available beds
  const searchFilteredRooms = filteredRoomOptions
    .filter(
      (room) =>
        room.name?.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
        room.type?.toLowerCase().includes(roomSearchQuery.toLowerCase()),
    )
    .map((room) => ({
      ...room,
      availableBeds: calculateAvailableBeds(room, bookings),
    }));

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newBooking.guestId) {
      errors.guestId = "Please select a guest";
    }

    if (!newBooking.roomId) {
      errors.roomId = "Please select a room";
    }

    if (paymentType === "nightly" || paymentType === "night") {
      if (!newBooking.checkIn) {
        errors.checkIn = "Please select a check-in date";
      }

      if (!newBooking.checkOut) {
        errors.checkOut = "Please select a check-out date";
      }
    }

    if (isNewGuest) {
      if (!newGuestData.name) {
        errors.name = "Guest name is required";
      }

      if (newGuestData.email && !/\S+@\S+\.\S+/.test(newGuestData.email)) {
        errors.email = "Please enter a valid email";
      }
    }

    if (
      newBooking.paymentStatus === "deposit_paid" ||
      newBooking.paymentStatus === "installment_plan"
    ) {
      const finalPrice = manualPrice ?? totalPrice;
      if (!newBooking.paymentAmount) {
        errors.paymentAmount = "Please enter the payment amount";
      } else if (newBooking.paymentAmount > finalPrice) {
        errors.paymentAmount = "Payment amount cannot exceed total price";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBooking = async () => {
    if (!validateForm()) {
      return;
    }

    const finalBookingData = {
      ...newBooking,
      totalPrice: manualPrice ?? totalPrice,
      paymentAmount:
        newBooking.paymentStatus === "paid_in_full"
          ? (manualPrice ?? totalPrice)
          : newBooking.paymentAmount,
    };

    await onAddBooking(
      finalBookingData,
      paymentType,
      isNewGuest,
      newGuestData,
      manualPrice,
    );

    // Reset form states
    setNewBooking({
      id: "",
      guestId: "",
      roomId: "",
      checkIn: "",
      checkOut: "",
      bookingType: "regular",
      paymentStatus: "pending",
      paymentAmount: 0,
      paymentType: "night",
      paymentNotes: "",
      totalPrice: 0,
    });
    setPaymentType("night");
    setIsNewGuest(false);
    setNewGuestData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
    setFormErrors({});
    setActiveForm("booking");
    onClose();
  };

  const handleUpdateSubmit = async () => {
    if (!bookingToEdit) return null;

    const originalBooking = getBookingById(bookingToEdit.id);

    if (!originalBooking) return null;

    const currentPrice = manualPrice ?? totalPrice;
    const priceChanged = currentPrice !== originalBooking.totalPrice;
    const paymentTypeChanged = paymentType !== originalBooking.paymentType;

    const changesMade =
      priceChanged ||
      paymentTypeChanged ||
      Object.keys(newBooking).some((key) => {
        return (
          newBooking[key as keyof NewBookingData] !==
          originalBooking[key as keyof NewBookingData]
        );
      });

    if (!changesMade) {
      toast({
        title: "No changes made",
        description: "No changes were detected in the booking information.",
      });
      onClose();
      return null;
    }

    const finalBookingData = {
      ...newBooking,
      totalPrice: currentPrice,
      paymentType: paymentType,
    };

    if (!onUpdateBooking) return null;

    try {
      const result = await onUpdateBooking(finalBookingData);
      if (result) {
        toast({
          title: "Booking updated",
          description: "The booking information has been updated successfully.",
        });
        onClose();
      } else {
        throw new Error("Failed to update booking");
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleUpdateRoomInfo = async () => {
    if (!bookingToEdit || !onUpdateRoomInfo) return;

    if (!newBooking.roomId) {
      toast({
        title: "Room required",
        description: "Please select a room.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      return;
    }

    try {
      const result = await onUpdateRoomInfo(
        bookingToEdit.id,
        newBooking.roomId,
        paymentType,
        manualPrice ?? totalPrice,
      );
      if (result) {
        toast({
          title: "Room updated",
          description: "The booking room has been updated successfully.",
        });
        onClose();
      } else {
        throw new Error("Failed to update room");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Update failed",
        description: "Failed to update the booking room.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    }
  };

  const handleGuestChange = (value: string) => {
    setNewBooking({ ...newBooking, guestId: value });
    setFormErrors({ ...formErrors, guestId: "" });
    setGuestSearchQuery(""); // Reset search query

    if (value === "new-guest") {
      setIsNewGuest(true);
      setActiveForm("newGuest");
    }
  };

  const handleRoomChange = (value: string) => {
    setNewBooking({ ...newBooking, roomId: value });
    setFormErrors({ ...formErrors, roomId: "" });
    setRoomSearchQuery(""); // Reset search query
  };

  const handleBackToBooking = () => {
    setActiveForm("booking");
    setIsNewGuest(false);
    setNewBooking((prev) => ({
      ...prev,
      guestId: "",
    }));
  };

  const handleAddNewGuest = async () => {
    // Validate guest data
    const errors: Record<string, string> = {};

    if (!newGuestData.name) {
      errors.name = "Guest name is required";
      setFormErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    if (!newGuestData.phone) {
      errors.phone = "Phone is required";
      setFormErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    // Call the parent component's onAddGuest function to add the guest to the system
    const newGuestId = await onAddGuest(newGuestData);

    if (newGuestId) {
      // Set the new guest as the selected guest in the booking form
      setNewBooking({ ...newBooking, guestId: newGuestId });
    }

    // Update the form state to reflect that we're using a newly created guest
    setIsNewGuest(false);

    // Go back to booking form
    setActiveForm("booking");

    toast({
      title: "Guest added",
      description: `${newGuestData.name} has been added successfully.`,
    });
  };

  const handleContinueToPayment = () => {
    // Validate booking details before proceeding to payment
    const errors: Record<string, string> = {};

    if (!newBooking.guestId) {
      errors.guestId = "Please select a guest";
    }

    if (!newBooking.roomId) {
      errors.roomId = "Please select a room";
    }

    if (paymentType === "nightly" || paymentType === "night") {
      if (!newBooking.checkIn) {
        errors.checkIn = "Please select a check-in date";
      }

      if (!newBooking.checkOut) {
        errors.checkOut = "Please select a check-out date";
      }
    }

    if (totalPrice === 0 && !manualPrice) {
      toast({
        title: "Price required",
        description: "Please enter a manual price for this booking.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Verify room is still available
    const selectedRoom = roomOptions.find((r) => r.id === newBooking.roomId);
    if (selectedRoom && !roomAvailabilityMap[selectedRoom.id]) {
      toast({
        title: "Room no longer available",
        description: "This room was just booked. Please select another room.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      setNewBooking({ ...newBooking, roomId: "" });
      return;
    }

    setActiveForm("payment");
  };

  return (
    <DialogContent
      className="sm:max-w-125 md:max-w-150 max-h-[calc(100dvh-4rem)] overflow-y-auto pb-3"
      onInteractOutside={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-radix-popper-content-wrapper]")) {
          e.preventDefault();
        }
      }}
    >
      <DialogHeader
        className={clsx(
          {
            "opacity-20": activeForm !== "booking",
          },
          "text-left",
        )}
      >
        <DialogTitle>
          {isEdit ? (
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4" />
              Update booking details
            </div>
          ) : isEditRoomInfo ? (
            <div className="flex items-center gap-2">
              <Bed className="h-4" />
              Update room
            </div>
          ) : (
            "Create New Booking"
          )}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Update booking details for ${bookingToEdit?.guestName}`
            : isEditRoomInfo
              ? `Change the room for ${bookingToEdit?.guestName}'s booking`
              : "Enter the booking details to reserve a room."}
        </DialogDescription>
      </DialogHeader>

      <div className="relative overflow-hidden min-h-75">
        <div
          className={`transition-transform duration-300 ease-in-out w-full px-1 ${
            activeForm === "booking" ? "relative" : "absolute"
          } ${
            activeForm === "booking"
              ? "translate-x-0"
              : activeForm === "newGuest"
                ? "-translate-x-full"
                : "-translate-x-[200%]"
          }`}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
              <Label htmlFor="guest-mobile" className="text-left">
                Guest
              </Label>
              <div className="col-span-1 xl:col-span-3">
                <Popover
                  open={guestPopoverOpen}
                  onOpenChange={setGuestPopoverOpen}
                >
                  <PopoverTrigger asChild disabled={isEditRoomInfo}>
                    <Button
                      id="guest-mobile"
                      variant="outline"
                      role="combobox"
                      aria-expanded={guestPopoverOpen}
                      className={`col-span-3 w-full justify-between font-normal ${
                        formErrors.guestId ? "border-red-500" : ""
                      } ${!newBooking.guestId ? "text-muted-foreground" : ""}`}
                    >
                      {newBooking.guestId
                        ? (guests.find((g) => g.id === newBooking.guestId)
                            ?.name ?? "Select guest")
                        : "Select guest"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search guests..."
                        value={guestSearchQuery}
                        onValueChange={setGuestSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No guests found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="new-guest"
                            onSelect={() => {
                              handleGuestChange("new-guest");
                              setGuestPopoverOpen(false);
                            }}
                          >
                            + Add New Guest
                          </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                          {guests.map((guest) => (
                            <CommandItem
                              key={guest.id}
                              value={
                                guest.name +
                                " " +
                                (guest.email || "") +
                                " " +
                                (guest.phone || "")
                              }
                              onSelect={() => {
                                handleGuestChange(guest.id);
                                setGuestPopoverOpen(false);
                              }}
                            >
                              {guest.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formErrors.guestId && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.guestId}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
              <Label htmlFor="payment-type-mobile" className="text-left">
                Stay Type
              </Label>
              <Select
                value={paymentType}
                onValueChange={(value: string) => setPaymentType(value)}
                disabled={isEditRoomInfo}
              >
                <SelectTrigger
                  id="payment-type-mobile"
                  className="col-span-1 xl:col-span-3"
                >
                  <SelectValue placeholder="Select stay type" />
                </SelectTrigger>
                <SelectContent>
                  {getPaymentTypeOptions().map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEditRoomInfo && (
              <div className="grid grid-cols-1 xl:grid-cols-4 items-start gap-2 xl:gap-4">
                <Label htmlFor="date-range" className="text-left xl:pt-2">
                  Dates
                </Label>

                <div className="col-span-1 xl:col-span-3 space-y-3">
                  {paymentType === "night" ? (
                    // Nightly: Show date range picker
                    <>
                      <DateRangePicker
                        range={
                          newBooking.checkIn || newBooking.checkOut
                            ? {
                                from: newBooking.checkIn
                                  ? new Date(newBooking.checkIn)
                                  : undefined,
                                to: newBooking.checkOut
                                  ? new Date(newBooking.checkOut)
                                  : undefined,
                              }
                            : undefined
                        }
                        disabled={false}
                        disabledDates={
                          newBooking.roomId
                            ? [{ before: new Date() } as any]
                            : [{ before: new Date() } as any]
                        }
                        onSelect={(range: any) => {
                          setNewBooking({
                            ...newBooking,
                            checkIn: range?.from
                              ? range.from.toISOString().split("T")[0]
                              : "",
                            checkOut: range?.to
                              ? range.to.toISOString().split("T")[0]
                              : "",
                          });
                          setFormErrors({
                            ...formErrors,
                            checkIn: "",
                            checkOut: "",
                          });
                        }}
                        {...(() => {
                          const room = newBooking.roomId
                            ? roomOptions.find(
                                (r) => r.id === newBooking.roomId,
                              )
                            : null;
                          const { bookedDates, bufferDates } =
                            getBookedAndBufferDates(room, bookings || []);
                          return { bookedDates, bufferDates };
                        })()}
                      />

                      <div className="bg-muted/50 rounded-md p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">
                              Check-in
                            </div>
                            <div className="font-medium">
                              {newBooking.checkIn || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">
                              Check-out
                            </div>
                            <div className="font-medium">
                              {newBooking.checkOut || "-"}
                            </div>
                          </div>
                        </div>
                        {((newBooking.checkIn && newBooking.checkIn !== "") ||
                          (newBooking.checkOut &&
                            newBooking.checkOut !== "")) &&
                          !isEditRoomInfo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs w-full"
                              onClick={() => {
                                setNewBooking({
                                  ...newBooking,
                                  checkIn: "",
                                  checkOut: "",
                                });
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear Dates
                            </Button>
                          )}
                      </div>

                      {(formErrors.checkIn || formErrors.checkOut) && (
                        <p className="text-red-500 text-xs">
                          {formErrors.checkIn || formErrors.checkOut}
                        </p>
                      )}
                    </>
                  ) : (
                    // Other payment types: Show single date picker + duration
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Check-in Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${
                                !newBooking.checkIn && "text-muted-foreground"
                              }`}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {newBooking.checkIn
                                ? new Date(
                                    newBooking.checkIn,
                                  ).toLocaleDateString()
                                : "Select check-in date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)] overflow-auto">
                            <Calendar
                              mode="single"
                              selected={
                                newBooking.checkIn
                                  ? new Date(newBooking.checkIn)
                                  : undefined
                              }
                              onSelect={(date: Date | undefined) => {
                                setNewBooking({
                                  ...newBooking,
                                  checkIn: date
                                    ? date.toISOString().split("T")[0]
                                    : "",
                                });
                                setFormErrors({ ...formErrors, checkIn: "" });
                              }}
                              {...(() => {
                                const room = newBooking.roomId
                                  ? roomOptions.find(
                                      (r) => r.id === newBooking.roomId,
                                    )
                                  : null;
                                const { bookedDates, bufferDates } =
                                  getBookedAndBufferDates(room, bookings || []);
                                return { bookedDates, bufferDates };
                              })()}
                              disabled={
                                newBooking.roomId
                                  ? [
                                      { before: new Date() },
                                      ...(() => {
                                        const room = roomOptions.find(
                                          (r) => r.id === newBooking.roomId,
                                        );
                                        const { bookedDates } =
                                          getBookedAndBufferDates(
                                            room,
                                            bookings || [],
                                          );
                                        return bookedDates;
                                      })(),
                                    ]
                                  : [{ before: new Date() }]
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.checkIn && (
                          <p className="text-red-500 text-xs mt-1.5">
                            {formErrors.checkIn}
                          </p>
                        )}
                      </div>

                      {paymentType !== "semester" &&
                        !paymentType.startsWith("custom-") && (
                          <div>
                            <Label
                              htmlFor="duration"
                              className="text-sm text-muted-foreground mb-2 block"
                            >
                              Duration
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="duration"
                                type="number"
                                min={1}
                                value={duration || ""}
                                onChange={(e) =>
                                  setDuration(
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                  )
                                }
                                className="w-24 text-center"
                              />
                              <span className="text-sm font-medium">
                                {paymentType === "week"
                                  ? "week(s)"
                                  : paymentType === "month"
                                    ? "month(s)"
                                    : "year(s)"}
                              </span>
                            </div>
                          </div>
                        )}

                      <div className="bg-muted/50 rounded-md p-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Check-in
                          </div>
                          <div className="font-medium">
                            {newBooking.checkIn || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Check-out
                          </div>
                          {paymentType === "semester" ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="font-medium text-primary hover:underline block text-left">
                                  {newBooking.checkOut || "Select date"}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="end"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    newBooking.checkOut
                                      ? new Date(newBooking.checkOut)
                                      : undefined
                                  }
                                  onSelect={(date: Date | undefined) => {
                                    if (date) {
                                      setNewBooking({
                                        ...newBooking,
                                        checkOut: date
                                          .toISOString()
                                          .split("T")[0],
                                      });
                                    }
                                  }}
                                  disabled={(date: Date) =>
                                    newBooking.checkIn
                                      ? date <= new Date(newBooking.checkIn)
                                      : date < new Date()
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className="font-medium">
                              {newBooking.checkOut || "-"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
              <Label htmlFor="room-mobile" className="text-left">
                Room
              </Label>
              <Select
                value={newBooking.roomId}
                onValueChange={handleRoomChange}
              >
                <SelectTrigger
                  id="room-mobile"
                  className={`col-span-1 xl:col-span-3 ${
                    formErrors.roomId ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue
                    placeholder={
                      newBooking.checkIn && newBooking.checkOut
                        ? "Select available room"
                        : "Select room"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="overflow-hidden flex max-w-min">
                  <div className="p-2 sticky top-0 bg-background border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search rooms..."
                        className="pl-8"
                        value={roomSearchQuery}
                        onChange={(e) => setRoomSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {searchFilteredRooms.length > 0 ? (
                    searchFilteredRooms.map((room) => {
                      return (
                        <SelectItem key={room.id} value={room.id}>
                          <div className="flex justify-between items-center gap-3">
                            <span>{room.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {room.type.toLowerCase().includes("private")
                                ? `${room.beds || 1} bed${(room.beds || 1) !== 1 ? "s" : ""}`
                                : `${room.availableBeds}/${room.capacity} available`}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : filteredRoomOptions.length > 0 ? (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      No rooms match your search
                    </div>
                  ) : (
                    <div className="text-center py-3 px-2 text-sm">
                      <p className="text-destructive font-medium">
                        No available rooms
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {newBooking.checkIn && newBooking.checkOut
                          ? "All rooms are booked for these dates. Try different dates."
                          : "Select dates to see available rooms."}
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {formErrors.roomId && (
                <p className="text-red-500 text-xs mt-1 xl:col-start-2 xl:col-span-3">
                  {formErrors.roomId}
                </p>
              )}
            </div>

            {totalPrice === 0 && newBooking.roomId && (
              <div className="grid grid-cols-1 xl:grid-cols-4 items-start gap-2 xl:gap-4">
                <div className="col-span-1 xl:col-span-4">
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md space-y-3">
                    <p className="text-sm text-red-800 font-medium whitespace-normal">
                      No pricing configured for this room and stay type
                    </p>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="manual-price"
                        className="text-sm text-black whitespace-nowrap"
                      >
                        Manual Price
                      </Label>
                      <Input
                        id="manual-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter price"
                        value={manualPrice ?? ""}
                        onChange={(e) =>
                          setManualPrice(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {newBooking.roomId && (
              <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
                <Label className="text-left font-medium">Total Price</Label>
                <div className="col-span-1 xl:col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {accommodationData?.currency || "GHS"}
                    </span>
                    <Input
                      type="number"
                      value={manualPrice ?? totalPrice ?? ""}
                      onChange={(e) =>
                        setManualPrice(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className="text-lg font-semibold h-10 transition-all focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEdit && !isEditRoomInfo && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleContinueToPayment}>
                  <CreditCard />
                  Continue to Payment
                </Button>
              </div>
            )}

            {isEditRoomInfo && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleUpdateRoomInfo} disabled={isBooking}>
                  {isBooking ? (
                    <Loader className="animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Update Room
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New guest form */}
        <div
          className={`transition-transform duration-300 ease-in-out ${
            activeForm === "newGuest" ? "translate-x-0" : "translate-x-full"
          } ${activeForm === "newGuest" ? "relative" : "absolute"} w-full px-1`}
        >
          <div className="w-full">
            <div className="mb-4 flex gap-5 items-start">
              <Button variant="outline" onClick={handleBackToBooking}>
                <ArrowLeft />
              </Button>
              <div>
                <h3 className="text-lg font-medium">New Guest</h3>
                <p className="text-sm text-muted-foreground">
                  Enter details for the new guest
                </p>
              </div>
            </div>

            <div className="space-y-4 pr-1">
              <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
                <Label htmlFor="new-guest-name-mobile" className="text-left">
                  Name*
                </Label>
                <Input
                  id="new-guest-name-mobile"
                  value={newGuestData.name}
                  placeholder="John Doe"
                  onChange={(e) => {
                    setNewGuestData({
                      ...newGuestData,
                      name: e.target.value,
                    });
                    setFormErrors({ ...formErrors, name: "" });
                  }}
                  className={`col-span-1 xl:col-span-3 ${
                    formErrors.name ? "border-red-500" : ""
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs xl:col-start-2 xl:col-span-3">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
                <Label htmlFor="new-guest-phone-mobile" className="text-left">
                  Phone*
                </Label>
                <Input
                  id="new-guest-phone-mobile"
                  value={newGuestData.phone}
                  type="tel"
                  placeholder="123-456-7890"
                  onChange={(e) => {
                    setNewGuestData({
                      ...newGuestData,
                      phone: e.target.value,
                    });
                    setFormErrors({ ...formErrors, phone: "" });
                  }}
                  className={`col-span-1 xl:col-span-3 ${
                    formErrors.phone ? "border-red-500" : ""
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs xl:col-start-2 xl:col-span-3">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
                <Label htmlFor="new-guest-email-mobile" className="text-left">
                  Email
                </Label>
                <Input
                  id="new-guest-email-mobile"
                  type="email"
                  value={newGuestData.email}
                  placeholder="email@example.com"
                  onChange={(e) => {
                    setNewGuestData({
                      ...newGuestData,
                      email: e.target.value,
                    });
                  }}
                  className={`col-span-1 xl:col-span-3`}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
                <Label htmlFor="new-guest-address-mobile" className="text-left">
                  Address
                </Label>
                <Input
                  id="new-guest-address-mobile"
                  value={newGuestData.address}
                  type="text"
                  placeholder="123 Main St, City, Country"
                  onChange={(e) =>
                    setNewGuestData({
                      ...newGuestData,
                      address: e.target.value,
                    })
                  }
                  className="col-span-1 xl:col-span-3"
                />
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleAddNewGuest} disabled={isBooking}>
                  {isBooking && <Loader className="animate-spin" />}
                  Add Guest
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div
          className={`transition-transform duration-300 ease-in-out ${
            activeForm === "payment" ? "translate-x-0" : "translate-x-full"
          } ${activeForm === "payment" ? "relative" : "absolute"} w-full px-1`}
        >
          <div className="w-full">
            <div className="mb-4 flex justify-start gap-4 items-center">
              <Button variant="outline" size="sm" onClick={handleBackToBooking}>
                <ArrowLeft className="" />
              </Button>

              <div>
                <h3 className="text-lg font-medium">Payment Information</h3>
                <p className="text-sm text-muted-foreground">
                  Enter payment details for this booking
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {accommodationData?.currency || "GHS"}{" "}
                    {manualPrice ?? totalPrice}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Payment Status</Label>
                <RadioGroup
                  value={newBooking.paymentStatus}
                  onValueChange={(value: PaymentStatus) =>
                    setNewBooking({ ...newBooking, paymentStatus: value })
                  }
                  className="grid grid-cols-1 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="pending-mobile" />
                    <Label htmlFor="pending-mobile" className="cursor-pointer">
                      No Payment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deposit_paid" id="deposit-mobile" />
                    <Label htmlFor="deposit-mobile" className="cursor-pointer">
                      Deposit Paid
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid_in_full" id="paid-mobile" />
                    <Label htmlFor="paid-mobile" className="cursor-pointer">
                      Paid in Full
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {newBooking.paymentStatus === "deposit_paid" && (
                <div className="space-y-2 px-1">
                  <Label htmlFor="payment-amount-mobile">Payment Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                      {accommodationData?.currency || "GHS"}
                    </span>
                    <Input
                      id="payment-amount-mobile"
                      type="number"
                      placeholder="0.00"
                      className={`pl-12 ${
                        formErrors.paymentAmount ? "border-red-500" : ""
                      }`}
                      value={newBooking.paymentAmount || ""}
                      onChange={(e) =>
                        setNewBooking({
                          ...newBooking,
                          paymentAmount:
                            e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  {formErrors.paymentAmount && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.paymentAmount}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 p-1">
                <Label htmlFor="payment-notes-mobile">Payment Notes</Label>
                <Input
                  id="payment-notes-mobile"
                  placeholder="e.g., Payment method, reference number, etc."
                  value={newBooking.paymentNotes}
                  onChange={(e) =>
                    setNewBooking({
                      ...newBooking,
                      paymentNotes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter
        className={
          isEdit && activeForm === "newGuest"
            ? "md:flex hidden"
            : isEditRoomInfo
              ? "md:flex hidden"
              : ""
        }
      >
        {isEdit ? (
          <Button
            type="submit"
            onClick={handleUpdateSubmit}
            disabled={isBooking}
          >
            {isBooking ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Update Booking
          </Button>
        ) : activeForm === "payment" ? (
          <Button type="submit" onClick={handleAddBooking} disabled={isBooking}>
            {isBooking ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Create Booking
              </>
            )}
          </Button>
        ) : null}
      </DialogFooter>
    </DialogContent>
  );
}
