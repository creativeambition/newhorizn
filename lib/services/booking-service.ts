import { createClient } from "../supabase/client";
import type {
  BookingDetails,
  BookingStatus,
  Guest,
  NewBookingData,
  NewGuestData,
  PaymentStatus,
  PricingConfig,
  Room,
} from "../types";
import { retry } from "../helpers/retry";
import { calculateRoomPrice, getRoomPerNightRate } from "../helpers/pricing";

let unsavedBookingEntries: BookingDetails[] = [];

export class BookingService {
  accommodationId: string | null = null;
  bookings: BookingDetails[] = [];
  guests: Guest[] = [];
  rooms: Room[] = [];

  supabase = createClient();

  private async getConfig() {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch config:", e);
    }
    return { commissionRate: 0.01, freeBookings: 20 };
  }

  private mapBookingToDb(b: BookingDetails) {
    return {
      id: b.id,
      accommodation_id: this.accommodationId,
      guest_id: b.guestId,
      guest_name: b.guestName,
      guest_email: b.guestEmail,
      guest_phone: b.guestPhone,
      room_id: b.roomId,
      room_name: b.roomName,
      room_type: b.roomType,
      room_price: b.roomPrice,
      check_in: b.checkIn,
      check_out: b.checkOut,
      status: b.status,
      total_price: b.totalPrice,
      payment_type: b.paymentType,
      booking_type: b.bookingType,
      payment_status: b.paymentStatus,
      payment_amount: b.paymentAmount,
      payment_notes: b.paymentNotes,
      notes: b.notes,
      commission: b.commission || 0,
      created_at:
        b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    };
  }

  async saveBookingToDb(newBookingEntry: BookingDetails): Promise<void> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    await retry(async () => {
      const { error } = await this.supabase
        .from("bookings")
        .insert(this.mapBookingToDb(newBookingEntry));

      if (error) throw error;
    });
  }

  getAllBookings(): BookingDetails[] {
    return this.bookings.sort((a, b) => {
      // Completed bookings to the bottom
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;

      const dateA = new Date(a.checkIn).getTime();
      const dateB = new Date(b.checkIn).getTime();
      return dateA - dateB;
    });
  }

  getFilteredBookings(
    searchQuery: string,
    paymentFilters: PaymentStatus[],
  ): BookingDetails[] {
    return this.bookings
      .filter((booking) => {
        const matchesSearch =
          booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.roomName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPaymentFilter =
          paymentFilters.length === 0 ||
          paymentFilters.includes(booking.paymentStatus);

        return matchesSearch && matchesPaymentFilter;
      })
      .sort((a, b) => {
        // Completed bookings to the bottom
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;

        const dateA = new Date(a.checkIn).getTime();
        const dateB = new Date(b.checkIn).getTime();
        return dateA - dateB;
      });
  }

  getBookingsByStatus(status: string): BookingDetails[] {
    return this.bookings
      .filter((booking) => booking.status === status)
      .sort((a, b) => {
        const dateA = new Date(a.checkIn).getTime();
        const dateB = new Date(b.checkIn).getTime();
        return dateA - dateB;
      });
  }

  getBookingById(id: string): BookingDetails | undefined {
    return this.bookings.find((booking) => booking.id === id);
  }

  countPendingPayments(): number {
    return this.bookings.filter(
      (booking) =>
        booking.paymentStatus === "pending" &&
        (booking.status === "upcoming" || booking.status === "active"),
    ).length;
  }

  async addBooking(
    bookingData: NewBookingData,
    paymentType: string,
    isNewGuest: boolean,
    newGuestData: NewGuestData,
    semesterEndDate?: string,
    manualPrice?: number | null,
    globalPricing?: PricingConfig,
  ): Promise<BookingDetails | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    // Handle guest information
    let guestName: string;
    let selectedRoom;
    let guestData = {
      email: "",
      phone: "",
    };

    if (isNewGuest && newGuestData.name) {
      // For new guests, use the data directly from newGuestData
      guestName = newGuestData.name;

      // Use the new guest data for the booking
      guestData = {
        email: newGuestData.email || "",
        phone: newGuestData.phone || "",
      };

      selectedRoom = this.rooms.find((room) => room.id === bookingData.roomId);
    } else {
      // For existing guests, find the guest by ID
      const selectedGuest = this.guests.find(
        (guest) => guest.id === bookingData.guestId,
      );

      if (!selectedGuest) {
        console.error("Guest not found");
        return null;
      }

      guestName = selectedGuest.name;

      // Use existing guest data or mock data if needed
      guestData = {
        email:
          selectedGuest.email ||
          `${guestName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        phone: selectedGuest.phone || "+1 555-123-4567",
      };

      selectedRoom = this.rooms.find((room) => room.id === bookingData.roomId);
    }

    if (!selectedRoom) {
      return null;
    }

    const isSemesterPricing = paymentType === "semester";
    const hasDates = !!(bookingData.checkIn && bookingData.checkOut);

    if (selectedRoom && (hasDates || isSemesterPricing)) {
      const isStudent = bookingData.bookingType === "student";

      let totalPrice: number = 0;
      let status: string = "upcoming";
      let checkIn = bookingData.checkIn ?? "";
      let checkOut = bookingData.checkOut ?? "";

      // student semester bookings shouldn't sit in upcoming forever;
      // set check-in to today when absent so status calc marks active.
      if (isSemesterPricing && isStudent && !checkIn) {
        checkIn = new Date().toISOString();
      }

      if (isSemesterPricing) {
        totalPrice =
          calculateRoomPrice(
            selectedRoom,
            "semester",
            undefined,
            globalPricing,
          ) || 0;
        // Use semester end date from settings if available
        if (checkIn && !checkOut) {
          if (semesterEndDate) {
            checkOut = semesterEndDate;
          } else {
            // Fallback to 4 months if no semester end date set
            const checkInDate = new Date(checkIn);
            checkInDate.setMonth(checkInDate.getMonth() + 4);
            checkOut = checkInDate.toISOString().split("T")[0];
          }
        }
        // status based on date
        const today = new Date();
        if (checkIn) {
          const ciDate = new Date(checkIn);
          const coDate = checkOut ? new Date(checkOut) : null;
          if (ciDate <= today && (!coDate || coDate > today)) {
            status = "active";
          } else if (coDate && coDate <= today) {
            status = "completed";
          } else {
            status = "upcoming";
          }
        } else {
          status = "upcoming";
        }
      } else {
        const checkInDate = new Date(bookingData.checkIn!);
        const checkOutDate = new Date(bookingData.checkOut!);
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        totalPrice =
          calculateRoomPrice(selectedRoom, "night", nights, globalPricing) || 0;

        const today = new Date();
        status = "upcoming";
        if (checkInDate <= today && checkOutDate > today) {
          status = "active";
        } else if (checkOutDate <= today) {
          status = "completed";
        }
      }

      // Final total price: prioritize bookingData.totalPrice, then manualPrice, then calculated
      let finalTotalPrice = 0;
      if (typeof bookingData.totalPrice === "number") {
        finalTotalPrice = bookingData.totalPrice;
      } else if (typeof manualPrice === "number") {
        finalTotalPrice = manualPrice;
      } else {
        finalTotalPrice = totalPrice || 0;
      }

      // If payment status is paid_in_full, set payment amount to total price
      const paymentAmount =
        bookingData.paymentStatus === "paid_in_full"
          ? finalTotalPrice
          : bookingData.paymentAmount;

      const tempId = crypto.randomUUID();

      // Fetch dynamic config and actual DB count for accurate commission calculation
      const config = await this.getConfig();
      const { count: dbBookingCount } = await this.supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("accommodation_id", this.accommodationId);
      const commissionRate =
        (dbBookingCount ?? this.bookings.length) >= config.freeBookings
          ? config.commissionRate
          : 0;
      const commission = finalTotalPrice * commissionRate;

      const newBookingEntry: BookingDetails = {
        id: tempId,
        guestId: bookingData.guestId,
        guestName: guestName,
        guestEmail: guestData.email,
        guestPhone: guestData.phone,
        roomId: bookingData.roomId,
        roomName: selectedRoom.name,
        roomType: selectedRoom.name.includes("Private") ? "Private" : "General",
        roomPrice: getRoomPerNightRate(selectedRoom, globalPricing),
        checkIn,
        checkOut,
        status,
        totalPrice: finalTotalPrice,
        paymentType,
        bookingType: bookingData.bookingType,
        paymentStatus: bookingData.paymentStatus,
        paymentAmount,
        paymentNotes: bookingData.paymentNotes,
        notes: "",
        commission,
        createdAt: new Date(Date.now()),
      };

      try {
        await this.saveBookingToDb(newBookingEntry);

        // const roomUpdateResult = await updateRoomBeds(bookingData.roomId, true);
        // if (!roomUpdateResult) {
        //   console.error("Failed to update room availability");
        // }

        return newBookingEntry;
      } catch (error) {
        console.error("Failed to save booking:", error);
        unsavedBookingEntries.push(newBookingEntry);
        localStorage.setItem(
          "unsaved-booking-entries",
          JSON.stringify(unsavedBookingEntries),
        );
        return newBookingEntry;
      }
    }

    return null;
  }

  async updateBooking(
    updatedBooking: NewBookingData & { id: string },
    updateRoomBeds: (roomId: string, decrease: boolean) => Promise<Room | null>,
    globalPricing?: PricingConfig,
  ) {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const existingBooking = this.bookings.find(
        (b) => b.id === updatedBooking.id,
      );
      if (!existingBooking) return null;

      let updatedGuest: Guest | undefined;
      let updatedRoom: Room | undefined;

      if (existingBooking.guestId !== updatedBooking.guestId) {
        updatedGuest = this.guests.find(
          (guest) => guest.id === updatedBooking.guestId,
        );
      }

      if (existingBooking.roomId !== updatedBooking.roomId) {
        updatedRoom = this.rooms.find(
          (room) => room.id === updatedBooking.roomId,
        );
      }

      // Recalculate commission if totalPrice changed
      const config = await this.getConfig();
      const { count: dbBookingCount } = await this.supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("accommodation_id", this.accommodationId);
      const commissionRate =
        (dbBookingCount ?? this.bookings.length) >= config.freeBookings
          ? config.commissionRate
          : 0;
      const commission =
        (updatedBooking.totalPrice ?? existingBooking.totalPrice) *
        commissionRate;

      const bookingUpdate: BookingDetails = {
        ...existingBooking,
        guestEmail: updatedGuest?.email ?? existingBooking.guestEmail,
        guestId: updatedGuest?.id ?? existingBooking.guestId,
        guestName: updatedGuest?.name ?? existingBooking.guestName,
        guestPhone: updatedGuest?.phone ?? existingBooking.guestPhone,
        roomId: updatedRoom?.id ?? existingBooking.roomId,
        roomPrice:
          updatedRoom != null
            ? getRoomPerNightRate(updatedRoom, globalPricing)
            : existingBooking.roomPrice,
        roomName: updatedRoom?.name ?? existingBooking.roomName,
        roomType: updatedRoom?.name?.includes("Private")
          ? "Private"
          : "General",
        checkIn: updatedBooking.checkIn ?? existingBooking.checkIn,
        checkOut: updatedBooking.checkOut ?? existingBooking.checkOut,
        bookingType: updatedBooking.bookingType ?? existingBooking.bookingType,
        paymentStatus:
          updatedBooking.paymentStatus ?? existingBooking.paymentStatus,
        paymentAmount:
          updatedBooking.paymentAmount ?? existingBooking.paymentAmount,
        paymentNotes:
          updatedBooking.paymentNotes ?? existingBooking.paymentNotes,
        totalPrice: updatedBooking.totalPrice ?? existingBooking.totalPrice,
        paymentType: updatedBooking.paymentType ?? existingBooking.paymentType,
        commission: commission,
      };

      try {
        const { error } = await this.supabase
          .from("bookings")
          .update(this.mapBookingToDb(bookingUpdate))
          .eq("id", updatedBooking.id)
          .eq("accommodation_id", this.accommodationId);

        if (error) throw error;

        if (existingBooking.roomId !== updatedBooking.roomId) {
          await updateRoomBeds(updatedBooking.roomId, true);
          await updateRoomBeds(existingBooking.roomId, false);
        }
      } catch (error) {
        console.error("An error occured during booking update:", error);
      }

      return bookingUpdate;
    } catch (error) {
      console.error("Failed to update booking:", error);
      return null;
    }
  }

  async updateRoomInfo(
    bookingId: string,
    newRoomId: string,
    paymentType: string,
    globalPricing?: PricingConfig,
    newTotalPrice?: number,
  ): Promise<BookingDetails | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const existingBooking = this.bookings.find((b) => b.id === bookingId);
      if (!existingBooking) return null;

      const oldRoomId = existingBooking.roomId;
      const newRoom = this.rooms.find((room) => room.id === newRoomId);
      if (!newRoom) return null;

      const isStudent = existingBooking.bookingType === "student";
      const checkInDate = new Date(existingBooking.checkIn);
      const checkOutDate = new Date(existingBooking.checkOut);

      let totalPrice: number = 0;
      if (newTotalPrice !== undefined && newTotalPrice !== null) {
        totalPrice = newTotalPrice;
      } else if (paymentType === "semester") {
        totalPrice =
          calculateRoomPrice(newRoom, "semester", undefined, globalPricing) ||
          0;
      } else if (paymentType === "week") {
        const weeks = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24 * 7),
        );
        totalPrice =
          calculateRoomPrice(newRoom, "week", weeks, globalPricing) || 0;
      } else if (paymentType === "month") {
        const months = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        );
        totalPrice =
          calculateRoomPrice(newRoom, "month", months, globalPricing) || 0;
      } else if (paymentType === "year") {
        const years =
          Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) /
              (1000 * 60 * 60 * 24 * 365),
          ) || 1;
        totalPrice =
          calculateRoomPrice(newRoom, "year", years, globalPricing) || 0;
      } else if (paymentType.startsWith("custom-")) {
        const customPeriodId = paymentType.replace("custom-", "");
        totalPrice =
          calculateRoomPrice(
            newRoom,
            "custom",
            undefined,
            globalPricing,
            customPeriodId,
          ) || 0;
      } else {
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        totalPrice =
          calculateRoomPrice(newRoom, "night", nights, globalPricing) || 0;
      }

      // Handle payment status and amount if total price changed
      let paymentStatus = existingBooking.paymentStatus;
      let paymentAmount = existingBooking.paymentAmount;

      if (totalPrice !== existingBooking.totalPrice) {
        if (
          paymentStatus === "paid_in_full" &&
          totalPrice > existingBooking.totalPrice
        ) {
          paymentStatus = "deposit_paid";
        } else if (
          paymentStatus === "paid_in_full" &&
          totalPrice < existingBooking.totalPrice
        ) {
          // If the price decreased and they were paid in full, update payment amount to match new total
          paymentAmount = totalPrice;
        }
      }

      const config = await this.getConfig();
      const { count: dbBookingCount } = await this.supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("accommodation_id", this.accommodationId);
      const commissionRate =
        (dbBookingCount ?? this.bookings.length) >= config.freeBookings
          ? config.commissionRate
          : 0;
      const commission = (totalPrice || 0) * commissionRate;

      const bookingUpdate: BookingDetails = {
        ...existingBooking,
        roomId: newRoom.id,
        roomName: newRoom.name,
        roomType: newRoom.name?.includes("Private") ? "Private" : "General",
        roomPrice: getRoomPerNightRate(newRoom, globalPricing),
        totalPrice,
        paymentType,
        paymentStatus,
        paymentAmount,
        commission,
      };

      const { error } = await this.supabase
        .from("bookings")
        .update({
          room_id: bookingUpdate.roomId,
          room_name: bookingUpdate.roomName,
          room_type: bookingUpdate.roomType,
          room_price: bookingUpdate.roomPrice,
          total_price: bookingUpdate.totalPrice,
          payment_type: bookingUpdate.paymentType,
          payment_status: bookingUpdate.paymentStatus,
          payment_amount: bookingUpdate.paymentAmount,
          commission: bookingUpdate.commission,
        })
        .eq("id", bookingId)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      const bookingIndex = this.bookings.findIndex((b) => b.id === bookingId);
      if (bookingIndex !== -1) {
        this.bookings[bookingIndex] = bookingUpdate;
      }

      return { ...bookingUpdate, oldRoomId } as any;
    } catch (error) {
      console.error("Failed to update room info:", error);
      return null;
    }
  }

  async retryFailedBookings(): Promise<void> {
    const failedBookings = JSON.parse(
      localStorage.getItem("unsaved-booking-entries") || "[]",
    ) as BookingDetails[];

    if (failedBookings.length === 0) return;

    const successfulRetries: string[] = [];

    for (const booking of failedBookings) {
      try {
        await this.saveBookingToDb(booking);
        successfulRetries.push(booking.id);
      } catch (error) {
        console.error(`Failed to retry booking ${booking.id}:`, error);
      }
    }

    // Remove successful retries from localStorage
    if (successfulRetries.length > 0) {
      const remainingBookings = failedBookings.filter(
        (booking) => !successfulRetries.includes(booking.id),
      );
      localStorage.setItem(
        "unsaved-booking-entries",
        JSON.stringify(remainingBookings),
      );
    }
  }

  // Update payment status
  async updatePayment(
    bookingId: string,
    paymentStatus: PaymentStatus,
    paymentAmount: number,
    paymentNotes: string,
  ): Promise<BookingDetails | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const bookingIndex = this.bookings.findIndex(
        (booking) => booking.id === bookingId,
      );

      if (bookingIndex === -1) return null;

      const updatedBooking = {
        ...this.bookings[bookingIndex],
        paymentStatus,
        paymentAmount,
        paymentNotes,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          payment_amount: paymentAmount,
          payment_notes: paymentNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      this.bookings[bookingIndex] = updatedBooking;
      return updatedBooking;
    } catch (error) {
      console.error("Failed to update payment:", error);
      return null;
    }
  }

  // Update only the status field of a booking (used during checkout)
  async updateStatus(
    bookingId: string,
    status: BookingStatus,
  ): Promise<BookingDetails | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const bookingIndex = this.bookings.findIndex(
        (booking) => booking.id === bookingId,
      );

      if (bookingIndex === -1) return null;

      const updatedBooking = {
        ...this.bookings[bookingIndex],
        status,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from("bookings")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      this.bookings[bookingIndex] = updatedBooking;
      return updatedBooking;
    } catch (error) {
      console.error("Failed to update booking status:", error);
      return null;
    }
  }

  // Delete a booking
  async deleteBooking(bookingId: string): Promise<BookingDetails | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const bookingToDelete = this.getBookingById(bookingId);
      if (!bookingToDelete) return null;

      const { error } = await this.supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      this.bookings = this.bookings.filter(
        (booking) => booking.id !== bookingId,
      );

      return bookingToDelete;
    } catch (error) {
      console.error("Failed to delete booking:", error);
      return null;
    }
  }

  // Format payment status for display
  formatPaymentStatus(status: PaymentStatus): string {
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
  }
}
