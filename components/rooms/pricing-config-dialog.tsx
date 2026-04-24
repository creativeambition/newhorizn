"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth-context";
import { PricingConfig, Room } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface PricingConfigDialogProps {
  room: Room;
  onSave: (room: Room) => Promise<void>;
  isSubmitting?: boolean;
}

export function PricingConfigDialog({
  room,
  onSave,
  isSubmitting,
}: PricingConfigDialogProps) {
  const [pricing, setPricing] = useState<PricingConfig>(room.pricing || {});

  const hasChanges =
    JSON.stringify(pricing) !== JSON.stringify(room.pricing || {});

  const handleSave = async () => {
    if (!hasChanges) return;
    await onSave({
      ...room,
      pricing,
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="space-y-4 mt-4 px-1">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
            <Label htmlFor="regular-night" className="text-left">
              Per Night
            </Label>
            <Input
              id="regular-night"
              type="number"
              min={0}
              value={pricing.perNight ?? ""}
              onChange={(e) =>
                setPricing({
                  ...pricing,
                  perNight:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="0.00"
              className="col-span-1 xl:col-span-3"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
            <Label htmlFor="regular-week" className="text-left">
              Per Week
            </Label>
            <Input
              id="regular-week"
              type="number"
              min={0}
              value={pricing.perWeek ?? ""}
              onChange={(e) =>
                setPricing({
                  ...pricing,
                  perWeek:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="0.00"
              className="col-span-1 xl:col-span-3"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
            <Label htmlFor="regular-month" className="text-left">
              Per Month
            </Label>
            <Input
              id="regular-month"
              type="number"
              min={0}
              value={pricing.perMonth ?? ""}
              onChange={(e) =>
                setPricing({
                  ...pricing,
                  perMonth:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="0.00"
              className="col-span-1 xl:col-span-3"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
            <Label htmlFor="regular-year" className="text-left">
              Per Year
            </Label>
            <Input
              id="regular-year"
              type="number"
              min={0}
              value={pricing.perYear ?? ""}
              onChange={(e) =>
                setPricing({
                  ...pricing,
                  perYear:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="0.00"
              className="col-span-1 xl:col-span-3"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || !hasChanges}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Pricing Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
