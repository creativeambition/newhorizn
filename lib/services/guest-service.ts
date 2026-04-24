import type { Guest, NewGuestData } from "../types";
import { retry } from "../helpers/retry";
import { createClient } from "../supabase/client";

let unsavedGuestEntries: Guest[] = [];

export class GuestService {
  accommodationId: string | null = null;
  guests: Guest[] = [];

  supabase = createClient();

  async saveGuestToDb(newGuestEntry: Guest, id: string): Promise<void> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    await retry(async () => {
      const { error } = await this.supabase.from("guests").insert({
        id,
        accommodation_id: this.accommodationId,
        name: newGuestEntry.name,
        email: newGuestEntry.email,
        phone: newGuestEntry.phone,
        status: newGuestEntry.status,
        address: newGuestEntry.address,
      });

      if (error) throw error;
    });
  }

  getAllGuests(): Guest[] {
    return this.guests;
  }

  getFilteredGuests(searchQuery: string): Guest[] {
    return this.guests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (guest.email &&
          guest.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (guest.phone && guest.phone.includes(searchQuery)),
    );
  }

  getGuestById(id: string): Guest | undefined {
    return this.guests.find((guest) => guest.id === id);
  }

  async addGuest(guestData: NewGuestData): Promise<Guest | { error: string }> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    const tempId = crypto.randomUUID();

    // Create the new guest object
    const newGuest: Guest = {
      id: tempId,
      name: guestData.name,
      phone: guestData.phone,
      email: guestData.email,
      address: guestData.address,
      status: "active",
    };

    try {
      await this.saveGuestToDb(newGuest, tempId);
      return newGuest;
    } catch (error) {
      console.error("Failed to save guest:", error);
      unsavedGuestEntries.push(newGuest);
      localStorage.setItem(
        "unsaved-guest-entries",
        JSON.stringify(unsavedGuestEntries),
      );
      return {
        error: "Failed to save guest",
      };
    }
  }

  async retryFailedGuests(): Promise<void> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    const failedGuestStorage = JSON.parse(
      localStorage.getItem("unsaved-booking-entries") || "[]",
    ) as Guest[];

    if (failedGuestStorage.length === 0) return;

    const successfulRetries: string[] = [];

    for (const guest of failedGuestStorage) {
      try {
        await this.saveGuestToDb(guest, guest.id);
        successfulRetries.push(guest.id);
      } catch (error) {
        console.error(`Failed to retry guest ${guest.id}:`, error);
      }
    }

    // Remove successful retries from localStorage
    if (successfulRetries.length > 0) {
      const remainingBookings = failedGuestStorage.filter(
        (guest) => !successfulRetries.includes(guest.id),
      );
      localStorage.setItem(
        "unsaved-booking-entries",
        JSON.stringify(remainingBookings),
      );
    }
  }

  async updateGuest(updatedGuest: Guest): Promise<Guest | null> {
    const index = this.guests.findIndex(
      (guest) => guest.id === updatedGuest.id,
    );

    if (index === -1) {
      return null;
    }

    try {
      if (!this.accommodationId) {
        throw new Error("No accommodation ID found: Operation failed");
      }

      await retry(async () => {
        const { error } = await this.supabase
          .from("guests")
          .update({
            name: updatedGuest.name,
            email: updatedGuest.email,
            phone: updatedGuest.phone,
            status: updatedGuest.status,
            address: updatedGuest.address,
          })
          .eq("id", updatedGuest.id)
          .eq("accommodation_id", this.accommodationId);

        if (error) throw error;
      });

      // Update local state after successful Firebase update
      this.guests[index] = updatedGuest;
      return updatedGuest;
    } catch (error) {
      console.error("Failed to update guest:", error);
      throw error;
    }
  }

  async deleteGuest(guestId: string): Promise<Guest | null> {
    const guestToDelete = this.getGuestById(guestId);
    if (!guestToDelete) return null;

    try {
      if (!this.accommodationId) {
        throw new Error("No accommodation ID found: Operation failed");
      }

      await retry(async () => {
        const { error } = await this.supabase
          .from("guests")
          .delete()
          .eq("id", guestId)
          .eq("accommodation_id", this.accommodationId);

        if (error) throw error;
      });

      // Update local state after successful Firebase deletion
      this.guests = this.guests.filter((guest) => guest.id !== guestId);
      return guestToDelete;
    } catch (error) {
      console.error("Failed to delete guest:", error);
      throw error;
    }
  }
}
