"use client";

import { useState, useEffect } from "react";
import {
  BookingDetails,
  Guest,
  NewBookingData,
  NewGuestData,
  Room,
} from "@/lib/types";
import { useAuth } from "@/lib/context/auth-context";
import StudentBookingForm from "./student-booking-form";
import GuestBookingForm from "./guest-booking-form";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, User } from "lucide-react";

type BookingDialogProps = {
  open: boolean;
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
  ) => Promise<BookingDetails | null>;
};

export default function BookingDialog(props: BookingDialogProps) {
  const { accommodationData } = useAuth();

  // Determine if we should show the selection based on accommodation type
  const isHostel = accommodationData?.listingType === "hostel";

  // State for storing the selected flow type: 'student', 'guest', or null (unselected)
  // If editing, we determine it automatically from bookingToEdit.
  // If not a hostel, we default to 'guest' automatically.
  const [flow, setFlow] = useState<"student" | "guest" | null>(() => {
    if (props.isEdit || props.isEditRoomInfo) {
      return props.bookingToEdit?.bookingType === "student"
        ? "student"
        : "guest";
    }
    if (!isHostel) {
      return "guest";
    }
    return null;
  });

  useEffect(() => {
    if (!props.open) {
      // Reset flow when dialog closes after giving time for the exit animation
      if (isHostel && !props.isEdit && !props.isEditRoomInfo) {
        const timer = setTimeout(() => {
          setFlow(null);
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      // Check if we need to force a certain flow upon open
      if (props.isEdit || props.isEditRoomInfo) {
        setFlow(
          props.bookingToEdit?.bookingType === "student" ? "student" : "guest",
        );
      } else if (!isHostel) {
        setFlow("guest");
      } else {
        setFlow(null);
      }
    }
  }, [
    props.open,
    props.isEdit,
    props.isEditRoomInfo,
    props.bookingToEdit,
    isHostel,
  ]);

  if (flow === null) {
    return (
      <DialogContent
        className="sm:max-w-md max-h-screen overflow-y-auto"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-radix-popper-content-wrapper]")) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center">Create New Booking</DialogTitle>
          <DialogDescription className="text-center">
            Select the type of booking
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center p-6 sm:p-8 h-auto gap-3 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => setFlow("student")}
          >
            <div className="p-3 rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <div className="text-base font-semibold">Student</div>
              <div className="text-xs text-muted-foreground">
                Academic bookings
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center p-6 sm:p-8 h-auto gap-3 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => setFlow("guest")}
          >
            <div className="p-3 rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <div className="text-base font-semibold">General Guest</div>
              <div className="text-xs text-muted-foreground">
                Regular bookings
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    );
  }

  if (flow === "student") {
    return <StudentBookingForm {...props} />;
  }

  return <GuestBookingForm {...props} />;
}
