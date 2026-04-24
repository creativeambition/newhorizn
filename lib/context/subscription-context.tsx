"use client";
import { SubscriptionStatus } from "../types";
import { useAuth } from "./auth-context";
import { checkSubscriptionStatus } from "../subscription/subscription";
import { createContext, useContext } from "react";

type SubscriptionContext = {
  subscriptionStatus: SubscriptionStatus | null;
};

export const SubscriptionContext = createContext<
  SubscriptionContext | undefined
>(undefined);

export const SubscriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { accommodationData } = useAuth();
  const subscriptionStatus = accommodationData
    ? checkSubscriptionStatus({
        plan: accommodationData.plan,
        planExpiry: accommodationData.planExpiry,
        planStatus: accommodationData.planStatus,
      })
    : null;

  return (
    <SubscriptionContext.Provider value={{ subscriptionStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
