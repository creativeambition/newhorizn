"use client";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MapPin,
  Users,
  Bed,
  X,
  Home,
  Trash2,
  ChevronRight,
  CalendarDays,
  Trash,
} from "lucide-react";
import { getSavedRooms, removeRoom } from "@/lib/services/favorites-service";
import type { PublicListing } from "@/lib/services/public-listing-service";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getRoomDisplayPrice } from "@/lib/helpers/pricing";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function FavoritesDrawer() {
  const [savedRooms, setSavedRooms] = useState<PublicListing[]>([]);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const loadSavedRooms = () => {
    setSavedRooms(getSavedRooms());
  };

  useEffect(() => {
    loadSavedRooms();
    const handleUpdate = () => {
      loadSavedRooms();
    };
    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, []);

  useEffect(() => {
    if (open) {
      loadSavedRooms();
    }
  }, [open]);

  const handleRemove = (roomId: string, accommodationId: string) => {
    removeRoom(roomId, accommodationId);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Heart className="h-5 w-5" />
          {savedRooms.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {savedRooms.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left flex items-center gap-2">
            Saved Rooms ({savedRooms.length})
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {savedRooms.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-bold text-lg mb-1">No saved rooms</h3>
              <p className="text-muted-foreground text-sm">
                Rooms you save will appear here for easy access later.
              </p>
            </div>
          ) : (
            savedRooms.map((room) => {
              const displayPrice = getRoomDisplayPrice(
                room,
                room.globalConfig?.globalPricing,
              );
              return (
                <div
                  key={`${room.accommodationId}-${room.id}`}
                  className="group relative border rounded-2xl p-3 hover:shadow-md transition-all bg-card overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-20"
                    onClick={() => handleRemove(room.id, room.accommodationId)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                      {room.media?.[0]?.url ? (
                        <img
                          src={room.media[0].url}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Home className="h-8 w-8 text-primary/20" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold truncate pr-4">
                          {room.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {room.accommodationName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0 h-5 flex items-center gap-1",
                            room.availableBeds > 0
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                              : "bg-zinc-500/10 text-zinc-600 border-zinc-200",
                          )}
                        >
                          {room.availableBeds > 0
                            ? "Available"
                            : "Fully Booked"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 p-2.5">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{room.capacity} beds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bed className="h-3.5 w-3.5" />
                        <span>{room.availableBeds} free</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="mt-3 flex items-center justify-between pr-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                        Starting from
                      </span>
                      <span className="text-sm font-black text-primary">
                        {room.currency || "GHS"} {displayPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl h-8 font-bold px-3 gap-1.5 shadow-sm"
                        asChild
                        onClick={() => setOpen(false)}
                      >
                        <Link
                          href={`/accommodations/${room.accommodationId}/${room.id}`}
                        >
                          Book Now
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
