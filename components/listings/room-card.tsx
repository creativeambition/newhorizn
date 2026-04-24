"use client";
import { Button } from "@/components/ui/button";
import {
  isRoomSaved,
  removeRoom,
  saveRoom,
} from "@/lib/services/favorites-service";
import type { PublicListing } from "@/lib/services/public-listing-service";
import { Bed, Heart, Play, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function RoomCard({ room }: { room: PublicListing }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(isRoomSaved(room.id, room.accommodationId));
  }, [room.id, room.accommodationId]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSaved) {
      removeRoom(room.id, room.accommodationId);
    } else {
      saveRoom(room);
    }
    setIsSaved(!isSaved);
  };

  return (
    <div className="group">
      <Link
        href={`/accommodations/${room.accommodationId}/${room.id}`}
        className="block active:scale-[0.98] transition-all duration-200"
      >
        <div className="space-y-3 group-hover:bg-accent transition-all duration-200 p-3 pb-4 rounded-3xl">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted group/media">
            {room.media && room.media.length > 0 ? (
              <div className="absolute inset-0">
                {room.media[0].url.match(/\.(mp4|webm|ogg)$/i) ||
                room.media[0].url.includes("video") ? (
                  <div className="relative w-full h-full">
                    <video
                      src={room.media[0].url}
                      className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="bg-background/80 p-2 rounded-full backdrop-blur-sm">
                        <Play className="h-6 w-6 fill-primary text-primary" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={room.media[0].url}
                    alt={room.media[0].title || room.name}
                    className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5 group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Bed className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {room.name}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={toggleSave}
              >
                <Heart
                  className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="space-y-2 px-2">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:underline">
              {room.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{room.capacity}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                <span>{room.availableBeds} free</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
