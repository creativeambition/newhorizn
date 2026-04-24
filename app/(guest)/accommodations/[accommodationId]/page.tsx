"use client";

import { RoomCard } from "@/components/listings/room-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useExplorePage } from "@/lib/context/explore-page-context";
import { Accommodation, Room } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface PageProps {
  params: Promise<{ accommodationId: string }>;
}

export default function AccommodationPage({ params }: PageProps) {
  const { accommodationId } = use(params);
  const router = useRouter();

  const { data: accommodation, isLoading: loading } = useQuery<
    Accommodation & { totalAvailableBeds: number; minPrice?: number }
  >({
    queryKey: ["accommodation", accommodationId],
    queryFn: async () => {
      const res = await fetch(`/api/accommodations/${accommodationId}`);
      if (!res.ok) throw new Error("Failed to fetch accommodation");
      return res.json();
    },
  });

  const { setActiveListing } = useExplorePage();

  useEffect(() => {
    if (accommodation) {
      setActiveListing({
        ...accommodation,
        name: accommodation.accommodationName,
      } as any);
    }
    return () => setActiveListing(null);
  }, [accommodation, setActiveListing]);

  const [roomType, setRoomType] = useState("all");

  const filteredRooms =
    accommodation?.rooms?.filter((r: Room) => {
      if (roomType === "all") return true;
      return roomType === "private"
        ? r.type.toLowerCase().includes("private")
        : !r.type.toLowerCase().includes("private");
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto px-3 lg:px-12 py-8 max-md:pt-2">
          {/* Carousel skeleton */}
          <div className="flex gap-4 overflow-hidden mb-8">
            <div className="w-full shrink-0 md:w-[calc(70%-0.5rem)] lg:w-[calc(60%-0.667rem)] xl:w-[calc(55%-0.667rem)] aspect-video rounded-2xl bg-muted animate-pulse" />
            <div className="hidden md:block shrink-0 md:w-[calc(70%-0.5rem)] lg:w-[calc(60%-0.667rem)] xl:w-[calc(55%-0.667rem)] aspect-video rounded-2xl bg-muted animate-pulse" />
            <div className="hidden xl:block shrink-0 xl:w-[calc(55%-0.667rem)] aspect-video rounded-2xl bg-muted animate-pulse" />
          </div>

          {/* Title + address */}
          <div className="mb-4 space-y-2">
            <div className="h-6 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>

          {/* Description */}
          <div className="mb-12 max-w-4xl space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
          </div>

          <div className="grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-muted rounded-xl animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <Button variant="ghost" className="gap-2">
          <Link href="/accommodations" className="flex items-center">
            <ArrowLeft className="h-4 w-4" />
            Back to explore page
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto py-8 max-md:pt-2">
        <div className="mb-4 px-3 lg:px-12">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {accommodation.accommodationName}
            {accommodation.isVerified && <BadgeCheck className="h-3.5 w-3.5" />}
          </h1>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{accommodation.address}</span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden mb-4">
          <Carousel opts={{ align: "center" }}>
            <CarouselContent className="ml-0 gap-4 px-3 lg:px-12">
              {accommodation.media && accommodation.media.length > 0
                ? accommodation.media.map((mediaItem, i) => (
                    <CarouselItem
                      key={i}
                      className="pl-0 basis-full shrink-0 md:basis-[calc(70%-0.5rem)] lg:basis-[calc(60%-0.667rem)] xl:basis-[calc(55%-0.667rem)]"
                    >
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                        <img
                          src={mediaItem.url}
                          alt={
                            mediaItem.title || accommodation.accommodationName
                          }
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))
                : accommodation.rooms &&
                    accommodation.rooms.length > 0 &&
                    accommodation.rooms.some(
                      (r) => r.media && r.media.length > 0,
                    )
                  ? // Fallback to room media if no accommodation level media exists
                    accommodation.rooms
                      .flatMap((r) => r.media || [])
                      .slice(0, 5)
                      .map((mediaItem, i) => (
                        <CarouselItem
                          key={i}
                          className="pl-0 basis-full shrink-0 md:basis-[calc(70%-0.5rem)] lg:basis-[calc(60%-0.667rem)] xl:basis-[calc(55%-0.667rem)]"
                        >
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                            <img
                              src={mediaItem.url}
                              alt={
                                mediaItem.title ||
                                accommodation.accommodationName
                              }
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))
                  : [1, 2, 3].map((i) => (
                      <CarouselItem
                        key={i}
                        className="pl-0 basis-full shrink-0 md:basis-[calc(70%-0.5rem)] lg:basis-[calc(60%-0.667rem)] xl:basis-[calc(55%-0.667rem)]"
                      >
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-linear-to-br from-primary/20 to-primary/5">
                          {/* Placeholder gradient */}
                        </div>
                      </CarouselItem>
                    ))}
              {/* Spacer for end padding */}
              <div className="basis-3 lg:basis-12 shrink-0" />
            </CarouselContent>
            <CarouselPrevious className="left-2 sm:left-4 h-8 w-8 sm:h-10 sm:w-10" />
            <CarouselNext className="right-2 sm:right-4 h-8 w-8 sm:h-10 sm:w-10" />
          </Carousel>
        </div>

        {accommodation.nearbyInstitutions &&
          accommodation.nearbyInstitutions.length > 0 && (
            <div className="mb-8 max-w-4xl px-3 lg:px-12">
              <div className="flex flex-wrap gap-2 mt-3">
                {accommodation.nearbyInstitutions.map((institution, i) => (
                  <Badge key={i} variant="secondary">
                    {institution}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {accommodation.description && (
          <div className="mb-12 max-w-4xl px-3 lg:px-12">
            <span className="text-base font-semibold mb-4">
              About this accommodation
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {accommodation.description}
            </p>
          </div>
        )}

        <div className="mb-8 space-y-6 px-3 lg:px-12">
          <div className="flex items-center justify-between min-h-[40px]">
            <h2 className="text-base font-semibold">Available Rooms</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRoomType("all")}
              className={cn(
                "gap-2 transition-opacity duration-200",
                roomType === "all"
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100",
              )}
            >
              <X className="h-4 w-4" />
              Clear filter
            </Button>
          </div>

          <ToggleGroup
            type="single"
            value={roomType}
            onValueChange={(value) => {
              if (value) setRoomType(value);
            }}
            variant="outline"
            size="sm"
            className="justify-start gap-3"
          >
            <ToggleGroupItem
              value="all"
              className="rounded-full px-5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              All Rooms
            </ToggleGroupItem>
            <ToggleGroupItem
              value="private"
              className="rounded-full px-5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              Private
            </ToggleGroupItem>
            <ToggleGroupItem
              value="general"
              className="rounded-full px-5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              General
            </ToggleGroupItem>
          </ToggleGroup>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No rooms found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try a different filter
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">
                {filteredRooms.length} room
                {filteredRooms.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredRooms.map((room: Room) => (
                  <RoomCard
                    key={room.id}
                    room={{
                      ...room,
                      accommodationId: accommodation.id,
                      accommodationName: accommodation.accommodationName,
                      accommodationAddress: accommodation.address,
                      accommodationPhone: accommodation.phone,
                      isVerified: accommodation.isVerified,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
