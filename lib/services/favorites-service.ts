import type { PublicListing } from "./public-listing-service";

const FAVORITES_KEY = "newhorizn_favorites";

export function getSavedRooms(): PublicListing[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(FAVORITES_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveRoom(room: PublicListing): void {
  const saved = getSavedRooms();
  const exists = saved.some(
    (r) => r.id === room.id && r.accommodationId === room.accommodationId,
  );
  if (!exists) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...saved, room]));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("favorites-updated"));
    }
  }
}

export function removeRoom(roomId: string, accommodationId: string): void {
  const saved = getSavedRooms();
  const filtered = saved.filter(
    (r) => !(r.id === roomId && r.accommodationId === accommodationId),
  );
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("favorites-updated"));
  }
}

export function isRoomSaved(roomId: string, accommodationId: string): boolean {
  const saved = getSavedRooms();
  return saved.some(
    (r) => r.id === roomId && r.accommodationId === accommodationId,
  );
}
