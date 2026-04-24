"use client";

import { useEffect, useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Guest } from "@/lib/types";
import { Loader, Loader2 } from "lucide-react";

type GuestEditFormProps = {
  guest: Guest;
  onSave: (guest: Guest) => Promise<void>;
  onClose: () => void;
};

export default function GuestEditForm({
  guest,
  onSave,
  onClose,
}: GuestEditFormProps) {
  const [formData, setFormData] = useState<Guest>({ ...guest });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name) {
      errors.name = "Guest name is required";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setFormData(guest);
  }, [guest]);

  return (
    <DialogContent className="sm:max-w-125 max-h-screen overflow-y-auto">
      <DialogHeader className="text-left">
        <DialogTitle>Edit Guest</DialogTitle>
        <DialogDescription>
          Update guest information. Click save when you're done.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="name" className="text-left">
            Name
          </Label>
          <div className="col-span-1 xl:col-span-3">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFormErrors({ ...formErrors, name: "" });
              }}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="email" className="text-left">
            Email
          </Label>
          <div className="col-span-1 xl:col-span-3">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setFormErrors({ ...formErrors, email: "" });
              }}
              className={formErrors.email ? "border-red-500" : ""}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="phone" className="text-left">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="col-span-1 xl:col-span-3"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="address" className="text-left">
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="col-span-1 xl:col-span-3"
            placeholder="123 Main St, City, Country"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="status" className="text-left">
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: "active" | "checked-out") =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger id="status" className="col-span-1 xl:col-span-3">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Guest</SelectItem>
              <SelectItem value="checked-out">Checked Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
