import { ContactForm } from "@/components/contact-form";
import { HeroCaption } from "@/components/hero-caption";
import Header from "@/components/landing-page-header";
import { HelpFab } from "@/components/support/help-fab";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  BarChart3,
  BedIcon,
  Building2,
  CalendarIcon,
  ChartBarIcon,
  ChartLineIcon,
  Check,
  Clock,
  Cloud,
  CreditCardIcon,
  HelpCircle,
  Mail,
  Phone,
  QuoteIcon,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  SparklesIcon,
  TrendingUp,
  UserCheckIcon,
  Users,
  Zap,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "NewHorizn – Property Management for Hosts & Guests",
  description:
    "Control for hosts. Calm for guests. NewHorizn is the all-in-one platform for student housing, hostels, and hotels. Manage bookings or find your next stay in minutes.",
  keywords: [
    "student housing platform",
    "hostel booking system",
    "property management software",
    "short-term rental management",
    "accommodation management",
    "student accommodation booking",
    "bed space management",
  ],
};

const steps = [
  {
    number: "01",
    title: "Register",
    description: "Create your account and enter your property details.",
    icon: <UserCheckIcon className="h-7 w-7" />,
  },
  {
    number: "02",
    title: "Configure",
    description: "Add your rooms and pricing in the dashboard.",
    icon: <Settings className="h-7 w-7" />,
  },
  {
    number: "03",
    title: "Manage",
    description: "Start taking bookings and tracking occupancy in real time.",
    icon: <BarChart3 className="h-7 w-7" />,
  },
];

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
                  text: "Rooms, guests, and availability at a glance.",
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

        <div className="relative flex flex-col sm:flex-row gap-4 animate-fade-in-up md:mt-12">
          <Link href="/auth/register">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 gap-2 h-12 px-8 rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <Building2 className="h-5 w-5" />
              Manage your property
            </Button>
          </Link>
          <Link href="/accommodations">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 h-12 px-8 rounded-xl glass hover:bg-primary/5 transition-all duration-300"
            >
              <Search className="h-5 w-5" />
              Find an accommodation
            </Button>
          </Link>
        </div>

        {/* Value Indicators */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-border animate-fade-in">
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Cloud className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium tracking-tight">Cloud Native</p>
            {/* <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Always available
            </p> */}
          </div>
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Shield className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium tracking-tight">Secure Access</p>
            {/* <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Encrypted data
            </p> */}
          </div>
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <Clock className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium tracking-tight">2-Min Setup</p>
            {/* <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              No training needed
            </p> */}
          </div>
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
              <HelpCircle className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium tracking-tight">24/7 Support</p>
            {/* <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Always here
            </p> */}
          </div>
        </div>
      </section>

      {/* ─── Features Section: Bento-style ─── */}
      <section
        id="features"
        className="relative py-12 md:py-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 md:mb-20">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
                <span className="font-serif italic">Everything you need</span>
                <br />
                <span className="text-muted-foreground/80">
                  to run your property
                </span>
              </h2>
            </div>
            <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed lg:text-right">
              Property management, simplified. For hostels, apartments and
              hotels.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5">
            {/* Feature 1: Room Management — large card */}
            <div className="lg:col-span-7 group relative">
              <div className="relative h-full p-4 md:p-10 rounded-2xl border border-border/60 bg-background hover:border-foreground/15 transition-all duration-500 overflow-hidden active:scale-[0.99]">
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
                    Control your property. Rooms, beds, occupancy – all in one
                    dashboard.
                  </p>

                  {/* Mini dashboard mockup */}
                  <div className="mt-auto grid grid-cols-3 gap-3">
                    {[
                      { label: "Total", value: "48", trend: "+4" },
                      { label: "Occupied", value: "39", trend: "81%" },
                      { label: "Available", value: "9", trend: "Online" },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="p-3 md:p-4 rounded-xl bg-muted/50 border border-border/40 flex flex-col"
                      >
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                          {stat.label}
                        </p>
                        <p className="text-xl md:text-2xl font-black tracking-tight tabular-nums my-auto">
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
              <div className="relative h-full p-4 md:p-10 rounded-2xl border border-border/60 bg-background hover:border-foreground/15 transition-all duration-500 overflow-hidden active:scale-[0.99]">
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/2 rounded-full translate-y-1/3 -translate-x-1/3 group-hover:bg-foreground/4 transition-colors duration-500" />

                <div className="relative flex flex-col h-full">
                  <div className="size-12 flex items-center justify-center rounded-xl bg-foreground text-background mb-6">
                    <CalendarIcon className="h-5 w-5" />
                  </div>

                  <h3 className="font-black text-xl tracking-tight mb-2">
                    Booking Engine
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
                    Real-time availability and automated check-in workflows.
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
              <div className="relative h-full p-4 md:p-10 rounded-2xl border border-border/60 bg-background hover:border-foreground/15 transition-all duration-500 overflow-hidden active:scale-[0.99]">
                <div className="relative flex flex-col h-full">
                  <div className="size-12 flex items-center justify-center rounded-xl bg-foreground text-background mb-6">
                    <CreditCardIcon className="h-5 w-5" />
                  </div>

                  <h3 className="font-black text-xl tracking-tight mb-2">
                    Payment Processing
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px] mb-8">
                    Secure payment handling with deposit tracking and automated
                    receipts.
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
              <div className="relative h-full p-4 md:p-10 rounded-2xl border border-border/60 bg-foreground text-background overflow-hidden hover:bg-foreground/95 active:scale-[0.99] transition-all duration-500">
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
                    Build comprehensive guest records with preferences and
                    booking history. Personalize every stay.
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
        className="relative py-12 md:py-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl mb-16 md:mb-20">
            {/* <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Getting Started
            </p> */}
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95] mb-2">
              <span className="font-serif italic">Up and running</span>
              <br />
              <span className="text-muted-foreground/80">in minutes</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              2-minute setup. Focus on your guests.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 md:gap-0 relative lg:skew-5">
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
                Start Free Account
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Trusted by <span className="font-serif italic">20+</span> hosts
            </h2>
            <p className="text-muted-foreground">
              See why property managers are switching to NewHorizn.
            </p>
          </div>
        </div>

        {(() => {
          const testimonials = [
            {
              quote:
                "Setting up our hostel took less than 5 minutes. The interface is clean, and my staff didn't even need training.",
              author: "James A.",
              role: "Hostel Manager",
            },
            {
              quote:
                "Finally, a platform that doesn't feel like it was built in 1995. It's fast, reliable, and our guests love the booking flow.",
              author: "Sarah K.",
              role: "Apartment Owner",
            },
            {
              quote:
                "We cut our check-in time in half. Guests appreciate the smooth experience and we love the real-time dashboard.",
              author: "Kofi B.",
              role: "Hotel Manager",
            },
            {
              quote:
                "The best investment we made for our student housing. Occupancy tracking alone saved us hours every week.",
              author: "Ama D.",
              role: "Student Housing Owner",
            },
            {
              quote:
                "Switching from spreadsheets to NewHorizn was seamless. The onboarding was incredibly straightforward.",
              author: "Nana O.",
              role: "Guesthouse Owner",
            },
            {
              quote:
                "Our guests keep complimenting the booking experience. It's professional and fast — exactly what we needed.",
              author: "Efua M.",
              role: "Apartment Manager",
            },
          ];
          const row1 = [...testimonials, ...testimonials];
          const row2 = [
            ...testimonials.slice(3),
            ...testimonials.slice(0, 3),
            ...testimonials.slice(3),
            ...testimonials.slice(0, 3),
          ];
          const Card = ({ t }: { t: (typeof testimonials)[0] }) => (
            <div className="w-80 shrink-0 p-6 rounded-2xl bg-muted/30 border border-border/50 relative">
              <div className="absolute top-4 left-4 text-primary/10">
                <QuoteIcon className="size-10" />
              </div>
              <p className="text-sm italic mb-4 relative z-10 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="font-bold text-sm text-foreground">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          );
          return (
            <div className="space-y-4 skew-5">
              <div className="flex gap-4 w-max animate-marquee">
                {row1.map((t, i) => (
                  <Card key={i} t={t} />
                ))}
              </div>
              <div className="flex gap-4 w-max animate-marquee-slow">
                {row2.map((t, i) => (
                  <Card key={i} t={t} />
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ─── Contact Section ─── */}
      <section id="contact" className="relative py-24 md:py-32">
        <ContactForm />
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,black,transparent_1px)] bg-size-[32px_32px] opacity-50" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8">
            <span className="">Start managing</span>
            <br />
            <span className="text-background/50 font-serif italic">
              smarter today
            </span>
          </h2>

          <p className="text-background/50 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Join the hosts using newhorizn to manage bookings and delight guests
            – all in under 2 minutes of setup.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-14 px-10 rounded-xl bg-background text-foreground hover:bg-background/90 font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] duration-300"
              asChild
            >
              <Link href="/auth/register" className="gap-2">
                Start free setup
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
                <span className="font-serif italic">Built for the</span>
                <br />
                <span className="text-muted-foreground/80">modern host</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
                See how our hostel and student housing management platform helps
                owners reduce overhead, grow revenue, and deliver a better guest
                experience — without the complexity of legacy systems.
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
      <footer className="py-12 md:py-16 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.03),transparent_40%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-24">
            {/* Brand Info */}
            <div className="md:col-span-5 space-y-8">
              <div className="flex items-center gap-3">
                <Logo className="size-6" />
                <span className="text-2xl font-black tracking-tighter text-foreground">
                  newhorizn
                </span>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                The all-in-one property management system for hostels, student
                housing, and short-term rentals. Simple, secure, and built to
                scale.
              </p>

              <div className="flex items-center gap-4 pt-2">
                {/* Social placeholders or empty for now as per minimal aesthetic */}
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-3 lg:col-offset-1 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Links
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
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Support
              </h3>
              <div className="space-y-4">
                <a
                  href="mailto:support@newhorizn.com"
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
