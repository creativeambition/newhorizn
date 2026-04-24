import { Metadata } from "next";
import { ExploreHeader } from "@/components/listings/explore-header";
import { ExplorePageProvider } from "@/lib/context/explore-page-context";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "Accommodations",
    template: "%s | Accommodations",
  },
  description:
    "Explore our curated list of accommodations, hotels, beach houses, studios, & more.",
  alternates: {
    canonical: "/accommodations",
  },
};

export default function RootExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExplorePageProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <ExploreHeader />
        {children}
      </div>
    </ExplorePageProvider>
  );
}
