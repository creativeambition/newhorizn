import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, supabase } from "../supabase/client";
import { BookingService } from "../services/booking-service";
import type {
  BookingDetails,
  NewBookingData,
  NewGuestData,
  PaymentStatus,
  BookingStatus,
} from "../types";
import { useAuth } from "../context/auth-context";
import { determineBookingStatus } from "../helpers/booking-utils";

const bookingService = new BookingService();

export function useBookings() {
  const { accommodationData } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", accommodationData?.id],
    queryFn: async () => {
      if (!accommodationData?.id) return [];

      bookingService.accommodationId = accommodationData.id;

      // Using global supabase singleton
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("accommodation_id", accommodationData.id);

      if (error) {
        console.error("Error fetching bookings:", error);
        return [];
      }

      const bookings = data.map((b: any) => ({
        id: b.id,
        guestId: b.guest_id,
        guestName: b.guest_name,
        guestEmail: b.guest_email,
        guestPhone: b.guest_phone,
        roomId: b.room_id,
        roomName: b.room_name,
        roomType: b.room_type,
        roomPrice: b.room_price,
        checkIn: b.check_in,
        checkOut: b.check_out,
        status: b.status,
        totalPrice: b.total_price,
        paymentType: b.payment_type,
        bookingType: b.booking_type,
        paymentStatus: b.payment_status,
        paymentAmount: b.payment_amount,
        paymentNotes: b.payment_notes,
        notes: b.notes,
        commission: b.commission ?? 0,
        createdAt: new Date(b.created_at),
      })) as BookingDetails[];

      const bookingsToUpdate = bookings.filter((bookingEntry) => {
        const currentStatus = determineBookingStatus(
          bookingEntry.checkIn,
          bookingEntry.checkOut,
          bookingEntry.status,
        );
        return bookingEntry.status !== currentStatus;
      });

      if (bookingsToUpdate.length > 0) {
        for (const entry of bookingsToUpdate) {
          const newStatus = determineBookingStatus(
            entry.checkIn,
            entry.checkOut,
            entry.status,
          );

          try {
            await supabase
              .from("bookings")
              .update({ status: newStatus })
              .eq("id", entry.id)
              .eq("accommodation_id", accommodationData.id);
            entry.status = newStatus;
          } catch (error) {
            console.error(
              `Failed to update status for booking ${entry.id}:`,
              error,
            );
          }
        }
      }

      bookingService.bookings = bookings;
      return bookings;
    },
    enabled: !!accommodationData?.id,
  });

  const addBookingMutation = useMutation({
    mutationFn: async (params: {
      bookingData: NewBookingData;
      paymentType: string;
      isNewGuest: boolean;
      newGuestData: NewGuestData;
    }) => {
      const guests = queryClient.getQueryData<any[]>(["guests", accommodationData?.id]) || [];
      const rooms = queryClient.getQueryData<any[]>(["rooms", accommodationData?.id]) || [];
      bookingService.guests = guests;
      bookingService.rooms = rooms;
      bookingService.bookings = bookings;

      return bookingService.addBooking(
        params.bookingData,
        params.paymentType,
        params.isNewGuest,
        params.newGuestData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", accommodationData?.id] });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async (params: {
      updatedBooking: NewBookingData & { id: string };
      updateRoomBeds: (roomId: string, decrease: boolean) => Promise<any>;
    }) => {
      const guests = queryClient.getQueryData<any[]>(["guests", accommodationData?.id]) || [];
      const rooms = queryClient.getQueryData<any[]>(["rooms", accommodationData?.id]) || [];
      bookingService.guests = guests;
      bookingService.rooms = rooms;
      bookingService.bookings = bookings;

      return bookingService.updateBooking(
        params.updatedBooking,
        params.updateRoomBeds,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", accommodationData?.id] });
      queryClient.invalidateQueries({ queryKey: ["rooms", accommodationData?.id] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (params: {
      bookingId: string;
      paymentStatus: PaymentStatus;
      paymentAmount: number;
      paymentNotes: string;
    }) => {
      bookingService.bookings = bookings;
      return bookingService.updatePayment(
        params.bookingId,
        params.paymentStatus,
        params.paymentAmount,
        params.paymentNotes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", accommodationData?.id] });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.deleteBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", accommodationData?.id] });
      queryClient.invalidateQueries({ queryKey: ["rooms", accommodationData?.id] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (params: { bookingId: string; status: BookingStatus }) => {
      bookingService.bookings = bookings;
      return bookingService.updateStatus(params.bookingId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", accommodationData?.id] });
    },
  });

  const refetchBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["bookings", accommodationData?.id] });
  };

  return {
    bookings,
    isLoading,
    addBooking: addBookingMutation.mutateAsync,
    updateBooking: updateBookingMutation.mutateAsync,
    updatePayment: updatePaymentMutation.mutateAsync,
    updateBookingStatus: updateStatusMutation.mutateAsync,
    deleteBooking: deleteBookingMutation.mutateAsync,
    refetchBookings,
  };
}
