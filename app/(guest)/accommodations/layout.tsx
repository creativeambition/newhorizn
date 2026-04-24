import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accommodations",
  description: "Explore our curated list of accommodations, hotels, beach houses, studios, & more.",
  alternates: {
    canonical: "/accommodations",
  },
};

export default function ExploreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen">{children}</div>;
}
