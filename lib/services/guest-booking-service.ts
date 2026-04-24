"use client";

import type { BookingStatus, PaymentStatus } from "../types";

export type GuestBooking = {
  id: string;
  accommodationName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  accommodationId: string;
  roomId: string;
  imageUrl?: string | null;
};

const STORAGE_KEY = "newhorizn-bookings";

/**
 * Service to manage guest bookings in localStorage (Accountless flow)
 */
export const guestBookingService = {
  /**
   * Add a booking to localStorage
   */
  addBooking(booking: GuestBooking) {
    if (typeof window === "undefined") return;

    const bookings = this.getBookings();

    // Check if booking already exists
    const existingIndex = bookings.findIndex((b) => b.id === booking.id);

    if (existingIndex >= 0) {
      // Update existing booking
      bookings[existingIndex] = booking;
    } else {
      // Add new booking
      bookings.unshift(booking);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));

    // Dispatch custom event for real-time header updates
    window.dispatchEvent(new Event("guest-bookings-updated"));
  },

  /**
   * Get all bookings from localStorage
   */
  getBookings(): GuestBooking[] {
    if (typeof window === "undefined") return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading guest bookings from localStorage:", e);
      return [];
    }
  },

  /**
   * Update a specific booking in localStorage
   */
  updateBooking(id: string, updates: Partial<GuestBooking>, notify = true) {
    if (typeof window === "undefined") return;

    const bookings = this.getBookings();
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, ...updates } : b,
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (notify) {
      window.dispatchEvent(new Event("guest-bookings-updated"));
    }
  },

  /**
   * Clear all guest bookings (Reset)
   */
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("guest-bookings-updated"));
  },
};
