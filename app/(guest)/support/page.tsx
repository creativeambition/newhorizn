import { HelpFab } from "@/components/support/help-fab";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Clock, FileQuestion, MessageSquare } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    question: "How do I get started as a host?",
    answer:
      "Sign up for a free account, complete the onboarding steps to add your accommodation details (name, type, location, contact info), and you're ready to go. The whole setup takes less than 2 minutes.",
  },
  {
    category: "Getting Started",
    question: "Is newhorizn free to use?",
    answer:
      "Yes — newhorizn is completely free. There are no subscription fees, no hidden charges, and no credit card required to get started.",
  },
  {
    category: "Getting Started",
    question: "How do I get my accommodation verified?",
    answer:
      "Verification is free. Contact our support team and we'll briefly confirm your details. Once verified, your accommodation gets a verified badge and appears on the explore page for guests to discover.",
  },
  {
    category: "Bookings & Guests",
    question: "How do I add a new booking?",
    answer:
      "From your dashboard, go to Bookings and click 'New Booking'. Fill in the guest details, select the room, set the check-in and check-out dates, and confirm. The guest record is created automatically if they don't already exist.",
  },
  {
    category: "Bookings & Guests",
    question: "Can guests book directly through newhorizn?",
    answer:
      "Yes. Verified accommodations are listed on the explore page where guests can browse available rooms and submit booking requests directly to you.",
  },
  {
    category: "Bookings & Guests",
    question: "How do I manage check-ins and check-outs?",
    answer:
      "Open the booking from your Bookings page and use the status controls to mark a guest as checked in or checked out. The room availability updates automatically.",
  },
  {
    category: "Rooms & Pricing",
    question: "How do I set up rooms and pricing?",
    answer:
      "Go to the Rooms section of your dashboard. Add each room with its type, capacity, and base price. You can also configure global pricing rules (e.g. semester rates) from the Settings page.",
  },
  {
    category: "Rooms & Pricing",
    question: "Can I upload photos for my rooms?",
    answer:
      "Yes. Each room has a media manager where you can upload photos and videos. These are shown to guests browsing your listing on the explore page.",
  },
  {
    category: "Account & Data",
    question: "How secure is my data?",
    answer:
      "All data is stored securely using industry-standard encryption. We use Supabase as our backend, which is SOC 2 compliant and enforces row-level security so only you can access your accommodation's data.",
  },
  {
    category: "Account & Data",
    question: "Can I export my booking data?",
    answer:
      "Data export is on our roadmap and coming soon. We're building the ability to export bookings, guest records, and financial summaries. We'll notify you when it's available.",
  },
  {
    category: "Account & Data",
    question: "How do I update my accommodation profile or contact details?",
    answer:
      "Go to Settings from your dashboard. You can update your accommodation name, address, contact email, phone number, and manager details at any time.",
  },
];

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Center",
  description:
    "Find answers to common questions or get in touch with our support team.",
  alternates: {
    canonical: "/support",
  },
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HelpFab />
      <main className="flex-1 relative overflow-hidden py-12">
        <div className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none">
          <div className="blur-[50px] h-56 bg-linear-to-br from-primary to-purple-400 dark:from-blue-700"></div>
          <div className="blur-[106px] h-32 bg-linear-to-r from-cyan-400 to-primary dark:to-indigo-600"></div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-2">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              <span className="">How can we help?</span>
            </h1>
            <p className="text-primary max-w-2xl mx-auto text-lg">
              Find answers to common questions or get in touch with our support
              team.
            </p>
          </div>

          {/* Quick Support Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Support Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Everyday
                    <br />
                    Anytime
                  </p>
                </div>
              </div>
            </Card>

            <Card className="relative p-6 opacity-50">
              <Badge className="absolute top-0 left-4 -translate-y-1/2">
                Coming soon
              </Badge>

              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileQuestion className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Documentation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse our detailed guides and tutorials
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    disabled
                  >
                    View guides <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="relative p-6 opacity-50">
              <Badge className="absolute top-0 left-4 -translate-y-1/2">
                Coming soon
              </Badge>

              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our support team
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    disabled
                  >
                    Start chat <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <div className="grid lg:grid-cols-2 gap-x-16 gap-y-8 items-start">
              {Array.from(new Set(faqs.map((f) => f.category))).map(
                (category) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">
                      {category}
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs
                        .filter((f) => f.category === category)
                        .map((faq, index) => (
                          <AccordionItem
                            key={index}
                            value={`${category}-${index}`}
                          >
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
