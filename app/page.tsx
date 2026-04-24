import { ContactForm } from "@/components/contact-form";
import { HeroCaption } from "@/components/hero-caption";
import Header from "@/components/landing-page-header";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  BarChart3,
  BedIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartLineIcon,
  Check,
  CreditCardIcon,
  Mail,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SparklesIcon,
  TrendingUp,
  UserCheckIcon,
  UserIcon,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <BedIcon className="h-6 w-6" />,
    title: "Room Management",
    description:
      "Manage all rooms, beds, and capacity across your entire property from a single dashboard.",
    stat: "50+",
    statLabel: "Rooms tracked",
  },
  {
    icon: <CalendarIcon className="h-6 w-6" />,
    title: "Booking Engine",
    description:
      "Real-time availability, instant booking confirmations, and automated check-in/check-out workflows.",
    stat: "24/7",
    statLabel: "Availability",
  },
  {
    icon: <CreditCardIcon className="h-6 w-6" />,
    title: "Payment Processing",
    description:
      "Secure payment handling with deposit tracking, invoicing, and automated receipts.",
    stat: "100%",
    statLabel: "Secure",
  },
  {
    icon: <UserIcon className="h-6 w-6" />,
    title: "Guest Profiles",
    description:
      "Build comprehensive guest records with preferences, history, and contact details.",
    stat: "10k+",
    statLabel: "Guests managed",
  },
];

const steps = [
  {
    number: "01",
    title: "Register",
    description: "Sign up and add your accommodation details.",
    icon: <UserCheckIcon className="h-7 w-7" />,
  },
  {
    number: "02",
    title: "Configure",
    description: "Set up your rooms & pricing on your dashboard.",
    icon: <Settings className="h-7 w-7" />,
  },
  {
    number: "03",
    title: "Manage",
    description:
      "Start taking bookings, managing guests, and tracking your performance.",
    icon: <BarChart3 className="h-7 w-7" />,
  },
];

import { Metadata } from "next";
import { HelpFab } from "@/components/support/help-fab";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "newhorizn Property Management",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Property management system (PMS) for hotels, hostels, and apartments.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GHS",
    },
  };

  return (
    <div id="hero" className="min-h-screen bg-gray-50 dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <HelpFab href="/support" />

      {/* Hero Section */}
      <section className="relative w-full flex flex-col items-center text-center gap-6 md:gap-8 py-12 md:py-12 2xl:py-24 px-4 md:px-6 overflow-hidden">
        <HeroCaption />

        <div className="relative max-w-5xl animate-fade-in-up w-full">
          <div className="glass rounded-3xl overflow-hidden border-2 border-border dark:border-white/40">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
              {[
                {
                  icon: <ChartBarIcon className="h-5 w-5" />,
                  title: "Bookings",
                  text: "Manage bookings, check-ins, and payments in one place.",
                },
                {
                  icon: <SparklesIcon className="h-5 w-5" />,
                  title: "Dashboard",
                  text: "Rooms, guests, and occupancy at a glance.",
                },
                {
                  icon: <ChartLineIcon className="h-5 w-5" />,
                  title: "Insights",
                  text: "Simple reporting to help you grow.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-6 md:p-8 text-start hover:bg-primary/5 transition-colors group"
                >
                  <div className="absolute -z-10 inset-0 grid grid-cols-2 -space-x-52 opacity-30 items-center">
                    <div className="blur-[80px] h-32 bg-foreground/10 dark:bg-foreground/20 rounded-full"></div>
                    <div className="blur-[100px] h-32 bg-primary/10 dark:bg-primary/20 rounded-full"></div>
                  </div>

                  <div className="shrink-0 p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="relative flex flex-col sm:flex-row gap-4 animate-fade-in-up md:mt-12">
          <Link href="/auth/login">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 gap-2 h-12 px-8 rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <UserCheckIcon className="h-5 w-5" />
              Become a host
            </Button>
          </Link>
          <Link href="/accommodations">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 h-12 px-8 rounded-xl glass hover:bg-primary/5 transition-all duration-300"
            >
              <Search className="h-5 w-5" />
              Explore listings
            </Button>
          </Link>
        </div>

        {/* Value Indicators */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-border animate-fade-in">
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="text-sm font-black tracking-tight">Cloud Native</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Always available
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Check className="size-5 text-primary" />
            </div>
            <p className="text-sm font-black tracking-tight">Secure Access</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Encrypted data
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <p className="text-sm font-black tracking-tight">Zero Setup</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Start in minutes
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Phone className="size-5 text-primary" />
            </div>
            <p className="text-sm font-black tracking-tight">24/7 Support</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Always here
            </p>
          </div>
        </div>
      </section>

      {/* ─── Features Section: Bento-style ─── */}
      <section
        id="features"
        className="relative py-24 md:py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 md:mb-20">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Core Capabilities
              </p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
                Everything you need
                <br />
                <span className="text-muted-foreground/50">
                  to run your property
                </span>
              </h2>
            </div>
            <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed lg:text-right">
              Designed for owners and managers of hotels, hostels, premium
              apartments, and guest houses who value simplicity and efficiency
              above all else.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5">
            {/* Feature 1: Room Management — large card */}
            <div className="lg:col-span-7 group relative">
              <div className="relative h-full p-8 md:p-10 rounded-2xl border border-border/60 bg-background hover:border-foreground/15 transition-all duration-500 overflow-hidden active:scale-[0.99]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/2 rounded-full -translate-y-1/3 translate-x-1/3 group-hover:bg-foreground/4 transition-colors duration-500" />

                <div className="relative flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="size-12 flex items-center justify-center rounded-xl bg-foreground text-background">
                      <BedIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl tracking-tight">
                        Room Management
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Complete property control
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed text-[15px] mb-8 max-w-lg">
                    Manage all rooms, beds, and capacity across your entire
                    property. Track occupancy in real-time and optimize your
                    space utilization.
                  </p>

                  {/* Mini dashboard mockup */}
                  <div className="mt-auto grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Rooms", value: "48", trend: "+4" },
                      { label: "Occupied", value: "39", trend: "81%" },
                      { label: "Available", value: "9", trend: "Online" },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="p-3 md:p-4 rounded-xl bg-muted/50 border border-border/40"
                      >
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                          {stat.label}
                        </p>
                        <p className="text-xl md:text-2xl font-black tracking-tight tabular-nums">
                          {stat.value}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground mt-1">
                          {stat.trend}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Booking Engine — tall card */}
            <div className="lg:col-span-5 group relative">
              <div className="relative h-full p-8 md:p-10 rounded-2xl border border-border/60 bg-background hover:border-foreground/15 transition-all duration-500 overflow-hidden active:scale-[0.99]">
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/2 rounded-full translate-y-1/3 -translate-x-1/3 group-hover:bg-foreground/4 transition-colors duration-500" />

                <div className="relative flex flex-col h-full">
                  <div className="size-12 flex items-center justify-center rounded-xl bg-foreground text-background mb-6">
                    <CalendarIcon className="h-5 w-5" />
                  </div>

                  <h3 className="font-black text-xl tracking-tight mb-2">
                    Booking Engine
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
                    Real-time availability, instant confirmations, and automated
                    check-in/check-out workflows — all in one place.
                  </p>

                  {/* Booking timeline mockup */}
                  <div className="mt-auto space-y-3">
                    {[
                      {
                        guest: "K. Mensah",
                        action: "Checked in",
                        time: "2m ago",
                      },
                      {
                        guest: "A. Owusu",
                        action: "Booked Room 12",
                        time: "15m ago",
                      },
                      {
                        guest: "J. Asante",
                        action: "Payment received",
                        time: "1h ago",
                      },
                    ].map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40"
                      >
                        <div className="size-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-black">
                            {entry.guest.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {entry.guest}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.action}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium tabular-nums shrink-0">
                          {entry.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Payment Processing — wide bottom-left */}
            <div className="lg:col-span-5 group relative">
              <div className="relative h-full p-8 md:p-10 rounded-2xl border border-border/60 bg-background hover:border-foreground/15 transition-all duration-500 overflow-hidden active:scale-[0.99]">
                <div className="relative flex flex-col h-full">
                  <div className="size-12 flex items-center justify-center rounded-xl bg-foreground text-background mb-6">
                    <CreditCardIcon className="h-5 w-5" />
                  </div>

                  <h3 className="font-black text-xl tracking-tight mb-2">
                    Payment Processing
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
                    Secure payment handling with deposit tracking, invoicing,
                    and automated receipt generation.
                  </p>

                  <div className="mt-auto flex items-end justify-between p-4 rounded-xl bg-muted/50 border border-border/40">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                        This month
                      </p>
                      <p className="text-2xl md:text-3xl font-black tracking-tight tabular-nums">
                        GHS 12,450
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="size-4" />
                      <span className="text-sm font-bold tabular-nums">
                        +18%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Guest Profiles — wide bottom-right */}
            <div className="lg:col-span-7 group relative">
              <div className="relative h-full p-8 md:p-10 rounded-2xl border border-border/60 bg-foreground text-background overflow-hidden hover:bg-foreground/95 active:scale-[0.99] transition-all duration-500">
                <div className="absolute top-0 right-0 w-72 h-72 bg-background/3 rounded-full -translate-y-1/2 translate-x-1/4" />

                <div className="relative flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="size-12 flex items-center justify-center rounded-xl bg-background text-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl tracking-tight">
                        Guest Profiles
                      </h3>
                      <p className="text-background/60 text-sm">
                        Know your guests
                      </p>
                    </div>
                  </div>

                  <p className="text-background/70 leading-relaxed text-[15px] mb-8 max-w-lg">
                    Build comprehensive guest records with preferences, booking
                    history, and payment details. Personalize every stay.
                  </p>

                  <div className="mt-auto flex items-center gap-3 flex-wrap">
                    {[
                      "10,000+ Guests",
                      "Full History",
                      "Quick Search",
                      "Exports",
                    ].map((tag, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 rounded-full text-[13px] font-bold bg-background/10 border border-background/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works Section ─── */}
      <section
        id="get-started"
        className="relative py-24 md:py-32 overflow-hidden"
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl mb-16 md:mb-20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Getting Started
            </p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95] mb-6">
              Up and running
              <br />
              <span className="text-muted-foreground/50">in minutes</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              We&apos;ve simplified the setup so you can focus on what matters
              most — your guests.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 md:gap-0 relative">
            {/* Horizontal connector line — desktop */}
            <div className="hidden md:block absolute top-15 left-[16.67%] right-[16.67%] h-px">
              <div className="w-full h-full bg-border" />
              <div className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-background to-transparent" />
              <div className="absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-background to-transparent" />
            </div>

            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="flex md:flex-col items-start md:items-center gap-6 md:gap-0 p-6 md:p-8">
                  {/* Number circle */}
                  <div className="relative z-10 shrink-0">
                    <div className="size-15 rounded-2xl bg-background border-2 border-border flex items-center justify-center font-black text-lg tabular-nums group-hover:border-foreground/30 group-hover:shadow-lg active:scale-90 transition-all duration-500">
                      {step.number}
                    </div>

                    {/* Vertical connector — mobile only */}
                    {index < steps.length - 1 && (
                      <div className="md:hidden mx-auto left-7.5 h-16 mt-4 w-px bg-border" />
                    )}
                  </div>

                  <div className="md:mt-8 md:text-center space-y-3">
                    <h3 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-foreground/80 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-[15px] md:px-4">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA under steps */}
          <div className="text-center mt-12 md:mt-16">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="h-13 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold gap-2 shadow-xl transition-all duration-300"
              >
                Get started now
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Contact Section ─── */}
      <section id="contact" className="relative py-24 md:py-32">
        <ContactForm />
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0">
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-background/10 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-background/10 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-background/40 mb-8">
            Ready to transform your operations?
          </p>

          <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8">
            Start managing
            <br />
            <span className="text-background/30">smarter today</span>
          </h2>

          <p className="text-background/50 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Join accommodation providers who have simplified their operations
            with newhorizn. Setup takes less than 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-14 px-10 rounded-xl bg-background text-foreground hover:bg-background/90 font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] duration-300"
              asChild
            >
              <Link href="/auth/register" className="gap-2">
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Platform Info / SEO ─── */}
      <section className="bg-muted/10 py-16 md:py-24 border-t border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-foreground">
                Built for the <br />
                <span className="text-muted-foreground/50">modern host</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
                Discover how our apartment rental software and hostel property
                management solutions empower owners to reduce overhead, maximize
                revenue, and deliver a superior guest experience without the
                steep learning curve of legacy systems.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 relative">
              <div className="absolute -z-1 inset-0 blur-3xl opacity-10 bg-primary/20 rounded-full" />
              {[
                {
                  icon: <Zap className="size-5" />,
                  title: "Real-time sync",
                  text: "Automate booking engine operations and track occupancy instantly across devices.",
                },
                {
                  icon: <ShieldCheck className="size-5" />,
                  title: "Secure Payments",
                  text: "Handle secure payment processing and invoices with built-in financial tools.",
                },
                {
                  icon: <Settings className="size-5" />,
                  title: "Easy Setup",
                  text: "Streamline your guest reservation system with a dashboard that requires no training.",
                },
                {
                  icon: <Sparkles className="size-5" />,
                  title: "Cloud Native",
                  text: "Access your property management software from anywhere, at any time, on any device.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:border-primary/20 transition-all duration-300"
                >
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-background py-24 md:py-32 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.03),transparent_40%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-24">
            {/* Brand Info */}
            <div className="md:col-span-5 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-foreground text-background shadow-lg">
                  <Logo className="size-6" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-foreground">
                  newhorizn
                </span>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                The all-in-one property management system for the modern host.
                Simple, secure, and built to scale with your property's needs.
              </p>

              <div className="flex items-center gap-4 pt-2">
                {/* Social placeholders or empty for now as per minimal aesthetic */}
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-3 lg:col-offset-1 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                Platform
              </h3>
              <ul className="space-y-4">
                {["Features", "How it works", "Accommodations"].map((link) => (
                  <li key={link}>
                    <Link
                      href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
                      className="text-muted-foreground hover:text-primary font-bold text-sm transition-all duration-300 flex items-center gap-2 group"
                    >
                      <div className="size-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-4 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                Support
              </h3>
              <div className="space-y-4">
                <a
                  href="mailto:chrysayita@gmail.com"
                  className="group flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-300"
                >
                  <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">
                      Email
                    </p>
                    <p className="font-bold text-sm">chrysayita@gmail.com</p>
                  </div>
                </a>
                <a
                  href="tel:+233504288305"
                  className="group flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-300"
                >
                  <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">
                      Phone
                    </p>
                    <p className="font-bold text-sm">+233 50 428 8305</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-border gap-8">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <p className="text-muted-foreground text-sm font-medium">
                &copy; {new Date().getFullYear()} Infinity Studios.
              </p>
              <span className="hidden md:block text-border">|</span>
              <p className="text-muted-foreground text-[13px]">
                Crafted for the modern host.
              </p>
            </div>

            <div className="flex items-center gap-8">
              {["Privacy", "Terms"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
