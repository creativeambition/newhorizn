"use client";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Menu, Settings, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Logo } from "./ui/logo";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, accommodationData, loading } = useAuth();

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", menuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  const closeMenu = () => {
    setTimeout(() => {
      setMenuOpen(false);
    }, 100);
  };

  const links = [
    {
      title: "Features",
      href: "#features",
    },
    {
      title: "Get Started",
      href: "#get-started",
    },
    {
      title: "Contact",
      href: "#contact",
    },
  ];

  // Determine what to render for the auth action button
  const authAction = (() => {
    if (loading) return null; // Wait for initial profile fetch or auth check

    if (!user) {
      return (
        <div className="hidden md:flex items-center">
          <Link href={"/auth/login"} className="group">
            <Button size={"sm"} variant={"link"}>
              <User className="h-4 w-4 mr-2" />
              Sign In
              <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-translate-y-1 duration-200" />
            </Button>
          </Link>
        </div>
      );
    }

    if (accommodationData) {
      return (
        <Link href="/dashboard">
          <Button variant={"ghost"} size="sm" className="gap-2">
            Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    }
    // User exists but onboarding not complete
    return (
      <Link href="/auth/onboarding">
        <Button variant={"ghost"}>
          Complete Profile
          <User className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    );
  })();

  // Mobile variant of auth action
  const mobileAuthAction = (() => {
    if (loading) return null;

    if (!user) {
      return (
        <Link href={"/auth/login"} className="group">
          <Button size={"sm"} variant={"link"} className="gap-1 p-0">
            <User className="h-4 w-4" />
            Sign In
            <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-translate-y-1 duration-200" />
          </Button>
        </Link>
      );
    }

    if (accommodationData) {
      return (
        <Link href="/dashboard">
          <Button size={"sm"} variant={"link"} className="gap-1 p-0">
            Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/auth/onboarding">
        <Button size={"sm"} variant={"link"}>
          Complete Setup
          <Settings className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    );
  })();

  return (
    <>
      <header className="sticky top-0 w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14 md:h-16 bg-background/70 backdrop-blur-xl border-b border-black/10 dark:border-white/10 z-50">
        <div className="flex flex-1 items-center">
          <Link href={"/#hero"} onClick={closeMenu}>
            <Logo />
          </Link>
        </div>

        <nav className="hidden md:flex flex-2 justify-center space-x-8 text-primary/50">
          {links.map((ln) => (
            <a
              key={ln.href}
              href={ln.href}
              className="text-primary/60 hover:text-primary"
            >
              {ln.title}
            </a>
          ))}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-2">
          {authAction}
        </div>

        <div className="hidden md:flex">
          <ThemeToggle />
        </div>

        {/* Menu icon */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 top-14 z-50 h-screen bg-background/90 backdrop-blur-xs md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="fixed inset-x-0 bg-background shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="flex flex-col p-2 border-b gap-3 h-full">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="text-base font-medium p-2 px-3 hover:bg-accent rounded-md"
                  href={link.href}
                  onClick={closeMenu}
                >
                  {link.title}
                </Link>
              ))}
              <div className="flex px-3 items-center justify-between">
                {mobileAuthAction}
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
export default Header;
