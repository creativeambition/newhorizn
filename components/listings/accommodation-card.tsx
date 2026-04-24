import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin } from "lucide-react";
import { Accommodation, KNOWN_INSTITUTIONS } from "@/lib/types";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function AccommodationCard({
  accommodation,
}: {
  accommodation: Accommodation;
}) {
  return (
    <Link href={`/accommodations/${accommodation.id}`} className="group block active:scale-[0.98] transition-all duration-200">
      <div className="space-y-3 group-hover:bg-accent transition-all duration-200 p-2 pb-4 rounded-3xl h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted group/media shrink-0">
          {/* Use accommodation media */}
          {accommodation.media?.[0]?.url ? (
            <img
              src={accommodation.media[0].url}
              alt={accommodation.accommodationName}
              className="absolute inset-0 w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5 group-hover:scale-105 transition-transform duration-300" />
          )}

          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {accommodation.isVerified && (
              <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-2 px-2 flex-1 flex flex-col">
          <div>
            <h3 className="font-semibold text-base line-clamp-1 group-hover:underline">
              {accommodation.accommodationName}
            </h3>
            <div className="flex items-center text-[13px] text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
              <span className="truncate">{accommodation.address}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {accommodation.nearbyInstitutions?.slice(0, 2).map((inst) => {
              const isKnown = KNOWN_INSTITUTIONS.includes(inst);
              const showVerifiedCheck = isKnown && accommodation.isLocationVerified;

              return (
                <Badge
                  key={inst}
                  variant={showVerifiedCheck ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                    !showVerifiedCheck && "opacity-80",
                  )}
                >
                  {showVerifiedCheck && <BadgeCheck className="h-3 w-3" />}
                  {inst}
                </Badge>
              );
            })}
            {accommodation.nearbyInstitutions && accommodation.nearbyInstitutions.length > 2 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer hover:bg-secondary/80"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    +{accommodation.nearbyInstitutions.length - 2}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent
                  className="w-fit p-2 flex flex-col gap-1.5"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {accommodation.nearbyInstitutions.slice(2).map((inst) => (
                    <Badge
                      key={inst}
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium w-fit"
                    >
                      {inst}
                    </Badge>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
