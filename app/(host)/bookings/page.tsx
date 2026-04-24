"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Search, Filter, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import BookingDialog from "@/components/bookings/booking-dialog";
import BookingDetailsView from "@/components/bookings/booking-details";
import BookingTable from "@/components/bookings/booking-table";
import PaymentUpdateForm from "@/components/bookings/payment-update-form";
import { useAppContext } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import type {
  BookingDetails,
  NewBookingData,
  NewGuestData,
  PaymentStatus,
} from "@/lib/types";
import { CardFooter } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
import Link from "next/link";
import { useRouter } from "next/router";

function BookingsPageContent() {
  const {
    filteredBookings,
    getBookingById,
    addBooking,
    updateBooking,
    updateBookingStatus,
    updateRoomInfo,
    updatePayment,
    deleteBooking,
    countPendingPayments,
    guests,
    updateGuest,
    updateAvailableBeds,
    addGuest,
    rooms,
    PAGINATION,
    appConfig,
    bookings,
  } = useAppContext();
  const { accommodationData } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewBookingId, setViewBookingId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentUpdateDialogOpen, setPaymentUpdateDialogOpen] = useState(false);
  const [paymentUpdateBooking, setPaymentUpdateBooking] =
    useState<BookingDetails | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentStatus[]>([]);
  const [showPendingWarning, setShowPendingWarning] = useState(true);

  const { toast } = useToast();

  const [editBooking, setEditBooking] = useState(false);
  const [editRoomInfo, setEditRoomInfo] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<BookingDetails | null>(
    null,
  );

  const [isBooking, setisBooking] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "accept" | "decline";
    booking: BookingDetails;
  } | null>(null);
  const [hideCommissionAlert, setHideCommissionAlert] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("commission-alert-dismissed") === "1",
  );

  const dismissCommissionAlert = () => {
    localStorage.setItem("commission-alert-dismissed", "1");
    setHideCommissionAlert(true);
  };

  const totalAcceptedCount = bookings.filter((b) => b.status !== "pending").length;

  const commissionLimitReached =
    appConfig != null && totalAcceptedCount >= appConfig.freeBookings;

  const searchParams = useSearchParams();

  // Open booking details when navigating with ?view=bookingId (e.g. from client details "More details")
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId) {
      setViewBookingId(viewId);
      setViewDialogOpen(true);
    }
  }, [searchParams]);

  // Get filtered bookings based on search query and payment filters
  const displayedBookings = filteredBookings(searchQuery, paymentFilters);
  const acceptedBookings = displayedBookings.filter(
    (it) => it.status !== "pending",
  );

  // Count pending payments that need attention
  const pendingPaymentsCount = countPendingPayments();

  // Function to handle viewing a booking
  const handleViewBooking = (id: string) => {
    setViewBookingId(id);
    setViewDialogOpen(true);
  };

  const handleEditBooking = (booking: BookingDetails) => {
    setEditBooking(true);
    setViewDialogOpen(false);
    setBookingToEdit(booking);
  };

  const handleEditRoomInfo = (booking: BookingDetails) => {
    setEditRoomInfo(true);
    setViewDialogOpen(false);
    setBookingToEdit(booking);
  };

  const handleAcceptBooking = (booking: BookingDetails) => {
    if (!accommodationData?.paystack_subaccount_code) {
      toast({
        title: "Payout Setup Required",
        description:
          "Please link your Mobile Money account in Settings before accepting bookings.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings#payout">Settings</Link>
          </Button>
        ),
      });
      return;
    }

    // if (!accommodationData?.payout_verified) {
    //   toast({
    //     title: "Number Verification Required",
    //     description: "",
    //     variant: "destructive",
    //     action: (
    //       <Button variant="outline" size="sm" className="ml-auto">
    //         <Link href="/settings#payout">Verify</Link>
    //       </Button>
    //     ),
    //   });
    //   return;
    // }

    setConfirmAction({ type: "accept", booking });
    setConfirmDialogOpen(true);
  };

  const handleDeclineBooking = (booking: BookingDetails) => {
    setConfirmAction({ type: "decline", booking });
    setConfirmDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!confirmAction) return;

    const { type, booking } = confirmAction;
    if (type === "accept") {
      await updateBookingStatus(booking.id, "upcoming");
      toast({
        title: "Booking Accepted",
        description: "Payment link sent to guest.",
      });
    } else {
      await deleteBooking(booking.id);
      toast({
        title: "Booking Request Deleted",
        description: "The request has been removed.",
      });
    }

    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  // Function to handle updating payment status
  const handleUpdatePaymentClick = (booking: BookingDetails) => {
    setPaymentUpdateBooking(booking);
    setPaymentUpdateDialogOpen(true);
    setViewDialogOpen(false); // Close the view dialog
  };

  // Function to handle payment update
  const handleUpdatePayment = async (
    bookingId: string,
    paymentStatus: PaymentStatus,
    paymentAmount: number,
    paymentNotes: string,
  ) => {
    try {
      const updatedBooking = await updatePayment(
        bookingId,
        paymentStatus,
        paymentAmount,
        paymentNotes,
      );

      if (updatedBooking) {
        setPaymentUpdateDialogOpen(false);
        toast({
          title: "Success",
          description: "Payment information updated successfully",
        });
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      toast({
        title: "Error",
        description: "Failed to update payment. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    }
  };

  // Function to handle deleting a booking
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const deletedBooking = await deleteBooking(bookingId);
      if (deletedBooking) {
        setViewDialogOpen(false);
        toast({
          title: "Success",
          description: `Booking for ${deletedBooking.guestName} has been cancelled.`,
        });
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    }
  };

  // mark guest as checked out: update booking and client, free bed
  const handleCheckout = async (booking: BookingDetails) => {
    setViewDialogOpen(false);
    try {
      // complete booking
      const updated = await updateBookingStatus(booking.id, "completed");
      if (updated) {
        // mark guest checked-out and free bed
        const guest = guests.find((g) => g.id === booking.guestId);
        if (guest) {
          await updateGuest({ ...guest, status: "checked-out" });
        }
        await updateAvailableBeds(booking.roomId, false);
        toast({
          title: "Checked out",
          description: `Guest ${booking.guestName} has been checked out and booking closed.`,
        });
      }
    } catch (error) {
      console.error("Failed to check out client:", error);
      toast({
        title: "Error",
        description: "Unable to check out. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    }
  };

  // Toggle payment filter
  const togglePaymentFilter = (value: PaymentStatus) => {
    setPaymentFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  // Get the current booking being viewed or for payment update
  const currentViewedBooking = viewBookingId
    ? getBookingById(viewBookingId)
    : undefined;

  const handleAddBooking = async (
    bookingData: NewBookingData,
    paymentType: string,
    isNewGuest: boolean,
    newGuestData: NewGuestData,
    manualPrice?: number | null,
  ) => {
    setisBooking(true);
    try {
      const newBooking = await addBooking(
        bookingData,
        paymentType,
        isNewGuest,
        newGuestData,
        manualPrice,
      );

      if (newBooking) {
        toast({
          title: "Success",
          description: `Booking for ${newBooking.guestName} has been created successfully.`,
        });
        setDialogOpen(false);
        return newBooking;
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      return null;
    } finally {
      setisBooking(false);
    }
    return null;
  };

  const handleUpdateBooking = async (
    bookingData: NewBookingData & {
      id: string;
    },
  ) => {
    setisBooking(true);
    try {
      const update = await updateBooking(bookingData);
      if (update) {
        toast({
          title: "Success",
          description: `Booking has been updated successfully.`,
        });
        setDialogOpen(false);
        return update;
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      return null;
    } finally {
      setisBooking(false);
    }
    return null;
  };

  const handleAddGuest = async (guestData: NewGuestData) => {
    setisBooking(true);

    try {
      const newGuest = await addGuest(guestData);

      if ("error" in newGuest) {
        toast({
          title: "Error",
          description: `${newGuest.error}`,
          variant: "destructive",
          icon: <AlertCircle className="h-5 w-5" />,
        });

        throw Error(newGuest.error);
      }

      toast({
        title: "Guest added",
        description: `${newGuest.name} has been added successfully.`,
      });

      return newGuest.id;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setisBooking(false);
    }
  };

  const handleUpdateRoomInfo = async (
    bookingId: string,
    roomId: string,
    paymentType: string,
    totalPrice?: number,
  ) => {
    setisBooking(true);
    try {
      const result = await updateRoomInfo(
        bookingId,
        roomId,
        paymentType,
        totalPrice,
      );
      if (result) {
        toast({
          title: "Success",
          description: "Room information updated successfully.",
        });
        setEditRoomInfo(false);
        setBookingToEdit(null);
        return result;
      }
    } catch (error) {
      console.error("Failed to update room info:", error);
      toast({
        title: "Error",
        description: "Failed to update room information.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      return null;
    } finally {
      setisBooking(false);
    }
    return null;
  };

  const [currentPagination, setCurrentPagination] = useState(0);

  const getPaginationSize = (items: any[]) => {
    return Math.ceil(items.length / PAGINATION);
  };

  const getFilteredBookings = (bookings: any[], tab: string) => {
    switch (tab) {
      case "pending":
        return bookings.filter((booking) => booking.status === "pending");
      case "student":
        return bookings.filter((booking) => booking.bookingType === "student");
      case "regular":
        return bookings.filter((booking) => booking.bookingType === "regular");
      case "upcoming":
        return bookings.filter((booking) => booking.status === "upcoming");
      case "active":
        return bookings.filter((booking) => booking.status === "active");
      case "completed":
        return bookings.filter((booking) => booking.status === "completed");
      default:
        return bookings;
    }
  };

  return (
    <>
      <main className="relative w-full p-3 md:p-6 lg:px-10">
        <div className="grid gap-6">
          <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Bookings
                </h1>
                {appConfig &&
                  totalAcceptedCount < appConfig.freeBookings && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap">
                      {totalAcceptedCount} / {appConfig.freeBookings} Free
                    </span>
                  )}
              </div>
              <p className="text-muted-foreground mt-1">
                Manage all accommodation reservations
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row gap-2 relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search bookings..."
                  className="w-full sm:w-50 md:w-75 pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="sm:w-fit w-full gap-2 ml-auto"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="sm:hidden lg:flex">Payment Status</span>
                      {paymentFilters.length > 0 && (
                        <span className="ml-1 rounded-full bg-primary w-5 h-5 text-xs flex items-center justify-center text-primary-foreground">
                          {paymentFilters.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={paymentFilters.includes("pending")}
                      onCheckedChange={() => togglePaymentFilter("pending")}
                    >
                      No Payment
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={paymentFilters.includes("deposit_paid")}
                      onCheckedChange={() =>
                        togglePaymentFilter("deposit_paid")
                      }
                    >
                      Deposit Paid
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={paymentFilters.includes("paid_in_full")}
                      onCheckedChange={() =>
                        togglePaymentFilter("paid_in_full")
                      }
                    >
                      Paid in Full
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <Button
                  className="w-full sm:w-auto gap-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="sm:hidden md:flex">New Booking</span>
                </Button>

                <BookingDialog
                  guests={guests}
                  roomOptions={rooms}
                  onAddGuest={handleAddGuest}
                  onClose={() => setDialogOpen(false)}
                  onAddBooking={handleAddBooking}
                  isBooking={isBooking}
                  open={dialogOpen}
                />
              </Dialog>
            </div>
          </div>

          {/* Commission limit alert */}
          {commissionLimitReached && !hideCommissionAlert && (
            <div className="relative bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md dark:bg-yellow-900/20 dark:border-yellow-600">
              <div className="flex items-start">
                <AlertCircle className="min-h-5 min-w-5 text-yellow-400 dark:text-yellow-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Free booking limit reached
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    You've used all {appConfig!.freeBookings} free bookings. A{" "}
                    {appConfig!.commissionRate * 100}% platform fee now applies
                    to each new booking.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={dismissCommissionAlert}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Pending Payments Warning */}
          {showPendingWarning && pendingPaymentsCount > 0 && (
            <div className="relative bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md dark:bg-yellow-900/20 dark:border-yellow-600">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => setShowPendingWarning(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-start pr-6">
                <AlertCircle className="min-h-5 min-w-5 text-yellow-400 dark:text-yellow-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Pending Payments Require Attention
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      You have {pendingPaymentsCount} booking
                      {pendingPaymentsCount > 1 ? "s" : ""} with pending payment
                      status. Please update their payment status or cancel them
                      if payment is not received.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="pending" className="overflow-hidden">
            <TabsList className="w-full overflow-x-auto flex sm:w-auto justify-start md:justify-center">
              <TabsTrigger
                value="pending"
                className="flex-1 sm:flex-none"
                onClick={() => setCurrentPagination(0)}
              >
                Pending Requests
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="flex-1 sm:flex-none"
                onClick={() => setCurrentPagination(0)}
              >
                All Bookings
              </TabsTrigger>
              {accommodationData?.listingType === "hostel" && (
                <TabsTrigger
                  value="student"
                  className="flex-1 sm:flex-none"
                  onClick={() => setCurrentPagination(0)}
                >
                  Students
                </TabsTrigger>
              )}

              <TabsTrigger
                value="regular"
                className="flex-1 sm:flex-none"
                onClick={() => setCurrentPagination(0)}
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="flex-1 sm:flex-none"
                onClick={() => setCurrentPagination(0)}
              >
                Upcoming
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex-1 sm:flex-none"
                onClick={() => setCurrentPagination(0)}
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex-1 sm:flex-none"
                onClick={() => setCurrentPagination(0)}
              >
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <BookingTable
                bookings={getFilteredBookings(displayedBookings, "pending")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                showPhone
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(
                        getFilteredBookings(displayedBookings, "pending"),
                      )}
                      totalItems={
                        getFilteredBookings(displayedBookings, "pending").length
                      }
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <BookingTable
                bookings={acceptedBookings}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(acceptedBookings)}
                      totalItems={acceptedBookings.length}
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="student" className="space-y-4">
              <BookingTable
                bookings={getFilteredBookings(acceptedBookings, "student")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(
                        getFilteredBookings(acceptedBookings, "student"),
                      )}
                      totalItems={
                        getFilteredBookings(acceptedBookings, "student").length
                      }
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="regular" className="space-y-4">
              <BookingTable
                bookings={getFilteredBookings(acceptedBookings, "regular")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(
                        getFilteredBookings(acceptedBookings, "regular"),
                      )}
                      totalItems={
                        getFilteredBookings(acceptedBookings, "regular").length
                      }
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              <BookingTable
                bookings={getFilteredBookings(acceptedBookings, "upcoming")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(
                        getFilteredBookings(acceptedBookings, "upcoming"),
                      )}
                      totalItems={
                        getFilteredBookings(acceptedBookings, "upcoming").length
                      }
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <BookingTable
                bookings={getFilteredBookings(acceptedBookings, "active")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(
                        getFilteredBookings(acceptedBookings, "active"),
                      )}
                      totalItems={
                        getFilteredBookings(acceptedBookings, "active").length
                      }
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <BookingTable
                bookings={getFilteredBookings(acceptedBookings, "completed")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewBooking={handleViewBooking}
                onEditBooking={handleEditBooking}
                onAcceptBooking={handleAcceptBooking}
                onDeclineBooking={handleDeclineBooking}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={getPaginationSize(
                        getFilteredBookings(acceptedBookings, "completed"),
                      )}
                      totalItems={
                        getFilteredBookings(acceptedBookings, "completed")
                          .length
                      }
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Booking Details Dialog */}
      {currentViewedBooking && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <BookingDetailsView
            booking={currentViewedBooking}
            onUpdatePayment={handleUpdatePaymentClick}
            onUpdateRoomInfo={handleEditRoomInfo}
            onDelete={handleDeleteBooking}
            onCheckout={handleCheckout}
          />
        </Dialog>
      )}

      {/* Payment Update Dialog */}
      {paymentUpdateBooking && (
        <Dialog
          open={paymentUpdateDialogOpen}
          onOpenChange={setPaymentUpdateDialogOpen}
        >
          <PaymentUpdateForm
            booking={paymentUpdateBooking}
            currentStatus={paymentUpdateBooking.paymentStatus}
            totalPrice={paymentUpdateBooking.totalPrice}
            currentPaymentAmount={paymentUpdateBooking.paymentAmount}
            paymentNotes={paymentUpdateBooking.paymentNotes}
            onUpdatePayment={handleUpdatePayment}
            currency={accommodationData?.currency || "GHS"}
            onClose={() => setPaymentUpdateDialogOpen(false)}
          />
        </Dialog>
      )}

      {bookingToEdit && (
        <>
          <Dialog open={editBooking} onOpenChange={setEditBooking}>
            <BookingDialog
              guests={guests}
              roomOptions={rooms}
              onAddGuest={handleAddGuest}
              onClose={() => setBookingToEdit(null)}
              onAddBooking={handleAddBooking}
              isBooking={isBooking}
              isEdit={editBooking}
              bookingToEdit={bookingToEdit}
              onUpdateBooking={handleUpdateBooking}
              open={editBooking}
            />
          </Dialog>

          <Dialog open={editRoomInfo} onOpenChange={setEditRoomInfo}>
            <BookingDialog
              guests={guests}
              roomOptions={rooms}
              onAddGuest={handleAddGuest}
              onClose={() => {
                setEditRoomInfo(false);
                setBookingToEdit(null);
              }}
              onAddBooking={handleAddBooking}
              isBooking={isBooking}
              isEditRoomInfo={editRoomInfo}
              bookingToEdit={bookingToEdit}
              onUpdateRoomInfo={handleUpdateRoomInfo}
              open={editRoomInfo}
            />
          </Dialog>
        </>
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogCancel className="absolute right-4 top-4 p-1 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50 bg-foreground border-none h-fit w-fit hover:bg-foreground">
            <X className="h-5 w-5 text-background" />
            <span className="sr-only">Close</span>
          </AlertDialogCancel>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>
              {confirmAction?.type === "accept"
                ? "Accept Booking Request?"
                : "Delete Booking Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "accept"
                ? `This will accept the booking for ${confirmAction?.booking.guestName} and send them a payment link.`
                : `Are you sure you want to delete the booking request from ${confirmAction?.booking.guestName}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleActionConfirm}
              className={
                confirmAction?.type === "decline"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction?.type === "accept" ? "Accept" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsPageContent />
    </Suspense>
  );
}
