"use client";
import { LoadingBar } from "@/components/loading-bar";
import { OfflineStatus } from "@/components/offline-status";
import { ProfileDialog } from "@/components/profile-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import clsx from "clsx";
import { LogOut, Menu, Settings, User, UserCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { loadEntries } = useAppContext();
  const {
    user,
    loading,
    accommodationData,
    signout,
    confirmSignOut,
    setConfirmSignOut,
  } = useAuth();

  useEffect(() => {
    if (!loading && user && !accommodationData) {
      router.replace("/auth/onboarding");
    }
  }, [loading, user, accommodationData]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  return (
    <>
      <Suspense>
        <LoadingBar />
      </Suspense>

      <Header />

      {children}

      <Dialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              {/* <AlertTriangle className="h-5 min-w-5" /> */}
              <DialogTitle>Confirm Signout</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-start">
              You are about to sign out of your account. Any unsaved changes
              will be lost.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="destructive" onClick={signout}>
              <LogOut className="mr-2 h-4 w-4" />
              Yh I know :)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Dashboard Header
function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { accommodationData, setConfirmSignOut } = useAuth();

  // console.log(accommodationData);

  const [isOnline, setIsOnline] = useState(true);

  const { bookings, appConfig } = useAppContext();
  const freeBookings = appConfig?.freeBookings ?? 20;
  const acceptedBookingsCount = useMemo(
    () => bookings.filter((b) => b.status !== "pending").length,
    [bookings],
  );

  let goToTarget;

  if (acceptedBookingsCount <= freeBookings) {
    goToTarget = (
      <div className="inline-flex items-center group h-8 transition-all hover:opacity-80">
        <CircularProgress
          value={acceptedBookingsCount}
          max={freeBookings}
          size={32}
          strokeWidth={3}
          showText={true}
          label={`${acceptedBookingsCount} of ${freeBookings} trial bookings used`}
        />
      </div>
    );
  } else {
    goToTarget = null;
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const links = [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Guests",
      href: "/guests",
    },
    {
      title: "Rooms",
      href: "/rooms",
    },
    {
      title: "Bookings",
      href: "/bookings",
    },
  ];

  return (
    <>
      <OfflineStatus isOnline={isOnline} setIsOnline={setIsOnline} />

      <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center gap-4 border-b bg-background px-3 md:px-6 lg:px-10">
        <Link
          className="flex items-center gap-2 font-semibold group relative"
          href="/dashboard"
        >
          <Logo />
        </Link>

        <nav className="hidden md:flex ml-auto gap-4 sm:gap-6 items-center">
          {goToTarget}

          <Link
            className={clsx(
              "text-sm font-medium hover:underline underline-offset-4 transition-colors",
              pathname === "/rooms" || pathname.startsWith("/rooms/")
                ? "text-primary underline"
                : "text-muted-foreground",
            )}
            href="/rooms"
          >
            Rooms
          </Link>
          <Link
            className={clsx(
              "text-sm font-medium hover:underline underline-offset-4 transition-colors",
              pathname === "/guests" || pathname.startsWith("/guests/")
                ? "text-primary underline"
                : "text-muted-foreground",
            )}
            href="/guests"
          >
            Guests
          </Link>

          <Link
            className={clsx(
              "text-sm font-medium hover:underline underline-offset-4 transition-colors",
              pathname === "/bookings" || pathname.startsWith("/bookings/")
                ? "text-primary underline"
                : "text-muted-foreground",
            )}
            href="/bookings"
          >
            Bookings
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="p-0.5 hover:bg-accent rounded-full transition-colors outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={accommodationData?.managerImage}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {accommodationData?.manager
                    ? accommodationData.manager[0].toUpperCase()
                    : accommodationData?.accommodationName
                      ? accommodationData.accommodationName[0].toUpperCase()
                      : "H"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="mr-3 mt-2 w-52">
              <DropdownMenuItem
                onClick={() => setProfileOpen(true)}
                className="gap-2 py-2.5"
              >
                <UserCircle size={18} />
                Account
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="gap-2 py-2.5">
                <Link href="/settings">
                  <Settings size={18} />
                  Settings
                </Link>
              </DropdownMenuItem>

              <Separator className="my-1" />

              <DropdownMenuItem
                className="hover:bg-destructive gap-2 py-2.5"
                onClick={() => setConfirmSignOut(true)}
              >
                <LogOut size={18} />
                Signout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden ml-auto flex items-center gap-3">
          {goToTarget}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className={clsx(
            "fixed inset-x-0 bottom-0 z-50 bg-background/90 backdrop-blur-xs md:hidden",
            isOnline
              ? "top-14 h-[calc(100dvh-3.5rem)]"
              : "top-20 h-[calc(100dvh-5rem)]",
          )}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="fixed inset-x-0 h-full bg-background shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="relative flex flex-col border-b pb-2 h-full overflow-y-auto">
              <div className="flex items-center justify-between w-full gap-8 px-1 py-2">
                <ThemeToggle />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" onClick={() => setProfileOpen(true)}>
                    <User />
                  </Button>
                  <Separator orientation="vertical" className="h-4" />
                  <Link href="/settings">
                    <Button variant="ghost" onClick={() => setMenuOpen(false)}>
                      <Settings />
                    </Button>
                  </Link>
                </div>
              </div>

              <Separator className="" />

              <div className="flex flex-col gap-2 p-2 pt-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    className={clsx(
                      "text-base font-medium p-3 rounded-md transition-colors",
                      pathname === link.href ||
                        pathname.startsWith(link.href + "/")
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent",
                    )}
                    href={link.href}
                    onClick={closeMenu}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>

              <Button
                variant={"destructive"}
                className="mt-auto text-primary dark:text-foreground mx-2"
                onClick={() => setConfirmSignOut(true)}
              >
                Sign out
                <LogOut />
              </Button>
            </nav>
          </div>
        </div>
      )}

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
