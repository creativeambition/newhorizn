"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAppContext } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import { BookingDetails } from "@/lib/types";
import { CalendarX, Eye, Pen } from "lucide-react";
import { ReactNode } from "react";
import { Loading } from "../loading";

type BookingTableProps = {
  bookings: BookingDetails[];
  currentPagination: number;
  paginationSize: number;
  onViewBooking: (id: string) => void;
  onEditBooking: (booking: BookingDetails) => void;
  onAcceptBooking?: (booking: BookingDetails) => void;
  onDeclineBooking?: (booking: BookingDetails) => void;
  footer: ReactNode;
  showPhone?: boolean;
};

export default function BookingTable({
  bookings,
  currentPagination,
  paginationSize,
  onViewBooking,
  onEditBooking,
  onAcceptBooking,
  onDeclineBooking,
  footer,
  showPhone = false,
}: BookingTableProps) {
  const { isLoading } = useAppContext();
  const { accommodationData } = useAuth();
  // Helper function to format payment status for display
  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "No Payment";
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
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "deposit_paid":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "installment_plan":
        return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      case "paid_in_full":
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // format date cells, hiding for invalid values
  const formatDateValue = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US");
  };

  return isLoading ? (
    <Loading />
  ) : bookings.length > 0 ? (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                {showPhone && <TableHead>Phone</TableHead>}
                <TableHead>Room</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bookings
                .slice(
                  currentPagination * paginationSize,
                  currentPagination * paginationSize + paginationSize,
                )
                .map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.guestName}
                    </TableCell>
                    {showPhone && (
                      <TableCell className="text-sm text-muted-foreground">
                        {booking.guestPhone || "-"}
                      </TableCell>
                    )}
                    <TableCell>{booking.roomName}</TableCell>
                    <TableCell>{formatDateValue(booking.checkIn)}</TableCell>
                    <TableCell>{formatDateValue(booking.checkOut)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          booking.status === "pending"
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                            : booking.status === "declined"
                              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : booking.status === "upcoming"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : booking.status === "active"
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {booking.status === "pending"
                          ? "Pending"
                          : booking.status === "declined"
                            ? "Declined"
                            : booking.status === "upcoming"
                              ? "Upcoming"
                              : booking.status === "active"
                                ? "Active"
                                : "Completed"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getPaymentStatusColor(booking.paymentStatus)}
                      >
                        {formatPaymentStatus(booking.paymentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {accommodationData?.currency || "GHS"}{" "}
                      {booking.totalPrice}
                    </TableCell>
                    <TableCell className="text-right sticky right-0 bg-linear-to-r from-transparent to-background">
                      {booking.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onAcceptBooking?.(booking)}
                            className="bg-green-400 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeclineBooking?.(booking)}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewBooking(booking.id)}
                            className="bg-background/40 backdrop-blur-sm border"
                          >
                            <Eye />
                            View
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditBooking(booking)}
                            className="ml-3"
                          >
                            <Pen />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {footer}
    </Card>
  ) : (
    <div className="h-75 flex flex-col items-center justify-center gap-2">
      <CalendarX className="h-8 w-8 text-muted-foreground" />
      <p className="text-lg font-medium text-muted-foreground">
        No bookings found
      </p>
      <p className="text-sm text-muted-foreground">
        Add a new booking to get started
      </p>
    </div>
  );
}
