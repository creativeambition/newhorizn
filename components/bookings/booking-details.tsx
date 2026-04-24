"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/context/auth-context";
import { useAppContext } from "@/lib/context/app-context";
import { BookingDetails, PaymentStatus } from "@/lib/types";
import {
  Bed,
  Calendar,
  ClipboardList,
  CreditCard,
  Edit3,
  Loader,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

interface BookingDetailsProps {
  booking: BookingDetails;
  onUpdatePayment: (booking: BookingDetails) => void;
  onUpdateRoomInfo: (booking: BookingDetails) => void;
  onDelete: (bookingId: string) => void;
  onCheckout?: (booking: BookingDetails) => void;
}

export default function BookingDetailsView({
  booking,
  onUpdatePayment,
  onUpdateRoomInfo,
  onDelete,
  onCheckout,
}: BookingDetailsProps) {
  const { accommodationData } = useAuth();
  const { appConfig } = useAppContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Helper function to format payment status for display
  const formatPaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return "No Payment (Pending)";
      case "deposit_paid":
        return "Deposit Paid";
      case "installment_plan":
        return "Installment Plan";
      case "paid_in_full":
        return "Paid in Full";
      default:
        return status;
    }
  };

  // Helper function to get payment status badge color
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "deposit_paid":
        return "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400";
      case "installment_plan":
        return "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400";
      case "paid_in_full":
        return "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(booking.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete booking:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // format dates for display
  const formatBookingDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DialogContent className="max-w-lg w-full max-h-[calc(100dvh-4rem)] overflow-y-auto">
      <DialogHeader className="border-b pb-4 text-left">
        <DialogTitle className="text-xl">{booking.guestName}</DialogTitle>
        <DialogDescription>
          Booking details and payment information
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pb-4">
        {/* Status Badges */}
        <div className="flex gap-2">
          <Badge variant="outline">
            {booking.bookingType === "student" ? "Student" : "Regular"}
          </Badge>
          <Badge
            className={`${
              booking.status === "upcoming"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : booking.status === "active"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {booking.status === "upcoming"
              ? "Upcoming"
              : booking.status === "active"
                ? "Active"
                : "Completed"}
          </Badge>
        </div>

        {/* Guest Info */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Contact</span>
          </div>
          <div className="space-y-2 text-sm">
            <a
              href={`mailto:${booking.guestEmail}`}
              className="block hover:underline"
            >
              {booking.guestEmail}
            </a>
            <a
              href={`tel:${booking.guestPhone}`}
              className="block hover:underline"
            >
              {booking.guestPhone}
            </a>
          </div>
        </div>

        {/* Room Info */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bed className="h-4 w-4" />
              <span>Room</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateRoomInfo(booking)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <div className="font-semibold text-lg">{booking.roomName}</div>
            <div className="text-sm text-muted-foreground">
              {booking.roomType}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Stay</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Check-in</div>
              <div className="font-medium">
                {formatBookingDate(booking.checkIn)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Check-out</div>
              <div className="font-medium">
                {formatBookingDate(booking.checkOut)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Payment</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdatePayment(booking)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {accommodationData?.currency || "GHS"} {((booking.totalPrice || 0) - (booking.commission || 0)).toFixed(2)}
              </div>
              {(booking.commission ?? 0) > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Total billed: {accommodationData?.currency || "GHS"} {(booking.totalPrice || 0).toFixed(2)}
                </div>
              )}
            </div>
            <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
              {formatPaymentStatus(booking.paymentStatus)}
            </Badge>
          </div>

          {/* Commission Info */}
          <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <ClipboardList className="h-4 w-4" />
              <span>Platform Fee{appConfig && (booking.commission ?? 0) > 0 ? ` (${(appConfig.commissionRate * 100).toFixed(0)}%)` : ""}</span>
            </div>
            <div className="font-semibold">
              {(booking.commission ?? 0) > 0 ? (
                <span className="text-primary">{accommodationData?.currency || "GHS"} {booking.commission!.toFixed(2)}</span>
              ) : (
                <span className="text-green-600 dark:text-green-400">Free</span>
              )}
            </div>
          </div>

          {booking.paymentStatus === "deposit_paid" && (
            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
              <div>
                <div className="text-muted-foreground">Paid</div>
                <div className="font-medium">
                  {accommodationData?.currency || "GHS"} {booking.paymentAmount}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Balance</div>
                <div className="font-medium text-destructive">
                  {accommodationData?.currency || "GHS"}{" "}
                  {booking.totalPrice - booking.paymentAmount}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Host Notes */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            <span>Notes</span>
          </div>
          <div className="text-sm bg-muted/30 p-3 rounded-lg italic border border-dashed text-muted-foreground">
            {booking.paymentNotes || "No host notes recorded."}
          </div>
        </div>

        {/* Checkout */}
        {onCheckout && booking.status !== "completed" && (
          <Button
            variant="default"
            className="w-full"
            onClick={() => setCheckoutDialogOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mark as Checked-out
          </Button>
        )}

        {/* Delete */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Cancel Booking
        </Button>
      </div>

      {/* Checkout Confirmation Dialog */}
      {onCheckout && (
        <AlertDialog
          open={checkoutDialogOpen}
          onOpenChange={setCheckoutDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as checked-out?</AlertDialogTitle>
              <AlertDialogDescription>
                This will complete the booking and update the guest status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setIsCheckingOut(true);
                  try {
                    await onCheckout?.(booking);
                    setCheckoutDialogOpen(false);
                  } finally {
                    setIsCheckingOut(false);
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "Checked-out"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove this
              booking from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  );
}
