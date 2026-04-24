import type { Room, BookingDetails } from "../types";

/**
 * Calculate current available beds for a room based on active bookings.
 * For private rooms, returns 0 if any active booking exists, otherwise capacity.
 * For shared rooms, returns capacity minus active bookings.
 */
export function calculateAvailableBeds(
  room: Room,
  bookings: BookingDetails[],
): number {
  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date(todayStr).getTime();
  const oneDayMs = 1 * 24 * 60 * 60 * 1000;

  // Get active bookings (currently occupied or upcoming within buffer)
  const activeBookings = bookings.filter((b) => {
    if (b.roomId !== room.id) return false;
    if (b.status !== "active" && b.status !== "upcoming" && b.status !== "pending") return false;
    if (!b.checkIn) return false; // Must have check-in date

    const checkIn = new Date(b.checkIn).getTime();

    // If no checkout date, treat as long-term booking (active if started or starting tomorrow)
    if (!b.checkOut) {
      return checkIn - oneDayMs <= today;
    }

    const checkOut = new Date(b.checkOut).getTime();

    // An active booking blocks a 1-night stay starting today (today -> tomorrow).
    // Due to the 1-day buffer, a stay today to tomorrow requires the next day to be empty.
    // Overlaps with any booking where: IN <= b.out + 1 day AND OUT_BUFFER >= b.in
    // today <= checkOut + 1 day  =>  checkOut >= today - 1 day
    // today + 2 days >= checkIn  =>  checkIn <= today + 2 days
    return checkOut >= today - oneDayMs && checkIn <= today + 2 * oneDayMs;
  });

  const isPrivate = room.type.toLowerCase().includes("private");

  if (isPrivate) {
    // Private room: 0 if any active booking, otherwise full capacity
    return activeBookings.length > 0 ? 0 : room.capacity;
  }

  // Shared room: capacity minus active bookings
  return Math.max(0, room.capacity - activeBookings.length);
}

/**
 * Returns an array of dates where the given room has reached its maximum capacity.
 * For private rooms, capacity is essentially 1 (the whole room is booked).
 * For shared rooms, it counts overlapping bookings on each specific day.
 * Includes a 1-day buffer period after check-out as per the system requirements.
 */
export const getFullyBookedDates = (
  room: Room | undefined | null,
  bookings: BookingDetails[],
): Date[] => {
  if (!room) return [];

  // Filter bookings for this specific room that are active or upcoming
  const roomBookings = bookings.filter(
    (b) =>
      b.roomId === room.id &&
      (b.status === "active" || b.status === "upcoming" || b.status === "pending") &&
      b.checkIn &&
      b.checkOut,
  );

  if (roomBookings.length === 0) return [];

  const isPrivate = room.type?.toLowerCase().includes("private");
  const capacity = isPrivate ? 1 : room.capacity || 1;

  // Track the number of bookings per day (stored as YYYY-MM-DD string -> count)
  const dateCounts = new Map<string, number>();

  roomBookings.forEach((b) => {
    const start = new Date(b.checkIn);
    const end = new Date(b.checkOut);
    const current = new Date(start);

    // Count each day of the booking
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const count = dateCounts.get(dateStr) || 0;
      dateCounts.set(dateStr, count + 1);

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    // Add 1-day buffer after checkout to the capacity count
    for (let i = 1; i <= 1; i++) {
      const bufferDate = new Date(end);
      bufferDate.setDate(bufferDate.getDate() + i);
      const dateStr = bufferDate.toISOString().split("T")[0];
      const count = dateCounts.get(dateStr) || 0;
      dateCounts.set(dateStr, count + 1);
    }
  });

  // Extract dates that have exceeded the room's capacity (100% booked)
  const fullyBookedDates: Date[] = [];
  dateCounts.forEach((count, dateStr) => {
    if (count >= capacity) {
      // Create Date object, handling timezone issues by using local time parsing
      const [year, month, day] = dateStr.split("-").map(Number);
      fullyBookedDates.push(new Date(year, month - 1, day));
    }
  });

  return fullyBookedDates;
};

export const getBookedAndBufferDates = (
  room: Room | undefined | null,
  bookings: BookingDetails[],
): { bookedDates: Date[]; bufferDates: Date[] } => {
  if (!room) return { bookedDates: [], bufferDates: [] };

  const roomBookings = bookings.filter(
    (b) =>
      b.roomId === room.id &&
      (b.status === "active" || b.status === "upcoming" || b.status === "pending") &&
      b.checkIn &&
      b.checkOut,
  );

  if (roomBookings.length === 0) return { bookedDates: [], bufferDates: [] };

  const isPrivate = room.type?.toLowerCase().includes("private");
  const capacity = isPrivate ? 1 : room.capacity || 1;

  const bookingCounts = new Map<string, number>();
  const bufferCounts = new Map<string, number>();

  roomBookings.forEach((b) => {
    const start = new Date(b.checkIn);
    const end = new Date(b.checkOut);
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      bookingCounts.set(dateStr, (bookingCounts.get(dateStr) || 0) + 1);
      current.setDate(current.getDate() + 1);
    }

    for (let i = 1; i <= 1; i++) {
      const bufferDate = new Date(end);
      bufferDate.setDate(bufferDate.getDate() + i);
      const dateStr = bufferDate.toISOString().split("T")[0];
      bufferCounts.set(dateStr, (bufferCounts.get(dateStr) || 0) + 1);
    }
  });

  const bookedDates: Date[] = [];
  const bufferDates: Date[] = [];

  bookingCounts.forEach((count, dateStr) => {
    if (count >= capacity) {
      const [year, month, day] = dateStr.split("-").map(Number);
      bookedDates.push(new Date(year, month - 1, day));
    }
  });

  bufferCounts.forEach((count, dateStr) => {
    if (count >= capacity && !bookingCounts.has(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      bufferDates.push(new Date(year, month - 1, day));
    }
  });

  return { bookedDates, bufferDates };
};
