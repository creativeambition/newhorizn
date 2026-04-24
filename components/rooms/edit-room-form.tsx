import { Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditRoomFormProps {
  room: Room;
  onClose: () => void;
  onSubmit: (room: Room) => Promise<void>;
  isSubmitting?: boolean;
}

function EditRoomForm({
  room,
  onClose,
  onSubmit,
  isSubmitting,
}: EditRoomFormProps) {
  const [editedRoom, setEditedRoom] = useState<Room>(room);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="room-name" className="xl:text-right">
            Name
          </Label>
          <Input
            id="room-name"
            value={editedRoom.name}
            onChange={(e) =>
              setEditedRoom({ ...editedRoom, name: e.target.value })
            }
            className="col-span-1 xl:col-span-3"
          />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <div className="flex items-center gap-1 xl:justify-end">
            <Label htmlFor="room-type" className="xl:text-right">
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
          <Select
            value={editedRoom.type}
            onValueChange={(value) =>
              setEditedRoom({
                ...editedRoom,
                type: value,
                capacity: value === "private" ? 1 : editedRoom.capacity,
              })
            }
          >
            <SelectTrigger
              id="room-type"
              className="col-span-1 xl:col-span-3"
            >
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="private">Private Room</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="capacity" className="xl:text-right">
            Capacity
          </Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={editedRoom.capacity || ""}
            disabled={editedRoom.type === "private"}
            onChange={(e) =>
              setEditedRoom({
                ...editedRoom,
                capacity: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            className="col-span-1 xl:col-span-3"
          />
        </div>
        {editedRoom.type === "private" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
            <Label htmlFor="beds" className="xl:text-right">
              Beds
            </Label>
            <Input
              id="beds"
              type="number"
              min={1}
              value={editedRoom.beds || ""}
              placeholder="Number of beds"
              onChange={(e) =>
                setEditedRoom({
                  ...editedRoom,
                  beds: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              className="col-span-1 xl:col-span-3"
            />
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-4 items-center gap-2 xl:gap-4">
          <Label htmlFor="amenities" className="xl:text-right">
            Amenities
          </Label>
          <Input
            id="amenities"
            value={editedRoom.amenities?.join(",")}
            onChange={(e) =>
              setEditedRoom({
                ...editedRoom,
                amenities: e.target.value
                  .split(",")
                  .map((item) => item.trim()),
              })
            }
            placeholder="Wi-Fi, Lockers, Air Conditioning"
            className="col-span-1 xl:col-span-3"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse xl:flex-row gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full xl:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={async () => {
            await onSubmit(editedRoom);
          }}
          disabled={isSubmitting}
          className="w-full xl:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  );
}

export default EditRoomForm;
