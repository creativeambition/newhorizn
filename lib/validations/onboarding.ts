import * as z from "zod";

export const LISTING_TYPES = [
  "hostel",
  "apartment",
  "hotel",
  "guesthouse",
  "hotel",
  "other",
] as const;

export const onboardingSchema = z.object({
  accommodationName: z
    .string()
    .min(2, "Accommodation name must be at least 2 characters"),
  listingType: z.enum(LISTING_TYPES, {
    required_error: "Please select a listing type",
  }),
  address: z.string().min(5, "Please enter a valid address"),
  manager: z.string().min(2, "Manager name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(
      /^\+?([0-9]{1,4})?[-. ]?([0-9]{3})[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
      "Please enter a valid phone number",
    ),
  description: z.string().optional(),
  nearbyInstitutions: z.array(z.string()),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
