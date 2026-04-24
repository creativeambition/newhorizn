"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Trash2,
  AlertTriangle,
  Loader2,
  Bed,
  Calendar,
  ExternalLink,
  Edit3Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import { Guest, BookingDetails } from "@/lib/types";
import { format } from "date-fns";

type GuestDetailsProps = {
  guest: Guest;
  /** Bookings for this guest (e.g. active/upcoming). Shown as summary with link to full booking details. */
  guestBookings?: BookingDetails[];
  onClose: () => void;
  onEdit: (guestId: string) => void;
  onDelete: (guestId: string) => void;
  isDeleting?: boolean;
};

function formatDate(value: string | Date) {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "-";
    return format(d, "MMM d, yyyy");
  } catch {
    return "-";
  }
}

export default function GuestDetailsView({
  guest,
  guestBookings = [],
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: GuestDetailsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const primaryBooking = guestBookings[0];

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    onDelete(guest.id);
  };

  return (
    <DialogContent className="sm:max-w-150 max-h-[calc(100dvh-4rem)] overflow-y-auto">
      <DialogHeader className="flex items-start justify-between gap-4">
        <div>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {guest.name}
          </DialogTitle>
          <DialogDescription>
            Complete information about this guest
          </DialogDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(guest.id)}>
            <Edit3Icon />
            Edit Guest Info
          </Button>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        {/* Guest Status */}
        <div className="flex justify-between items-center">
          <Badge
            className={`${
              guest.status === "active"
                ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                : guest.status === "checked-out"
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  : "bg-transparent text-muted-foreground"
            }`}
          >
            {guest.status === "active"
              ? "Active Guest"
              : guest.status === "checked-out"
                ? "Checked Out"
                : "No Booking"}
          </Badge>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <CardTitle className="text-base">Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Name:</div>
              <div>{guest.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Email:</div>
              <div className="flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />

                {guest.email ? (
                  <a
                    href={`mailto:${guest.email}`}
                    className="text-primary hover:underline"
                  >
                    {guest.email}
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Phone:</div>
              <div className="flex items-center">
                <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                {guest.phone ? (
                  <a href={`tel:${guest.phone}`} className="hover:underline">
                    {guest.phone}
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking summary */}
        {primaryBooking && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                  <CardTitle className="text-base">Booking</CardTitle>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {primaryBooking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Room:</div>
                <div>{primaryBooking.roomName}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Check-in:</div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(primaryBooking.checkIn)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Check-out:</div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(primaryBooking.checkOut)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Payment:</div>
                <div className="capitalize">
                  {primaryBooking.paymentStatus.replace(/_/g, " ")}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                asChild
              >
                <Link href={`/bookings?view=${primaryBooking.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  More details
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
              <CardTitle className="text-base text-destructive">
                Danger Zone
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-col space-y-2">
              <div>
                <div className="font-medium">Delete Guest</div>
                <div className="text-muted-foreground">
                  Permanently remove this guest and all their data from the
                  system.
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full md:w-fit"
                onClick={() => setDeleteDialogOpen(true)}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Guest
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {guest.name}'s profile and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  );
}
