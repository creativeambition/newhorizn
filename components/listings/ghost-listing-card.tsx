import { Badge } from "@/components/ui/badge";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function GhostListingCard({ index }: { index: number }) {
  // Alternate between "Verifying" and "Under Review"
  const status = index % 2 === 0 ? "Verifying" : "Under Review";
  
  return (
    <div className="group block opacity-60 grayscale-[0.4] cursor-default select-none animate-in fade-in duration-700">
      <div className="space-y-3 p-2 pb-4 rounded-3xl h-full flex flex-col border border-dashed border-muted-foreground/20 bg-muted/5">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/50 shrink-0 flex items-center justify-center">
          <Search className="h-10 w-10 text-muted-foreground/10" />
          
          <div className="absolute top-3 right-3 z-10">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-md",
                status === "Verifying" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
              )}
            >
              {status}
            </Badge>
          </div>
          
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/5" />
        </div>

        <div className="space-y-2 px-2 flex-1 flex flex-col">
          <div className="space-y-1.5">
            <div className="h-4 bg-muted-foreground/10 rounded-md w-3/4" />
            <div className="flex items-center text-[13px] text-muted-foreground/40 mt-0.5">
              <MapPin className="h-3.5 w-3.5 mr-1 shrink-0 opacity-40" />
              <div className="h-3 bg-muted-foreground/5 rounded-md w-1/2" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            <div className="h-4 bg-muted-foreground/5 rounded-full w-14" />
            <div className="h-4 bg-muted-foreground/5 rounded-full w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
