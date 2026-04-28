"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, SlidersHorizontal, X, Search } from "lucide-react";
import { toast } from "sonner";

type FilterProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  institution: string;
  onInstitutionChange: (value: string) => void;
  listingType: string;
  onListingTypeChange: (value: string) => void;
  onClearAll?: () => void;
  resultCount?: number;
};

import { KNOWN_INSTITUTIONS } from "@/lib/types";

const institutionOptions = [
  { value: "all", label: "All Campuses" },
  ...KNOWN_INSTITUTIONS.map((inst) => ({ value: inst, label: inst })),
];

const listingTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "hostel", label: "Hostel" },
  { value: "apartment", label: "Apartment" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Other" },
];

const getFilterLabel = (type: string, value: string | boolean) => {
  if (type === "institution") {
    return (
      institutionOptions.find((o) => o.value === value)?.label || "All Campuses"
    );
  }
  if (type === "listing") {
    return listingTypeOptions.find((o) => o.value === value)?.label || "All";
  }
  return "";
};

export function ListingFilters({
  search,
  onSearchChange,
  institution,
  onInstitutionChange,
  listingType,
  onListingTypeChange,
  onClearAll,
  resultCount,
}: FilterProps) {
  const handleListingTypeChange = (value: string) => {
    onListingTypeChange(value);
    if (value !== "hostel" && institution !== "all") {
      onInstitutionChange("all");
    }
  };

  const hasActiveFilters =
    search || institution !== "all" || listingType !== "all";

  const activeFilterCount = [
    institution !== "all",
    listingType !== "all",
  ].filter(Boolean).length;

  const canFilterFurther = listingType === "hostel";

  /** Count only filters that live inside the sheet (mobile): institution */
  const sheetFilterCount = [
    listingType === "hostel" && institution !== "all",
  ].filter(Boolean).length;

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      onInstitutionChange("all");
      onListingTypeChange("all");
    }
  };

  const FilterDropdown = ({
    label,
    value,
    options,
    onChange,
    type,
  }: {
    label: string;
    value: string | boolean;
    options: Array<{ value: string | boolean; label: string }>;
    onChange: (value: string | boolean) => void;
    type: string;
  }) => {
    const currentLabel = getFilterLabel(type, String(value));
    const isActive = value !== "all" && value !== false;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full transition-colors gap-1.5",
              isActive && "bg-primary text-primary-foreground",
            )}
          >
            <span>{currentLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={String(option.value)}
                  onClick={() => {
                    if (value === option.value) {
                      onChange("all");
                    } else {
                      onChange(option.value);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 active:scale-[0.98]",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent font-medium",
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  /** Sheet-only filters: Institution + Room Type (used on mobile in the bottom sheet) */
  const SheetFilterSections = () => (
    <div className="space-y-4">
      {listingType === "hostel" && (
        <div className="flex flex-wrap gap-2">
          {institutionOptions.map((option) => (
            <Button
              key={option.value}
              variant={institution === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (institution === option.value) {
                  onInstitutionChange("all");
                } else {
                  onInstitutionChange(option.value);
                  if (option.value !== "all") {
                    toast.info(`Filter applied: ${option.label}`, {
                      position: "top-center",
                    });
                  }
                }
              }}
              className="rounded-full px-4"
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-3 justify-end w-full">
        {/* Mobile Search Bar */}
        <div className="relative flex-1 w-full sm:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location, or institution.."
            value={search || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-2 transition-shadow"
          />
        </div>

        <div className="flex items-center gap-2 md:hidden shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant={sheetFilterCount > 0 ? "default" : "ghost"}
                size="default"
                className={cn(
                  "relative h-10 w-10 p-0 rounded-xl transition-all duration-300",
                  canFilterFurther &&
                    sheetFilterCount === 0 &&
                    "bg-primary/10 text-primary hover:bg-primary/15 ring-1 ring-primary/20",
                )}
              >
                <SlidersHorizontal
                  className={cn(
                    "h-5 w-5 transition-all",
                    !canFilterFurther &&
                      sheetFilterCount === 0 &&
                      "opacity-40 grayscale",
                  )}
                />
                {sheetFilterCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground shadow-sm ring-2 ring-background">
                    {sheetFilterCount}
                  </span>
                ) : (
                  canFilterFurther && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-auto max-h-[85vh] overflow-y-auto rounded-t-2xl"
            >
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  {listingType === "hostel" ? "Campus options" : "Filters"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 pb-8">
                <SheetFilterSections />
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile: Listing type visible by default (same dropdown style as desktop) */}
          <div className="flex flex-wrap items-center gap-2 md:hidden">
            <FilterDropdown
              label="Listing Type"
              value={listingType}
              options={listingTypeOptions}
              onChange={(value) => handleListingTypeChange(String(value))}
              type="listing"
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="rounded-full text-muted-foreground hover:text-foreground h-9 px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </div>
          <div className="h-6 w-px bg-border" />

          {/* Listing Type Filter */}
          <FilterDropdown
            label="Listing Type"
            value={listingType}
            options={listingTypeOptions}
            onChange={(value) => handleListingTypeChange(String(value))}
            type="listing"
          />

          {/* Institution Filter */}
          {listingType === "hostel" && (
            <>
              <div className="h-6 w-px bg-border" />
              <FilterDropdown
                label="Campus"
                value={institution}
                options={institutionOptions}
                onChange={(value) => onInstitutionChange(String(value))}
                type="institution"
              />
            </>
          )}

          <div className="h-6 w-px bg-border" />

          {hasActiveFilters && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
