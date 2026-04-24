"use client";

import React, { createContext, useContext, useState } from "react";
import type { PublicListing } from "@/lib/services/public-listing-service";

interface ExplorePageContextType {
  activeListing: PublicListing | null;
  setActiveListing: (listing: PublicListing | null) => void;
  customRightContent: React.ReactNode | null;
  setCustomRightContent: (content: React.ReactNode | null) => void;
}

const ExplorePageContext = createContext<ExplorePageContextType | undefined>(
  undefined
);

export function ExplorePageProvider({ children }: { children: React.ReactNode }) {
  const [activeListing, setActiveListing] = useState<PublicListing | null>(null);
  const [customRightContent, setCustomRightContent] =
    useState<React.ReactNode | null>(null);

  return (
    <ExplorePageContext.Provider
      value={{
        activeListing,
        setActiveListing,
        customRightContent,
        setCustomRightContent,
      }}
    >
      {children}
    </ExplorePageContext.Provider>
  );
}

export function useExplorePage() {
  const context = useContext(ExplorePageContext);
  if (context === undefined) {
    throw new Error("useExplorePage must be used within an ExplorePageProvider");
  }
  return context;
}
