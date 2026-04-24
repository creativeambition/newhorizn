"use client";

import { AccommodationCard } from "@/components/listings/accommodation-card";
import { GhostListingCard } from "@/components/listings/ghost-listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Accommodation } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";

export default function Accommodations() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AccommodationsContent />
    </Suspense>
  );
}

const AccommodationsContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: accommodationsData, isLoading: loading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: async () => {
      const res = await fetch("/api/accommodations");
      if (!res.ok) throw new Error("Failed to fetch accommodations");
      return res.json();
    },
  });

  const accommodations = Array.isArray(accommodationsData) ? accommodationsData : [];

  // Read state from URL
  const search = searchParams.get("search") || "";
  const institution = searchParams.get("institution") || "all";
  const listingType = searchParams.get("listingType") || "all";

  // Helper to update URL params
  const updateParam = useCallback(
    (key: string, value: string | boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filteredAccommodations = useMemo(() => {
    let filtered = [...accommodations];

    if (listingType !== "all") {
      filtered = filtered.filter(
        (h: Accommodation) =>
          (h.listingType || "other").toLowerCase() ===
          listingType.toLowerCase(),
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (h: Accommodation) =>
          h.accommodationName.toLowerCase().includes(searchLower) ||
          h.address.toLowerCase().includes(searchLower) ||
          h.nearbyInstitutions?.some((inst) =>
            inst.toLowerCase().includes(searchLower),
          ),
      );
    }

    if (listingType === "hostel" && institution !== "all") {
      filtered = filtered.filter((h: Accommodation) =>
        h.nearbyInstitutions?.includes(institution),
      );
    }

    return filtered;
  }, [search, institution, listingType, accommodations]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto px-4 lg:px-12 py-8">
        <div className="mb-8">
          <ListingFilters
            search={search}
            onSearchChange={(v) => updateParam("search", v)}
            institution={institution}
            onInstitutionChange={(v) => updateParam("institution", v)}
            listingType={listingType}
            onListingTypeChange={(v) => updateParam("listingType", v)}
            resultCount={filteredAccommodations.length}
          />
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-muted rounded-xl animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAccommodations.map((accommodation: Accommodation) => (
              <AccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
              />
            ))}
            {/* Show ghost cards if count is low or zero */}
            {filteredAccommodations.length < 12 &&
              Array.from({ length: filteredAccommodations.length === 0 ? 16 : 12 }).map((_, i) => (
                <GhostListingCard key={`ghost-${i}`} index={i} />
              ))}
          </div>
        )}
      </main>
    </div>
  );
};
