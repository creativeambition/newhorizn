"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import { KNOWN_INSTITUTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LISTING_TYPES, onboardingSchema } from "@/lib/validations/onboarding";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type FormData = z.infer<typeof onboardingSchema>;

const LISTING_TYPE_LABELS: Record<(typeof LISTING_TYPES)[number], string> = {
  hostel: "Hostel",
  apartment: "Apartment",
  hotel: "Hotel",
  guesthouse: "Guesthouse",
  other: "Other",
};

const STEPS = [
  {
    id: 1,
    title: "Your place",
    description: "Name and type of accommodation",
    icon: Building2,
    key: "place",
  },
  {
    id: 2,
    title: "Location",
    description: "Where are you based?",
    icon: MapPin,
    key: "location",
  },
  {
    id: 3,
    title: "Contact",
    description: "How can guests reach you?",
    icon: Mail,
    key: "contact",
  },
  {
    id: 4,
    title: "Description",
    description: "Tell us more about your place (optional)",
    icon: Sparkles,
    key: "description",
    onlyFor: ["hostel"] as const,
  },
] as const;

export default function OnboardingContent() {
  const router = useRouter();
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const supabase = createClient();

  const form = useForm<FormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      accommodationName: "",
      listingType: "hostel",
      address: "",
      manager: "",
      email: "",
      phone: "",
      description: "",
      nearbyInstitutions: [],
    },
  });

  const listingType = form?.watch("listingType");
  const visibleSteps = (STEPS as readonly any[]).filter(
    (s) => !s.onlyFor || (s.onlyFor as readonly string[]).includes(listingType),
  );
  const currentStepData =
    visibleSteps[step - 1] || visibleSteps[visibleSteps.length - 1];

  useEffect(() => {
    if (user) {
      const name =
        user.user_metadata?.full_name || user.user_metadata?.display_name;
      if (name) form.setValue("manager", name);
      if (user.email) form.setValue("email", user.email);
    }
  }, [user]);

  useEffect(() => {
    // If we've finished checking for a user and there isn't one, redirect
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const canProceed = () => {
    if (step === 1) {
      return (
        form.getValues("accommodationName")?.trim().length >= 2 &&
        !!form.getValues("listingType")
      );
    }
    if (step === 2) {
      return (
        form.getValues("address")?.trim().length >= 5 &&
        form.getValues("manager")?.trim().length >= 2
      );
    }
    if (step === 3) {
      if (listingType === "hostel") return form.formState.isValid;
      return form.formState.isValid;
    }
    return true;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Verify user existence one last time before submission
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        router.push("/auth/login");
        return;
      }

      // Create new accommodation record in Supabase
      const { error } = await supabase.from("accommodations").insert({
        owner_id: user?.id,
        accommodationName: data.accommodationName,
        listingType: data.listingType,
        address: data.address,
        manager: data.manager,
        email: data.email,
        phone: data.phone,
        description: data.description,
        nearbyInstitutions: data.nearbyInstitutions || [],
        isVerified: false,
        currency: "GHS",
      });

      if (error) throw error;

      // Force a profile refresh so global auth context knows the onboarding is done
      await refreshProfile();

      toast({
        title: "You’re all set",
        description: "Your accommodation profile is ready.",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding failed:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const onboardingImage =
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div
        className="relative lg:hidden h-44 sm:h-52 shrink-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${onboardingImage}')` }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-background" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-sm text-white/90 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Setting up your space</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground drop-shadow-xs">
            {currentStepData.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {currentStepData.description}
          </p>
        </div>
      </div>

      <div
        className="relative hidden lg:flex lg:w-[45%] min-h-60 lg:min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${onboardingImage}')` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-sm text-white/90 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Setting up your space</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {currentStepData.title}
          </h1>
          <p className="text-white/80 mt-1 text-sm md:text-base max-w-sm">
            {currentStepData.description}
          </p>
          <div className="flex gap-2 mt-4">
            {visibleSteps.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-colors max-w-16 ${idx + 1 <= step ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:p-10">
        <div className="lg:hidden w-full max-w-md mb-2" aria-hidden />
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 dark:shadow-none p-6 md:p-8">
            <div className="mb-6">
              <div className="flex gap-2">
                {visibleSteps.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${idx + 1 <= step ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (
                      e.target instanceof HTMLInputElement ||
                      e.target instanceof HTMLTextAreaElement
                    ) {
                      e.preventDefault();
                    }
                  }
                }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="accommodationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accommodation name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="eg. New Horizon"
                              className="h-11 text-base"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="listingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LISTING_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {LISTING_TYPE_LABELS[t]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Street, city, region"
                              className="h-11 text-base"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. John Doe"
                              className="h-11 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contact@accommodation.com"
                              className="h-11 text-base"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. +233 24 123 4567"
                              className="h-11 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 4 && listingType === "hostel" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              placeholder="Add details about your hostel, rules, and anything else students should know."
                              className="w-full min-h-25 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nearbyInstitutions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Associated Institutions</FormLabel>
                          <div className="text-[13px] text-muted-foreground mb-3">
                            Select institutions that your hostel specifically
                            serves or is located near.
                          </div>
                          <FormControl>
                            <div className="flex flex-wrap gap-2 max-h-50 overflow-y-auto p-1">
                              {KNOWN_INSTITUTIONS.map((inst) => {
                                const isSelected = field.value?.includes(inst);
                                return (
                                  <Badge
                                    key={inst}
                                    variant={isSelected ? "default" : "outline"}
                                    className={cn(
                                      "cursor-pointer py-1.5 px-3 rounded-full transition-all",
                                      isSelected
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "hover:bg-accent text-muted-foreground",
                                    )}
                                    onClick={() => {
                                      const current = field.value || [];
                                      const updated = isSelected
                                        ? current.filter((i) => i !== inst)
                                        : [...current, inst];
                                      field.onChange(updated);
                                    }}
                                  >
                                    {inst}
                                  </Badge>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={(e) => {
                        e.preventDefault();
                        setStep((s) => s - 1);
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : null}
                  <div className="flex-1" />
                  {step < visibleSteps.length ? (
                    <Button
                      type="button"
                      className="h-11 min-w-30"
                      disabled={!canProceed()}
                      onClick={(e) => {
                        e.preventDefault();
                        setStep((s) => s + 1);
                      }}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="h-11 min-w-35"
                      disabled={isSubmitting || !form.formState.isValid}
                      onClick={(e) => {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Complete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
