import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Room } from "@/lib/types";
import { DialogClose } from "@radix-ui/react-dialog";
import clsx from "clsx";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RoomFormProps {
  newRoom: Omit<Room, "id">;
  setNewRoom: (room: Omit<Room, "id">) => void;
  onSubmit: () => void;
  formErrors: Record<string, string>;
  onErrorClear: (field: string) => void;
  isSubmitting: boolean;
  selectedFiles?: File[];
  setSelectedFiles?: (files: File[]) => void;
}

export function RoomForm({
  newRoom,
  setNewRoom,
  onSubmit,
  formErrors,
  onErrorClear,
  isSubmitting,
  selectedFiles,
  setSelectedFiles,
}: RoomFormProps) {
  return (
    <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
      <DialogHeader className="text-left">
        <DialogTitle>Add New Room</DialogTitle>
        <DialogDescription>
          Enter the room details to add it to your inventory.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4 px-1">
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="room-name" className="text-left">
            Name
          </Label>
          <div className="col-span-1 xl:col-span-3">
            <Input
              id="room-name"
              placeholder="Room 1"
              value={newRoom.name}
              onChange={(e) => {
                setNewRoom({ ...newRoom, name: e.target.value });
                onErrorClear("name");
              }}
              className={clsx(formErrors.name && "border-red-500")}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <div className="flex items-center gap-1">
            <Label htmlFor="room-type" className="text-left">
              Type
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Room type info</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" side="right" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium leading-none mb-2">
                      Room Types
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Choose the type that best describes your room.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="rounded-md bg-muted p-2">
                      <p className="text-sm font-semibold">General/Shared</p>
                      <p className="text-xs text-muted-foreground">
                        Multiple guests or students can book individual beds in
                        this room. Best for dorms or shared hostels.
                      </p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="text-sm font-semibold">Private Room</p>
                      <p className="text-xs text-muted-foreground">
                        The entire room is booked by one guest or group. Best
                        for studios, hotel rooms, or private apartments.
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-1 xl:col-span-3">
            <Select
              value={newRoom.type}
              onValueChange={(value) => {
                setNewRoom({
                  ...newRoom,
                  type: value,
                  capacity: value === "private" ? 1 : newRoom.capacity,
                });
                onErrorClear("type");
              }}
            >
              <SelectTrigger id="room-type">
                <SelectValue
                  className={clsx(formErrors.type && "border-red-500")}
                  placeholder="Select room type"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General/Shared</SelectItem>
                <SelectItem value="private">Private Room</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.type && (
              <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="capacity" className="text-left">
            Capacity
          </Label>
          <div className="col-span-1 xl:col-span-3">
            <Input
              id="capacity"
              type="number"
              min={1}
              max={15}
              value={newRoom.capacity || ""}
              placeholder="0"
              disabled={newRoom.type === "private"}
              onChange={(e) =>
                setNewRoom({
                  ...newRoom,
                  capacity: e.target.value === "" ? 0 : Number.parseInt(e.target.value),
                })
              }
            />
            {formErrors.capacity && (
              <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>
            )}
          </div>
        </div>
        {newRoom.type === "private" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
            <Label htmlFor="beds" className="text-left">
              Beds
            </Label>
            <div className="col-span-1 xl:col-span-3">
              <Input
                id="beds"
                type="number"
                min={1}
                max={15}
                value={newRoom.beds || ""}
                placeholder="Number of beds"
                onChange={(e) =>
                  setNewRoom({
                    ...newRoom,
                    beds: e.target.value === "" ? 0 : Number.parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="amenities" className="text-left">
            Amenities
          </Label>
          <Input
            id="amenities"
            value={newRoom.amenities}
            onChange={(e) =>
              setNewRoom({ ...newRoom, amenities: e.target.value.split(",") })
            }
            placeholder="Wi-Fi, Lockers, Air Conditioning"
            className="col-span-1 xl:col-span-3"
          />
        </div>
      </div>

      <DialogFooter className="flex-col-reverse xl:flex-row gap-2">
        <DialogClose asChild>
          <Button
            variant="outline"
            disabled={isSubmitting}
            className="w-full xl:w-auto"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full xl:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Room...
            </>
          ) : (
            "Add Room"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
