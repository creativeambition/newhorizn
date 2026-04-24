"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/lib/context/auth-context";
import { PricingConfig } from "@/lib/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Calendar, Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import {
  Trash,
  UploadCloud,
  X as XIcon,
  ImageIcon,
  Zap,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { useSubscription } from "@/lib/context/subscription-context";
import { getMediaLimitsForPlan } from "@/lib/subscription/subscription";
import Link from "next/link";
import { sanitizeFilename } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${Math.round(bytes / 1_048_576)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function isUnlimited(n: number) {
  return n >= 999_999;
}

export default function SettingsPage() {
  const {
    accommodationData,
    updateGlobalConfig,
    updateAccommodation,
    user,
    loading: authLoading,
  } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [pricing, setPricing] = useState<PricingConfig>(
    accommodationData?.globalConfig?.globalPricing || {},
  );
  const [semesterEndDate, setSemesterEndDate] = useState(
    accommodationData?.globalConfig?.semesterEndDate || "",
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Separate states for custom period form and list
  const [customPeriods, setCustomPeriods] = useState(
    accommodationData?.globalConfig?.globalPricing?.customPeriods || [],
  );
  const [newCustomPeriod, setNewCustomPeriod] = useState({
    label: "",
    duration: 1 as number | "",
    durationUnit: "year(s)" as "month(s)" | "year(s)",
    amount: 0 as number | "",
  });
  const [currency, setCurrency] = useState(
    accommodationData?.currency || "GHS",
  );

  const [media, setMedia] = useState(accommodationData?.media || []);
  const [pendingPhotos, setPendingPhotos] = useState<{ [key: number]: File }>(
    {},
  );
  const [previews, setPreviews] = useState<{ [key: number]: string }>({});
  const [uploading, setUploading] = useState(false);

  const { subscriptionStatus } = useSubscription();
  const limits = getMediaLimitsForPlan(subscriptionStatus?.plan);

  const imageCount = media.length;
  const imagesFull = false; // Unlimited photos in new model

  const [payoutNetwork, setPayoutNetwork] = useState(
    accommodationData?.payout_network || "",
  );
  const [payoutNumber, setPayoutNumber] = useState(
    accommodationData?.payout_number || "",
  );
  const [linkingPayout, setLinkingPayout] = useState(false);
  const [verifyingNumber, setVerifyingNumber] = useState(false);

  useEffect(() => {
    if (accommodationData) {
      setPricing(accommodationData.globalConfig?.globalPricing || {});
      setSemesterEndDate(accommodationData.globalConfig?.semesterEndDate || "");
      setCustomPeriods(
        accommodationData.globalConfig?.globalPricing?.customPeriods || [],
      );
      setMedia(accommodationData.media || []);
      setCurrency(accommodationData.currency || "GHS");
      setPayoutNetwork(accommodationData.payout_network || "");
      setPayoutNumber(accommodationData.payout_number || "");
    }
  }, [accommodationData]);

  // Check for verification callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("verified") === "true") {
      toast({
        title: "✓ Number Verified",
        description:
          "Your mobile money number has been verified successfully! The verification charge will be refunded.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  useEffect(() => {
    const pricingChanged =
      JSON.stringify({ ...pricing, customPeriods }) !==
      JSON.stringify(accommodationData?.globalConfig?.globalPricing || {});
    const semesterChanged =
      semesterEndDate !==
      (accommodationData?.globalConfig?.semesterEndDate || "");
    const mediaChanged =
      JSON.stringify(media) !== JSON.stringify(accommodationData?.media || []);
    const currencyChanged = currency !== (accommodationData?.currency || "GHS");
    setHasChanges(
      pricingChanged || semesterChanged || mediaChanged || currencyChanged,
    );
  }, [
    pricing,
    customPeriods,
    semesterEndDate,
    accommodationData,
    media,
    currency,
  ]);

  const addCustomPeriod = async () => {
    if (!newCustomPeriod.label || !newCustomPeriod.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields before adding.",
        variant: "destructive",
      });
      return;
    }

    const period = {
      id: Date.now().toString(),
      ...newCustomPeriod,
      duration: Number(newCustomPeriod.duration) || 1,
      amount: Number(newCustomPeriod.amount) || 0,
    };

    const updatedPeriods = [...customPeriods, period];
    setCustomPeriods(updatedPeriods);

    try {
      await updateGlobalConfig({
        globalPricing: { ...pricing, customPeriods: updatedPeriods },
        semesterEndDate,
      });
      toast({
        title: "✓ Added",
        description: `${period.label} has been added successfully.`,
      });
      setNewCustomPeriod({
        label: "",
        duration: 1,
        durationUnit: "year(s)",
        amount: 0,
      });
    } catch (error) {
      setCustomPeriods(customPeriods); // Revert on error
      toast({
        title: "Error",
        description: "Failed to add custom period.",
        variant: "destructive",
      });
    }
  };

  const deleteCustomPeriod = async (id: string) => {
    const period = customPeriods.find((p) => p.id === id);
    const updatedPeriods = customPeriods.filter((p) => p.id !== id);
    setCustomPeriods(updatedPeriods);

    try {
      await updateGlobalConfig({
        globalPricing: { ...pricing, customPeriods: updatedPeriods },
        semesterEndDate,
      });
      toast({
        title: "✓ Deleted",
        description: `${period?.label || "Custom period"} has been deleted.`,
      });
    } catch (error) {
      setCustomPeriods(customPeriods); // Revert on error
      toast({
        title: "Error",
        description: "Failed to delete custom period.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAccommodation({
        globalConfig: {
          globalPricing: { ...pricing, customPeriods },
          semesterEndDate,
        },
        media,
        currency,
        payout_network: payoutNetwork,
        payout_number: payoutNumber,
      });

      toast({
        title: "Settings saved",
        description:
          "Global pricing and semester settings have been updated successfully.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const linkPayoutAccount = async () => {
    if (!payoutNetwork || !payoutNumber || !user || !accommodationData) return;

    setLinkingPayout(true);
    try {
      const res = await fetch("/api/payments/subaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accommodationId: accommodationData.id,
          network: payoutNetwork,
          accountNumber: payoutNumber,
          businessName:
            accommodationData.accommodationName || "Accommodation Owner",
        }),
      });

      const data = await res.json();
      if (data.success) {
        const isUpdate = data.isUpdate;
        toast({
          title: isUpdate
            ? "✓ Payout Account Updated"
            : "✓ Payout Account Linked",
          description: isUpdate
            ? "Your payout details have been updated successfully."
            : "Split payments are now enabled.",
        });
        await updateAccommodation({
          paystack_subaccount_code: data.subaccountCode,
          payout_network: payoutNetwork,
          payout_number: payoutNumber,
          payout_verified: false, // Reset verification when details change
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || "Failed to link Paystack account.",
        variant: "destructive",
      });
    } finally {
      setLinkingPayout(false);
    }
  };

  const verifyPayoutNumber = async () => {
    if (!accommodationData?.id) return;

    setVerifyingNumber(true);
    try {
      const res = await fetch("/api/payments/verify-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accommodationId: accommodationData.id,
          action: "verify",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "✓ Verification Started",
          description: data.message,
        });
        // Redirect to Paystack for mobile money verification
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Could not start verification process.",
        variant: "destructive",
      });
    } finally {
      setVerifyingNumber(false);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > limits.maxImageBytes) {
      toast({
        title: "File too large",
        description: `Images must be under ${formatBytes(limits.maxImageBytes)} on your plan.`,
        variant: "destructive",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingPhotos((prev) => ({ ...prev, [index]: file }));
    setPreviews((prev) => ({ ...prev, [index]: previewUrl }));
  };

  const cancelPendingPhoto = (index: number) => {
    setPendingPhotos((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setPreviews((prev) => {
      const next = { ...prev };
      if (next[index]) URL.revokeObjectURL(next[index]);
      delete next[index];
      return next;
    });
  };

  const handleBulkUpload = async () => {
    const filesToUpload = Object.entries(pendingPhotos);
    if (filesToUpload.length === 0 || !user) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const nextMedia = [...media];

      // Sort by index to maintain order if possible, though they are usually appended
      const sortedFiles = filesToUpload.sort(
        ([a], [b]) => Number(a) - Number(b),
      );

      for (const [indexStr, file] of sortedFiles) {
        const index = Number(indexStr);
        const sanitizedName = sanitizeFilename(file.name);
        const filePath = `covers/${Date.now()}_${sanitizedName}`;
        const { error } = await supabase.storage
          .from(SUPABASE_CONFIG.STORAGE_BUCKET)
          .upload(`${user.id}/${filePath}`, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from(SUPABASE_CONFIG.STORAGE_BUCKET)
          .getPublicUrl(`${user.id}/${filePath}`);

        const newEntry = { url: publicUrl, title: file.name };

        if (index < nextMedia.length) {
          nextMedia[index] = newEntry;
        } else {
          // If it's beyond current length, we just push it (this handles new slots)
          nextMedia.push(newEntry);
        }
      }

      await updateAccommodation({ media: nextMedia });
      setMedia(nextMedia);

      // Clear pending
      Object.values(previews).forEach(URL.revokeObjectURL);
      setPendingPhotos({});
      setPreviews({});

      toast({
        title: "Media updated",
        description: `${filesToUpload.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload images.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);
    // If a pending photo was replacing this slot, we might want to clear it?
    // Actually, our grid logic is index-based, so removing an item shifts the others.
    // This is consistent with how room media works.
  };

  // if (authLoading && !accommodationData) {
  //   return (
  //     <div className="flex flex-col h-[70vh] w-full items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  //       <p className="mt-4 text-sm text-muted-foreground animate-pulse font-medium">
  //         Loading settings...
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <main className="w-full p-3 md:p-6 lg:px-10">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage global pricing, semester configuration, and media
          </p>
        </div>

        {/* Accommodation Media Section */}
        <div className="border rounded-lg bg-card">
          <div className="border-b p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Accommodation Media</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Upload cover images for your accommodation
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex overflow-x-auto pt-6 pb-6 gap-6 no-scrollbar scroll-smooth -mx-1 px-1">
              {Array.from({
                length: Math.min(
                  limits.photosPerAccommodation,
                  Math.max(
                    5,
                    media.length + 1,
                    ...Object.keys(pendingPhotos).map((k) => Number(k) + 1),
                  ),
                ),
              }).map((_, index) => {
                const item = media[index];
                const pendingFile = pendingPhotos[index];
                const preview = previews[index];
                const hasContent = !!(item || preview);

                return (
                  <div
                    key={index}
                    className="flex-none w-44 h-44 relative group"
                  >
                    <label
                      className={clsx(
                        "relative w-full h-full rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden bg-muted/30",
                        hasContent
                          ? "border-transparent shadow-sm"
                          : "border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent",
                        uploading && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleFileSelect(e, index)}
                        disabled={uploading}
                      />

                      {preview ? (
                        <>
                          <img
                            src={preview}
                            alt="Selected"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <UploadCloud className="h-6 w-6 text-white mb-1" />
                            <span className="text-[10px] text-white font-bold px-2 py-0.5 bg-primary rounded uppercase">
                              Replace
                            </span>
                          </div>
                        </>
                      ) : item ? (
                        <>
                          <img
                            src={item.url}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <UploadCloud className="h-6 w-6 text-white mb-1" />
                            <span className="text-[10px] text-white font-bold px-2 py-0.5 bg-primary rounded uppercase">
                              Replace
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <UploadCloud className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest text-center px-2">
                            Add Photo <br />{" "}
                            <span className="text-[8px] opacity-60">
                              Slot {index + 1}
                            </span>
                          </span>
                        </>
                      )}
                    </label>

                    {preview && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          cancelPendingPhoto(index);
                        }}
                        className="absolute -top-2 -right-2 p-1.5 bg-background border rounded-full shadow-md hover:bg-muted transition-colors z-10"
                        title="Cancel selection"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}

                    {item && !preview && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeMedia(index);
                        }}
                        className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Delete image"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}

                    {(preview || item) && (
                      <div className="absolute bottom-2 left-2 pointer-events-none">
                        <span
                          className={clsx(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm border border-white/20 backdrop-blur-md",
                            preview
                              ? "bg-primary/90 text-primary-foreground"
                              : "bg-black/60 text-white/90",
                          )}
                        >
                          {preview ? "Staged" : "Saved"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  <span
                    className={clsx(imagesFull && "text-amber-500 font-bold")}
                  >
                    {isUnlimited(limits.photosPerAccommodation)
                      ? `${imageCount} photo${imageCount !== 1 ? "s" : ""}`
                      : `${imageCount} / ${limits.photosPerAccommodation} photo${limits.photosPerAccommodation !== 1 ? "s" : ""}`}
                  </span>
                  <span>•</span>
                  <span>Max {formatBytes(limits.maxImageBytes)} per image</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm">
                  The first image will be used as the primary thumbnail.
                  Horizontal scrolling available for more photos.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Upgrade link removed for unlimited model */}

                <Button
                  onClick={handleBulkUpload}
                  disabled={
                    uploading || Object.keys(pendingPhotos).length === 0
                  }
                  className="w-full sm:w-auto min-w-30"
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Update Media{" "}
                      {Object.keys(pendingPhotos).length > 0
                        ? `(${Object.keys(pendingPhotos).length})`
                        : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Pricing Section */}
        <div className="border rounded-lg bg-card">
          <div className="border-b p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">Pricing & Currency</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Configure your display currency and default rates
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-32">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger
                    id="currency-select"
                    className="h-9 font-bold bg-muted/50"
                  >
                    <SelectValue placeholder="GHS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GHS">GHS (₵)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perNight">Per Night ({currency})</Label>
                <Input
                  id="perNight"
                  type="number"
                  min={0}
                  value={pricing.perNight || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      perNight: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perWeek">Per Week ({currency})</Label>
                <Input
                  id="perWeek"
                  type="number"
                  min={0}
                  value={pricing.perWeek || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      perWeek: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perMonth">Per Month ({currency})</Label>
                <Input
                  id="perMonth"
                  type="number"
                  min={0}
                  value={pricing.perMonth || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      perMonth: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perYear">Per Year ({currency})</Label>
                <Input
                  id="perYear"
                  type="number"
                  min={0}
                  value={pricing.perYear || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      perYear: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-4 col-span-1 sm:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-medium">Custom Periods</h3>

                {/* Add New Custom Period Form */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <h4 className="text-sm font-medium mb-3">
                    Add New Custom Period
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="new-custom-label"
                        className="text-xs font-medium"
                      >
                        Name
                      </Label>
                      <Input
                        id="new-custom-label"
                        placeholder="e.g. 2 Years, Semester"
                        value={newCustomPeriod.label}
                        onChange={(e) =>
                          setNewCustomPeriod({
                            ...newCustomPeriod,
                            label: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="new-custom-duration"
                        className="text-xs font-medium"
                      >
                        Duration
                      </Label>
                      <div className="flex flex-col lg:flex-row gap-2">
                        <Input
                          id="new-custom-duration"
                          type="number"
                          min={1}
                          step={1}
                          value={newCustomPeriod.duration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setNewCustomPeriod({
                              ...newCustomPeriod,
                              duration: isNaN(val) ? "" : val,
                            });
                          }}
                        />

                        <Select
                          value={newCustomPeriod.durationUnit}
                          onValueChange={(value: "month(s)" | "year(s)") =>
                            setNewCustomPeriod({
                              ...newCustomPeriod,
                              durationUnit: value,
                            })
                          }
                        >
                          <SelectTrigger id="new-custom-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month(s)">Month(s)</SelectItem>
                            <SelectItem value="year(s)">Year(s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="new-custom-amount"
                        className="text-xs font-medium"
                      >
                        Total Amount ({currency})
                      </Label>
                      <Input
                        id="new-custom-amount"
                        type="number"
                        min={0}
                        value={newCustomPeriod.amount}
                        onChange={(e) =>
                          setNewCustomPeriod({
                            ...newCustomPeriod,
                            amount:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      type="button"
                      onClick={addCustomPeriod}
                      size="sm"
                      disabled={
                        !newCustomPeriod.label || !newCustomPeriod.amount
                      }
                    >
                      Add Custom Period
                    </Button>
                  </div>
                </div>

                {/* Custom Periods List */}
                {customPeriods.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">No custom periods configured</p>
                    <p className="text-xs mt-1">
                      Add your first custom pricing period above
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {customPeriods.map((period) => (
                      <div
                        key={period.id}
                        className="bg-muted/30 rounded-lg p-3 border flex items-center justify-between gap-4 w-fit"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {period.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {period.duration || period.years}{" "}
                            {(period.durationUnit || "years").slice(0, -1)}
                            {(period.duration || period.years) !== 1
                              ? "s"
                              : ""}{" "}
                            • {currency} {period.amount.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCustomPeriod(period.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Semester Settings Section */}
        {accommodationData?.listingType === "hostel" && (
          <div className="border rounded-lg bg-card">
            <div className="border-b p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">Semester Settings</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Configure semester end date for bookings
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semesterEndDate">Semester End Date</Label>
                  <DatePicker
                    date={
                      semesterEndDate ? new Date(semesterEndDate) : undefined
                    }
                    onSelect={(date) =>
                      setSemesterEndDate(
                        date ? date.toISOString().split("T")[0] : "",
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    All semester bookings will use this date as the checkout
                    date
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perSemester">Per Semester ({currency})</Label>
                  <Input
                    id="perSemester"
                    type="number"
                    min={0}
                    value={pricing.perSemester || ""}
                    onChange={(e) =>
                      setPricing({
                        ...pricing,
                        perSemester: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payout Settings Section */}
        <div id="payout" className="border rounded-lg bg-card overflow-hidden">
          <div className="border-b p-4 sm:p-6 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5" />
                <div>
                  <h2 className="text-lg font-semibold">Payout Settings</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Connect your Mobile Money for automated rent payouts
                  </p>
                </div>
              </div>
              {accommodationData?.paystack_subaccount_code ? (
                accommodationData?.payout_verified ? (
                  <Badge variant="default" className="bg-emerald-500 font-bold">
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500 text-white font-bold"
                  >
                    Verification Required
                  </Badge>
                )
              ) : (
                <Badge variant="secondary" className="font-bold">
                  Setup Required
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="payoutNetwork">MoMo Network</Label>
                <Select value={payoutNetwork} onValueChange={setPayoutNetwork}>
                  <SelectTrigger id="payoutNetwork">
                    <SelectValue placeholder="Select Network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                    <SelectItem value="VODAFONE">Telecel (Vodafone)</SelectItem>
                    <SelectItem value="AIRTELTIGO">AirtelTigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutNumber">MoMo Number</Label>
                <Input
                  id="payoutNumber"
                  placeholder="e.g. 0244123456"
                  value={payoutNumber}
                  onChange={(e) => setPayoutNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Verification Section */}
            {/* {accommodationData?.paystack_subaccount_code &&
              !accommodationData?.payout_verified && (
                <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-200">
                          Verify Your Mobile Number
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          To accept bookings, verify ownership by completing a
                          GHS1.00 charge that will be immediately refunded.
                        </p>
                      </div>

                      <div className="flex justify-start">
                        <Button
                          onClick={verifyPayoutNumber}
                          disabled={verifyingNumber || !payoutNumber}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {verifyingNumber ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {verifyingNumber
                            ? "Starting Verification..."
                            : "Verify Mobile Number"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground max-w-md">
                {accommodationData?.paystack_subaccount_code ? (
                  accommodationData?.payout_verified ? (
                    <p className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      Payments will be split: 1% Platform Commission / 99% Host
                      Payout (minus standard ₵0.10 processing fee).
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      Number verification required before you can accept
                      bookings.
                    </p>
                  )
                ) : (
                  <p className="flex items-start gap-2 text-xs">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    Linking your account enables faster confirmation for guests.
                  </p>
                )}
              </div>
              <Button
                className="max-sm:mr-auto"
                onClick={linkPayoutAccount}
                disabled={
                  linkingPayout ||
                  !payoutNetwork ||
                  !payoutNumber ||
                  (payoutNetwork ===
                    (accommodationData?.payout_network || "") &&
                    payoutNumber === (accommodationData?.payout_number || ""))
                }
                variant={
                  accommodationData?.paystack_subaccount_code
                    ? "outline"
                    : "default"
                }
              >
                {linkingPayout ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : accommodationData?.paystack_subaccount_code ? (
                  "Update Payout Account"
                ) : (
                  "Link Payout Account"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="border rounded-lg bg-card">
          <div className="border-b p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Theme</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Choose your preferred theme
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <RadioGroup
              className="flex max-xl:justify-around xl:gap-8"
              value={theme}
              onValueChange={setTheme}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="cursor-pointer">
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="cursor-pointer">
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="cursor-pointer">
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Floating Save Reminder for Mobile/Scroll */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg md:bottom-6 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-primary p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-between gap-4 border border-background/10 dark:border-background/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="bg-background/20 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-background" />
              </div>
              <div>
                <p className="text-sm font-bold text-background">
                  Unsaved Changes
                </p>
                <p className="text-[10px] text-background/80 leading-none">
                  Settings modified but not yet saved.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="secondary"
              size="sm"
              className="font-bold px-6 shadow-sm whitespace-nowrap"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
