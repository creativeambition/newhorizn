import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, supabase } from "../supabase/client";
import { GuestService } from "../services/guest-service";
import type { Guest, NewGuestData } from "../types";
import { useAuth } from "../context/auth-context";

const guestService = new GuestService();

export function useGuests() {
  const { accommodationData } = useAuth();
  const queryClient = useQueryClient();

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["guests", accommodationData?.id],
    queryFn: async () => {
      if (!accommodationData?.id) return [];

      guestService.accommodationId = accommodationData.id;

      // Using global supabase singleton
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("accommodation_id", accommodationData.id);

      if (error) {
        console.error("Error fetching guests:", error);
        return [];
      }

      const guests = data as Guest[];

      guestService.guests = guests;
      return guests;
    },
    enabled: !!accommodationData?.id,
  });

  const addGuestMutation = useMutation({
    mutationFn: (guestData: NewGuestData) => {
      guestService.guests = guests;
      return guestService.addGuest(guestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", accommodationData?.id] });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: (updatedGuest: Guest) => {
      guestService.guests = guests;
      return guestService.updateGuest(updatedGuest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", accommodationData?.id] });
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (guestId: string) => {
      guestService.guests = guests;
      return guestService.deleteGuest(guestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", accommodationData?.id] });
    },
  });

  return {
    guests,
    isLoading,
    addGuest: addGuestMutation.mutateAsync,
    updateGuest: updateGuestMutation.mutateAsync,
    deleteGuest: deleteGuestMutation.mutateAsync,
  };
}
