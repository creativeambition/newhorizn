import type { Room } from "../types";
import { retry } from "../helpers/retry";
import { createClient } from "../supabase/client";

let unsavedRoomEntries: Room[] = [];

export class RoomService {
  accommodationId: string | null = null;
  rooms: Room[] = [];

  supabase = createClient();

  async saveRoomToDb(newRoomEntry: Room): Promise<void> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    await retry(async () => {
      const { error } = await this.supabase.from("rooms").insert({
        id: newRoomEntry.id,
        accommodation_id: this.accommodationId,
        name: newRoomEntry.name,
        type: newRoomEntry.type,
        pricing: newRoomEntry.pricing,
        media: newRoomEntry.media,
        description: newRoomEntry.description,
        capacity: newRoomEntry.capacity,
        availableBeds: newRoomEntry.availableBeds,
        beds: newRoomEntry.beds,
        amenities: newRoomEntry.amenities,
      });

      if (error) throw error;
    });
  }

  getAllRooms(): Room[] {
    return this.rooms;
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms.find((room) => room.id === id);
  }

  getRoomsByType(type: string): Room[] {
    return this.rooms.filter((room) => {
      if (type === "general") {
        return !room.name.includes("Private");
      } else if (type === "private") {
        return room.name.includes("Private");
      }
      return true;
    });
  }

  async addRoom(room: Omit<Room, "id">): Promise<Room | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      // In Supabase we typically let the DB generate the UUID, but here the UI might need it immediately.
      // We will generate a UUID on the guest using the crypto API for immediate optimistic UI updates
      const tempId = crypto.randomUUID();

      const newRoom: Room = {
        ...room,
        id: tempId,
        availableBeds: room.capacity,
      };

      try {
        await this.saveRoomToDb(newRoom);
        return newRoom;
      } catch (error) {
        console.error("Failed to save room:", error);
        unsavedRoomEntries.push(newRoom);
        localStorage.setItem(
          "unsaved-room-entries",
          JSON.stringify(unsavedRoomEntries),
        );
        return null;
      }
    } catch (error) {
      console.error("Failed to add room:", error);
      return null;
    }
  }

  async retryFailedRooms(): Promise<void> {
    const failedRooms = JSON.parse(
      localStorage.getItem("unsaved-room-entries") || "[]",
    ) as Room[];

    if (failedRooms.length === 0) return;

    const successfulRetries: string[] = [];

    for (const room of failedRooms) {
      try {
        await this.saveRoomToDb(room);
        successfulRetries.push(room.id);
      } catch (error) {
        console.error(`Failed to retry room ${room.id}:`, error);
      }
    }

    // Remove successful retries from localStorage
    if (successfulRetries.length > 0) {
      const remainingRooms = failedRooms.filter(
        (room) => !successfulRetries.includes(room.id),
      );
      localStorage.setItem(
        "unsaved-room-entries",
        JSON.stringify(remainingRooms),
      );
    }
  }

  async updateRoom(updatedRoom: Room): Promise<Room | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      // adjust availableBeds proportionally if capacity changed
      const index = this.rooms.findIndex((room) => room.id === updatedRoom.id);
      if (index === -1) return null;

      const original = this.rooms[index];
      let roomToSave = { ...updatedRoom };
      if (original.capacity !== updatedRoom.capacity) {
        const diff = updatedRoom.capacity - original.capacity;
        // if capacity increased, free up same number of beds
        // if decreased, reduce availableBeds but never negative
        const newAvail = (original.availableBeds || 0) + diff;
        roomToSave.availableBeds = Math.max(
          0,
          Math.min(newAvail, updatedRoom.capacity),
        );
      }

      const { error } = await this.supabase
        .from("rooms")
        .update({
          name: roomToSave.name,
          type: roomToSave.type,
          pricing: roomToSave.pricing,
          media: roomToSave.media,
          description: roomToSave.description,
          capacity: roomToSave.capacity,
          availableBeds: roomToSave.availableBeds,
          beds: roomToSave.beds,
          amenities: roomToSave.amenities,
        })
        .eq("id", updatedRoom.id)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      // update in-memory state
      this.rooms[index] = roomToSave;
      return roomToSave;
    } catch (error) {
      console.error("Failed to update room:", error);
      return null;
    }
  }

  async updateAvailableBeds(
    roomId: string,
    decrease: boolean = true,
  ): Promise<Room | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const roomIndex = this.rooms.findIndex((room) => room.id === roomId);
      if (roomIndex === -1) return null;

      const room = this.rooms[roomIndex];
      const updatedRoom = {
        ...room,
        availableBeds: decrease
          ? Math.max(0, room.availableBeds - 1)
          : Math.min(room.capacity, room.availableBeds + 1),
      };

      const { error } = await this.supabase
        .from("rooms")
        .update({ availableBeds: updatedRoom.availableBeds })
        .eq("id", roomId)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      this.rooms[roomIndex] = updatedRoom;
      return updatedRoom;
    } catch (error) {
      console.error("Failed to update available beds:", error);
      return null;
    }
  }

  async deleteRoom(roomId: string): Promise<Room | null> {
    if (!this.accommodationId) {
      throw new Error("No accommodation ID found: Operation failed");
    }

    try {
      const roomToDelete = this.getRoomById(roomId);
      if (!roomToDelete) return null;

      const { error } = await this.supabase
        .from("rooms")
        .delete()
        .eq("id", roomId)
        .eq("accommodation_id", this.accommodationId);

      if (error) throw error;

      this.rooms = this.rooms.filter((room) => room.id !== roomId);
      return roomToDelete;
    } catch (error) {
      console.error("Failed to delete room:", error);
      return null;
    }
  }
}
