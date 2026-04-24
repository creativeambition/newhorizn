"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "../../hooks/use-toast";
import { determineBookingStatus } from "../helpers/booking-utils";
import { useBookings, useGuests, useRooms } from "../hooks";
import { BookingService } from "../services/booking-service";
import { GuestService } from "../services/guest-service";
import { RoomService } from "../services/room-service";
import { supabase } from "../supabase/client";
import type {
  BookingDetails,
  BookingStatus,
  Guest,
  NewBookingData,
  NewGuestData,
  PaymentStatus,
  Room,
} from "../types";
import { useAuth } from "./auth-context";

export type AppConfigType = {
  commissionRate: number;
  freeBookings: number;
  serviceFee: number;
};

type AppContextType = {
  appConfig: AppConfigType | null;
  // Booking state and methods
  bookings: BookingDetails[];
  filteredBookings: (
    searchQuery: string,
    paymentFilters: PaymentStatus[],
  ) => BookingDetails[];
  getBookingById: (id: string) => BookingDetails | undefined;
  addBooking: (
    bookingData: NewBookingData,
    paymentType: string,
    isNewGuest: boolean,
    newGuestData: NewGuestData,
    manualPrice?: number | null,
  ) => Promise<BookingDetails | null>;
  updateBooking: (
    updatedBooking: NewBookingData & { id: string },
  ) => Promise<BookingDetails | null>;
  updateRoomInfo: (
    bookingId: string,
    roomId: string,
    paymentType: string,
    totalPrice?: number,
  ) => Promise<BookingDetails | null>;
  updatePayment: (
    bookingId: string,
    paymentStatus: PaymentStatus,
    paymentAmount: number,
    paymentNotes: string,
  ) => Promise<BookingDetails | null>;
  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
  ) => Promise<BookingDetails | null>;
  deleteBooking: (bookingId: string) => Promise<BookingDetails | null>;
  countPendingPayments: () => number;

  // Guest state and methods
  guests: Guest[];
  filteredGuests: (searchQuery: string) => Guest[];
  getGuestById: (id: string) => Guest | undefined;
  addGuest: (guestData: NewGuestData) => Promise<Guest | { error: string }>;
  updateGuest: (updatedGuest: Guest) => Promise<Guest | null>;
  deleteGuest: (guestId: string) => Promise<Guest | null>;

  // Room state and methods
  rooms: Room[];
  addRoom: (room: Omit<Room, "id">) => Promise<Room | null>;
  updateRoom: (room: Room) => Promise<Room | null>;
  updateAvailableBeds: (id: string, decrease?: boolean) => Promise<Room | null>;
  deleteRoom: (id: string) => Promise<Room | null>;
  getRoomById: (id: string) => Room | undefined;
  getRoomsByType: (type: string) => Room[];

  loadEntries: () => Promise<void>;

  isLoading: boolean;

  PAGINATION: number;
};

type trialLimits = {
  roomsLimit: number;
  guestsLimit: number;
  bookingsLimit: number;
};

const bookingService = new BookingService();
const guestService = new GuestService();
const roomService = new RoomService();

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, accommodationData } = useAuth();
  const queryClient = useQueryClient();

  const {
    bookings: bookingsFromQuery,
    isLoading: bookingsLoading,
    refetchBookings,
  } = useBookings();
  const { guests: guestsFromQuery, isLoading: guestsLoading } = useGuests();
  const { rooms: roomsFromQuery, isLoading: roomsLoading } = useRooms();

  const [guestsState, setGuestsState] = useState<Guest[]>([]);
  const [roomsState, setRoomsState] = useState<Room[]>([]);
  const [bookingsState, setBookingsState] = useState<BookingDetails[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfigType | null>(null);

  const isLoading = bookingsLoading || guestsLoading || roomsLoading;

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setAppConfig(data))
      .catch((err) => console.error("Failed to load config", err));
  }, []);

  // Ensure services always have accommodationId when user is available (avoids race with loadEntries)
  useEffect(() => {
    if (accommodationData?.id) {
      bookingService.accommodationId = accommodationData.id;
      guestService.accommodationId = accommodationData.id;
      roomService.accommodationId = accommodationData.id;
    }
  }, [accommodationData?.id]);

  // No need to create local supabase client, will use the imported singleton where possible
  // but keeping createClient for existing patterns if needed.

  async function fetchGuestEntries() {
    if (!accommodationData?.id) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("accommodation_id", accommodationData.id);

      if (error) throw error;
      return data as Guest[];
    } catch (error) {
      console.error("Error loading guest entries:", error);

      return [];
    }
  }

  async function fetchRoomEntries() {
    if (!accommodationData?.id) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("accommodation_id", accommodationData.id);

      if (error) throw error;
      return data as Room[];
    } catch (error) {
      console.error("Error loading room entries:", error);

      return [];
    }
  }

  async function fetchBookingEntries() {
    if (!accommodationData?.id) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("accommodation_id", accommodationData.id);

      if (error) throw error;

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

      return bookings;
    } catch (error) {
      console.error("Error loading booking entries:", error);

      return [];
    }
  }

  useEffect(() => {
    if (bookingsFromQuery.length) setBookingsState(bookingsFromQuery);
  }, [bookingsFromQuery]);

  useEffect(() => {
    if (guestsFromQuery.length) setGuestsState(guestsFromQuery);
  }, [guestsFromQuery]);

  useEffect(() => {
    if (roomsFromQuery.length) setRoomsState(roomsFromQuery);
  }, [roomsFromQuery]);

  const loadEntries = async () => {
    if (!accommodationData?.id) return;

    bookingService.accommodationId = accommodationData.id;
    guestService.accommodationId = accommodationData.id;
    roomService.accommodationId = accommodationData.id;

    try {
      // Invalidate React Query cache to force fresh data
      queryClient.invalidateQueries({
        queryKey: ["bookings", accommodationData.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["guests", accommodationData.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["rooms", accommodationData.id],
      });

      Promise.all([
        bookingService.retryFailedBookings(),
        guestService.retryFailedGuests(),
        roomService.retryFailedRooms(),
      ]).catch(console.error);

      const [guestEntries, bookingEntries, roomEntries] = await Promise.all([
        fetchGuestEntries(),
        fetchBookingEntries(),
        fetchRoomEntries(),
      ]);

      queryClient.setQueryData(["guests", accommodationData.id], guestEntries);
      queryClient.setQueryData(
        ["bookings", accommodationData.id],
        bookingEntries,
      );
      queryClient.setQueryData(["rooms", accommodationData.id], roomEntries);

      setGuestsState(guestEntries);
      setBookingsState(bookingEntries);
      setRoomsState(roomEntries);
    } catch (error) {
      console.error("Failed to load entries:", error);

      toast({
        title: "Error",
        description: "Failed to load entries. Please try again.",
        variant: "destructive",
      });
    }
  };

  guestService["guests"] = guestsState;
  roomService["rooms"] = roomsState;
  bookingService["guests"] = guestsState;
  bookingService["bookings"] = bookingsState;
  bookingService["rooms"] = roomsState;

  const value: AppContextType = {
    appConfig,
    // Booking state and methods
    bookings: bookingsState,
    filteredBookings: (searchQuery, paymentFilters) =>
      bookingService.getFilteredBookings(searchQuery, paymentFilters),
    getBookingById: (id) => bookingService.getBookingById(id),
    addBooking: async (
      bookingData,
      paymentType,
      isNewGuest,
      newGuestData,
      manualPrice,
    ) => {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be signed in to create a booking.",
          variant: "destructive",
        });
        return null;
      }

      bookingService.accommodationId = accommodationData?.id ?? user.id;
      bookingService.guests = guestsState;
      bookingService.rooms = roomsState;
      bookingService.bookings = bookingsState;

      try {
        const newBooking = await bookingService.addBooking(
          bookingData,
          paymentType,
          isNewGuest,
          newGuestData,
          accommodationData?.globalConfig?.semesterEndDate,
          manualPrice,
          accommodationData?.globalConfig?.globalPricing,
        );

        if (!newBooking) return null;

        setBookingsState((prev) => [...prev, newBooking]);

        // Invalidate so React Query re-fetches and stays in sync
        queryClient.invalidateQueries({
          queryKey: ["bookings", accommodationData?.id],
        });

        (async () => {
          const result = await roomService.updateAvailableBeds(
            newBooking.roomId,
            true,
          );
          if (result) {
            setRoomsState((rooms) =>
              rooms.map((room) =>
                room.id === newBooking.roomId ? result : room,
              ),
            );
          }
        })();

        // if booking was created for an existing guest who was previously
        // checked out, flip their status back to active so they appear in
        // lists and can be used normally.
        if (!isNewGuest && bookingData.guestId) {
          const guest = guestsState.find((c) => c.id === bookingData.guestId);
          if (guest && guest.status === "checked-out") {
            try {
              const updated = await guestService.updateGuest({
                ...guest,
                status: "active",
              });
              if (updated) {
                setGuestsState((guests) =>
                  guests.map((c) => (c.id === updated.id ? updated : c)),
                );
                toast({
                  title: "Guest reactivated",
                  description: `${updated.name} has been marked active again.`,
                });
              }
            } catch (err) {
              console.error("Failed to reactivate guest:", err);
            }
          }
        }

        return newBooking;
      } catch (error) {
        console.error("Failed to add booking:", error);
        return null;
      }
    },
    updateBooking: async (updatedBooking) => {
      try {
        const result = await bookingService.updateBooking(
          updatedBooking,
          async (roomId, decrease) => {
            const result = await roomService.updateAvailableBeds(
              roomId,
              decrease,
            );
            if (result) {
              setRoomsState((rooms) =>
                rooms.map((room) => (room.id === roomId ? result : room)),
              );
            }
            return result;
          },
          accommodationData?.globalConfig?.globalPricing,
        );
        if (result) {
          setBookingsState((bookings) =>
            bookings.map((booking) =>
              booking.id === updatedBooking.id ? result : booking,
            ),
          );
        }
        return result;
      } catch (error) {
        console.error("Failed to update booking:", error);
        return null;
      }
    },
    updateBookingStatus: async (bookingId, status) => {
      try {
        // determine whether we need to adjust room availability
        const existing =
          bookingService.getBookingById(bookingId) ||
          bookingsState.find((b) => b.id === bookingId);
        const prevOccupying = existing
          ? existing.status === "active" || existing.status === "upcoming"
          : false;

        const result = await bookingService.updateStatus(bookingId, status);

        if (result) {
          setBookingsState((bookings) =>
            bookings.map((booking) =>
              booking.id === bookingId ? result : booking,
            ),
          );

          try {
            const newOccupying = status === "active" || status === "upcoming";
            // If booking became occupying, decrease available beds; if it stopped occupying, increase available beds
            if (!prevOccupying && newOccupying && existing) {
              const roomUpdate = await roomService.updateAvailableBeds(
                existing.roomId,
                true,
              );
              if (roomUpdate) {
                setRoomsState((rooms) =>
                  rooms.map((r) => (r.id === existing.roomId ? roomUpdate : r)),
                );
              }
            } else if (prevOccupying && !newOccupying && existing) {
              const roomUpdate = await roomService.updateAvailableBeds(
                existing.roomId,
                false,
              );
              if (roomUpdate) {
                setRoomsState((rooms) =>
                  rooms.map((r) => (r.id === existing.roomId ? roomUpdate : r)),
                );
              }
            }
          } catch (err) {
            console.error(
              "Failed to adjust room availability after status change:",
              err,
            );
          }
        }

        return result;
      } catch (error) {
        console.error("Failed to update booking status:", error);
        return null;
      }
    },
    updateRoomInfo: async (bookingId, roomId, paymentType, totalPrice) => {
      try {
        const result = await bookingService.updateRoomInfo(
          bookingId,
          roomId,
          paymentType,
          accommodationData?.globalConfig?.globalPricing,
          totalPrice,
        );
        if (result) {
          const oldRoomId = (result as any).oldRoomId;

          if (oldRoomId && oldRoomId !== roomId) {
            await roomService.updateAvailableBeds(oldRoomId, false);
            await roomService.updateAvailableBeds(roomId, true);

            const oldRoom = await roomService.getRoomById(oldRoomId);
            const newRoom = await roomService.getRoomById(roomId);

            setRoomsState((rooms) =>
              rooms.map((room) => {
                if (room.id === oldRoomId && oldRoom) return oldRoom;
                if (room.id === roomId && newRoom) return newRoom;
                return room;
              }),
            );
          }

          setBookingsState((bookings) =>
            bookings.map((booking) =>
              booking.id === bookingId ? result : booking,
            ),
          );
        }
        return result;
      } catch (error) {
        console.error("Failed to update room info:", error);
        return null;
      }
    },
    updatePayment: async (
      bookingId,
      paymentStatus,
      paymentAmount,
      paymentNotes,
    ) => {
      try {
        const updatedBooking = await bookingService.updatePayment(
          bookingId,
          paymentStatus,
          paymentAmount,
          paymentNotes,
        );
        if (updatedBooking) {
          setBookingsState((bookings) =>
            bookings.map((booking) =>
              booking.id === bookingId ? updatedBooking : booking,
            ),
          );
          return updatedBooking;
        }
        return null;
      } catch (error) {
        console.error("Failed to update payment:", error);
        return null;
      }
    },
    deleteBooking: async (bookingId) => {
      try {
        const deletedBooking = await bookingService.deleteBooking(bookingId);

        if (!deletedBooking) return null;

        (async () => {
          const result = await roomService.updateAvailableBeds(
            deletedBooking.roomId,
            false,
          );
          if (result) {
            setRoomsState((rooms) =>
              rooms.map((room) =>
                room.id === deletedBooking.roomId ? result : room,
              ),
            );
          }
        })();

        setBookingsState((bookings) =>
          bookings.filter((booking) => booking.id !== bookingId),
        );
        return deletedBooking;
      } catch (error) {
        console.error("Failed to delete booking:", error);
        return null;
      }
    },
    countPendingPayments: () => bookingService.countPendingPayments(),

    // Guest state and methods
    guests: guestsState,
    filteredGuests: (searchQuery) =>
      guestService.getFilteredGuests(searchQuery),
    getGuestById: (id) => guestService.getGuestById(id),
    addGuest: async (guestData) => {
      try {
        const newGuest = await guestService.addGuest(guestData);
        if (!("error" in newGuest)) {
          setGuestsState([...guestsState, newGuest]);
        }
        return newGuest;
      } catch (error) {
        console.error("Failed to add guest:", error);
        return { error: "Failed to add guest" };
      }
    },
    updateGuest: async (updatedGuest) => {
      try {
        const result = await guestService.updateGuest(updatedGuest);
        if (result) {
          setGuestsState((guests) =>
            guests.map((guest) =>
              guest.id === updatedGuest.id ? result : guest,
            ),
          );
        }
        return result;
      } catch (error) {
        console.error("Failed to update guest:", error);
        return null;
      }
    },
    deleteGuest: async (guestId) => {
      try {
        const result = await guestService.deleteGuest(guestId);
        if (result) {
          setGuestsState((guests) =>
            guests.filter((guest) => guest.id !== guestId),
          );
        }
        return result;
      } catch (error) {
        console.error("Failed to delete guest:", error);
        return null;
      }
    },

    // Room state and methods
    rooms: roomsState,
    addRoom: async (room) => {
      try {
        const newRoom = await roomService.addRoom(room);
        if (newRoom) {
          setRoomsState([...roomsState, newRoom]);
          return newRoom;
        }
        return null;
      } catch (error) {
        console.error("Failed to add room:", error);
        return null;
      }
    },
    updateRoom: async (room) => {
      try {
        const updatedRoom = await roomService.updateRoom(room);
        if (updatedRoom) {
          setRoomsState((rooms) =>
            rooms.map((r) => (r.id === room.id ? updatedRoom : r)),
          );
          return updatedRoom;
        }
        return null;
      } catch (error) {
        console.error("Failed to update room:", error);
        return null;
      }
    },
    updateAvailableBeds: async (id, decrease = true) => {
      try {
        const updatedRoom = await roomService.updateAvailableBeds(id, decrease);
        if (updatedRoom) {
          setRoomsState((rooms) =>
            rooms.map((r) => (r.id === id ? updatedRoom : r)),
          );
          return updatedRoom;
        }
        return null;
      } catch (error) {
        console.error("Failed to update available beds:", error);
        return null;
      }
    },
    deleteRoom: async (id) => {
      try {
        const deletedRoom = await roomService.deleteRoom(id);
        if (deletedRoom) {
          setRoomsState((rooms) => rooms.filter((r) => r.id !== id));
          return deletedRoom;
        }
        return null;
      } catch (error) {
        console.error("Failed to delete room:", error);
        return null;
      }
    },
    getRoomById: (id) => roomService.getRoomById(id),
    getRoomsByType: (type) => roomService.getRoomsByType(type),

    loadEntries: loadEntries,
    isLoading,

    PAGINATION: 10,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
