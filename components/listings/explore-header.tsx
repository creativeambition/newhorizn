"use client";

import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useExplorePage } from "@/lib/context/explore-page-context";
import { FavoritesDrawer } from "./favorites-drawer";
import { BookingsDrawer } from "./bookings-drawer";
import { guestBookingService } from "@/lib/services/guest-booking-service";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "../theme-toggle";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExploreHeaderProps {
  showBack?: boolean;
  backHref?: string;
  showLogo?: boolean;
  title?: string;
  rightContent?: React.ReactNode;
  containerClassName?: string;
}

export const ExploreHeader = ({
  showBack: initialShowBack,
  backHref,
  showLogo = true,
  title: initialTitle,
  rightContent: manualRightContent,
  containerClassName = "mx-auto px-4 lg:px-12 py-4",
}: ExploreHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { activeListing, customRightContent } = useExplorePage();
  const [hasBookings, setHasBookings] = useState(false);
  const searchParams = useSearchParams();

  // Determine back button visibility based on route depth if not explicitly provided
  const isRootExplore = pathname === "/accommodations";
  const showBack = initialShowBack ?? !isRootExplore;

  // Determine breadcrumb items based on path
  const pathSegments = pathname.split("/").filter(Boolean);
  const isAccommodationPage =
    pathSegments.length === 2 && pathSegments[0] === "accommodations";
  const isRoomPage =
    pathSegments.length === 3 && pathSegments[0] === "accommodations";

  const breadcrumbs = [];

  // 1. Root link: "Explore"
  breadcrumbs.push({
    label: "Explore",
    href: "/accommodations",
    isCurrent: isRootExplore,
  });

  // 2. Accommodation link
  if (isAccommodationPage && activeListing) {
    breadcrumbs.push({
      label: activeListing.name,
      isCurrent: true,
    });
  } else if (isRoomPage && activeListing) {
    breadcrumbs.push({
      label: activeListing.accommodationName || "Accommodation",
      href: `/accommodations/${pathSegments[1]}`,
      isCurrent: false,
    });
    // 3. Room page
    breadcrumbs.push({
      label: activeListing.name,
      isCurrent: true,
    });
  }

  // Fallback for direct manual titles if no active listing
  const title =
    initialTitle || (!activeListing && !isRootExplore ? "Loading..." : null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setHasBookings(guestBookingService.getBookings().length > 0);
    const handleUpdate = () => {
      setHasBookings(guestBookingService.getBookings().length > 0);
    };
    window.addEventListener("guest-bookings-updated", handleUpdate);
    return () =>
      window.removeEventListener("guest-bookings-updated", handleUpdate);
  }, []);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      // Determine absolute back link based on current path
      const pathSegments = pathname.split("/").filter(Boolean);

      if (
        pathSegments.length >= 3 &&
        pathSegments[0] === "accommodations" &&
        pathSegments[2]
      ) {
        // On room page: /accommodations/[accommodationId]/[roomId] -> /accommodations/[accommodationId]
        router.push(`/accommodations/${pathSegments[1]}`);
      } else if (
        pathSegments.length >= 2 &&
        pathSegments[0] === "accommodations"
      ) {
        // On accommodation page: /accommodations/[accommodationId] -> /accommodations
        router.push("/accommodations");
      } else {
        // Default fallback
        router.push("/accommodations");
      }
    }
  };

  const handleSearchChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className={containerClassName}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full shrink-0"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-4">
              {showLogo && (
                <Link
                  href="/accommodations"
                  className={cn(isRootExplore ? "block" : "hidden sm:block")}
                >
                  <Logo />
                </Link>
              )}
              {breadcrumbs.length > 0 ? (
                <Breadcrumb className={cn(!isRootExplore && "block")}>
                  <BreadcrumbList className="flex-nowrap">
                    {isMobile && breadcrumbs.length > 1 ? (
                      <>
                        <BreadcrumbItem className="shrink-0">
                          <BreadcrumbEllipsis />
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="shrink-0" />
                        <BreadcrumbItem className="min-w-0 flex-1">
                          <BreadcrumbPage className="truncate font-bold text-foreground">
                            {breadcrumbs[breadcrumbs.length - 1].label}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : (
                      breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                          <BreadcrumbItem
                            className={cn(
                              "shrink-0",
                              isRootExplore && idx === 0 && "hidden sm:flex",
                            )}
                          >
                            {crumb.isCurrent ? (
                              <BreadcrumbPage className="max-w-[150px] truncate">
                                {crumb.label}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink
                                asChild
                                className="max-w-[150px] truncate"
                              >
                                <Link href={crumb.href!}>{crumb.label}</Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {idx < breadcrumbs.length - 1 && (
                            <BreadcrumbSeparator
                              className={cn(
                                "shrink-0",
                                isRootExplore && idx === 0 && "hidden sm:flex",
                              )}
                            />
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              ) : title ? (
                <h1 className="text-xl font-semibold hidden sm:block truncate max-w-[200px] lg:max-w-md">
                  {title}
                </h1>
              ) : null}
            </div>
          </div>

          {isRootExplore && (
            <div className="hidden sm:flex flex-1 justify-center px-4 max-w-lg mx-auto w-full">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, or institution.."
                  value={searchParams.get("search") || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-11 h-10 w-full rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:border-border transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {(isRootExplore || activeListing || hasBookings) && (
                <>
                  <BookingsDrawer />
                  <FavoritesDrawer />
                </>
              )}
            </div>

            {/* Injected Content */}
            {customRightContent}
            {manualRightContent}

            {/* Always present on desktop; on mobile only on root explore page */}
            <div className={cn(isRootExplore ? "block" : "hidden sm:block")}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
