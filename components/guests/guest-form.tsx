import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NewGuestData } from "@/lib/types";
import { Loader } from "lucide-react";

interface GuestFormProps {
  newGuest: NewGuestData;
  formErrors: Record<string, string>;
  onSubmit: () => void;
  onChange: (field: keyof NewGuestData, value: string) => void;
  onErrorClear: (field: string) => void;
  isLoading?: boolean;
}

const GuestForm = ({
  newGuest,
  formErrors,
  onSubmit,
  onChange,
  onErrorClear,
  isLoading = false,
}: GuestFormProps) => {
  return (
    <DialogContent className="max-h-screen overflow-y-auto">
      <DialogHeader className="text-left">
        <DialogTitle>Add New Guest</DialogTitle>
        <DialogDescription>
          Enter the guest's details to register them in the system.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="name" className="text-left">
            Name*
          </Label>
          <div className="col-span-1 xl:col-span-3">
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={newGuest.name}
              onChange={(e) => {
                onChange("name", e.target.value);
                onErrorClear("name");
              }}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="phone" className="text-left">
            Phone*
          </Label>
          <div className="col-span-1 xl:col-span-3">
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={newGuest.phone}
              onChange={(e) => {
                onChange("phone", e.target.value);
                onErrorClear("phone");
              }}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
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
              placeholder="email@example.com"
              value={newGuest.email}
              onChange={(e) => {
                onChange("email", e.target.value);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="address" className="text-left">
            Address
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main St, City, Country"
            value={newGuest.address}
            onChange={(e) => onChange("address", e.target.value)}
            className="col-span-1 xl:col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Add Guest
            </>
          ) : (
            "Add Guest"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default GuestForm;
