import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, supabase } from "../supabase/client";
import { RoomService } from "../services/room-service";
import type { Room } from "../types";
import { useAuth } from "../context/auth-context";

const roomService = new RoomService();

export function useRooms() {
  const { accommodationData } = useAuth();
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", accommodationData?.id],
    queryFn: async () => {
      if (!accommodationData?.id) return [];

      roomService.accommodationId = accommodationData.id;

      // Using global supabase singleton
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("accommodation_id", accommodationData.id);

      if (error) {
        console.error("Error fetching rooms:", error);
        return [];
      }

      const rooms = data as Room[];

      roomService.rooms = rooms;
      return rooms;
    },
    enabled: !!accommodationData?.id,
  });

  const addRoomMutation = useMutation({
    mutationFn: (room: Omit<Room, "id">) => {
      roomService.rooms = rooms;
      return roomService.addRoom(room);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", accommodationData?.id] });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: (updatedRoom: Room) => {
      roomService.rooms = rooms;
      return roomService.updateRoom(updatedRoom);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", accommodationData?.id] });
    },
  });

  const updateAvailableBedsMutation = useMutation({
    mutationFn: (params: { roomId: string; decrease?: boolean }) => {
      roomService.rooms = rooms;
      return roomService.updateAvailableBeds(params.roomId, params.decrease);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", accommodationData?.id] });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => {
      roomService.rooms = rooms;
      return roomService.deleteRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", accommodationData?.id] });
    },
  });

  return {
    rooms,
    isLoading,
    addRoom: addRoomMutation.mutateAsync,
    updateRoom: updateRoomMutation.mutateAsync,
    updateAvailableBeds: updateAvailableBedsMutation.mutateAsync,
    deleteRoom: deleteRoomMutation.mutateAsync,
  };
}
