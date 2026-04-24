import { Plans } from "../types";

export type PlanFeature = {
  name: string;
  highlighted?: boolean;
};

export type PricingPlan = {
  id: Plans;
  name: string;
  description: string;
  price: number;
  interval: string;
  popular?: boolean;
  features: PlanFeature[];
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: Plans.BASE,
    name: "Starter",
    description:
      "Essential tools to manage your accommodation with zero upfront cost.",
    price: 0,
    interval: "",
    features: [
      { name: "Unlimited rooms & guests", highlighted: true },
      { name: "First 20 bookings free", highlighted: true },
      { name: "Commission per booking after trial" },
      { name: "Full media management" },
      { name: "Basic dashboard & reporting" },
    ],
  },
  {
    id: Plans.PRO,
    name: "Pro",
    description:
      "Advanced automation and priority support for larger accommodation businesses.",
    price: 0,
    interval: "",
    popular: true,
    features: [
      { name: "Unlimited rooms & guests", highlighted: true },
      { name: "First 20 bookings free", highlighted: true },
      { name: "Commission per booking after trial" },
      { name: "24/7 Priority support", highlighted: true },
      { name: "Advanced analytics & branding" },
    ],
  },
  {
    id: Plans.STANDARD,
    name: "Standard",
    description:
      "The perfect balance for growing accommodations needing more than the basics.",
    price: 0,
    interval: "",
    features: [
      { name: "Unlimited rooms & guests", highlighted: true },
      { name: "First 20 bookings free", highlighted: true },
      { name: "Commission per booking after trial" },
      { name: "Priority email support" },
      { name: "Advanced reporting tools" },
    ],
  },
];
