"use client";
import { BookingSheet } from "@/components/listings/booking-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { useExplorePage } from "@/lib/context/explore-page-context";
import type { PublicListing } from "@/lib/services/public-listing-service";
import { getListingById } from "@/lib/services/public-listing-service";
import {
  isRoomSaved,
  saveRoom,
  removeRoom,
} from "@/lib/services/favorites-service";
import { Bed, CheckCircle, MapPin, Tag, Users, Heart } from "lucide-react";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomDetail({
  params,
}: {
  params: Promise<{ accommodationId: string; roomId: string }>;
}) {
  const [room, setRoom] = useState<PublicListing | null>(null);
  const [roomId, setRoomId] = useState("");
  const { setActiveListing } = useExplorePage();
  const [isSaved, setIsSaved] = useState(false);
  const roomImages = room?.media && room.media.length > 0 ? room.media : null;

  useEffect(() => {
    params.then(({ accommodationId, roomId }) => {
      setRoomId(roomId);
      getListingById(accommodationId, roomId).then((data) => {
        if (!data) {
          notFound();
        }
        setRoom(data);
        setActiveListing(data);
      });
    });

    return () => setActiveListing(null);
  }, [params, setActiveListing]);

  useEffect(() => {
    if (room) {
      setIsSaved(isRoomSaved(room.id, room.accommodationId));
    }
  }, [room]);

  useEffect(() => {
    const handleUpdate = () => {
      if (room) {
        setIsSaved(isRoomSaved(room.id, room.accommodationId));
      }
    };
    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, [room]);

  const toggleSave = () => {
    if (!room) return;
    if (isSaved) {
      removeRoom(room.id, room.accommodationId);
    } else {
      saveRoom(room);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-440 mx-auto px-6 lg:px-20 py-8 space-y-6">
          <div className="flex gap-4 overflow-hidden">
            <div className="w-full md:w-[calc(50%-0.5rem)] shrink-0 aspect-video rounded-2xl bg-muted animate-pulse" />
            <div className="hidden md:block w-[calc(50%-0.5rem)] shrink-0 aspect-video rounded-2xl bg-muted animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-8 w-64 rounded bg-muted animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-48 rounded bg-muted animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex gap-6">
                <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                <div className="h-5 w-24 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-px bg-muted" />
              <div className="space-y-3">
                <div className="h-6 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-px bg-muted" />
              <div className="space-y-4">
                <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                <div className="grid sm:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border-2 border-border p-6 space-y-4">
                <div className="h-4 w-56 rounded bg-muted animate-pulse" />
                <div className="h-11 w-full rounded-lg bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-440 mx-auto py-8">
        <div className="space-y-6">
          {/* Room images: full width; one per view on mobile, multiple side-by-side on desktop (each 16:9) */}
          <div className="relative w-full overflow-hidden">
            <Carousel opts={{ align: "center" }}>
              <CarouselContent className="ml-0 gap-4 px-6 lg:px-20">
                {(roomImages || [{ url: null }]).map(
                  (img: any, idx: number) => (
                    <CarouselItem
                      key={idx}
                      className="pl-0 basis-full shrink-0 md:basis-[calc(50%-0.5rem)] lg:basis-[calc(50%-0.667rem)] xl:basis-[calc(45%-0.667rem)]"
                    >
                      {img?.url ? (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-50">
                          <img
                            src={img.url}
                            alt={img.title || room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-linear-to-br from-primary/20 to-primary/5">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Bed className="h-24 w-24 sm:h-32 sm:w-32 text-muted-foreground/20" />
                          </div>
                        </div>
                      )}
                    </CarouselItem>
                  ),
                )}
                {/* Spacer for end padding */}
                <div className="basis-6 lg:basis-20 shrink-0" />
              </CarouselContent>
              <CarouselPrevious className="left-2 sm:left-4 h-8 w-8 sm:h-10 sm:w-10" />
              <CarouselNext className="right-2 sm:right-4 h-8 w-8 sm:h-10 sm:w-10" />
            </Carousel>
          </div>

          <div className="px-6 lg:px-20">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl font-semibold">{room.name}</h1>

              <Button
                variant="outline"
                size="default"
                className="rounded-full"
                onClick={toggleSave}
              >
                <Heart
                  className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </Button>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{room.accommodationName}</span>
              </div>
              <Badge variant={room.availableBeds > 0 ? "default" : "secondary"}>
                {room.availableBeds > 0 ? "Available" : "Fully Booked"}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 px-6 lg:px-20">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center gap-4 text-base">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{room.capacity} beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    <span>{room.availableBeds} available</span>
                  </div>
                </div>
              </div>

              <Separator />

              {room.description && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-2">
                    About this room
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {room.description}
                  </p>
                </div>
              )}

              {room.amenities && room.amenities.length > 0 && (
                <>
                  {/* <Separator /> */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      What this room offers
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {room.amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-xl border-2">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4 shrink-0" />
                    <span>
                      Pricing options available — open booking to view
                    </span>
                  </div>

                  <BookingSheet
                    listing={room}
                    trigger={
                      <Button size="lg" className="w-full">
                        Book Now
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
