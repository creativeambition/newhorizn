"use client";

import { useState, useEffect } from "react";
import { Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";
import { PricingConfigDialog } from "./pricing-config-dialog";
import RoomMediaManager from "../media/room-media-manager";
import DeleteRoomDialog from "./delete-room-dialog";

interface ManageRoomSheetProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRoom: (room: Room, stayOpen?: boolean) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ManageRoomSheet({
  room,
  open,
  onOpenChange,
  onUpdateRoom,
  onDeleteRoom,
  isSubmitting,
}: ManageRoomSheetProps) {
  const [activeTab, setActiveTab] = useState("media");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [description, setDescription] = useState(room?.description || "");
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);

  // Update local state when room changes
  useEffect(() => {
    if (room?.description !== description) {
      setDescription(room?.description || "");
    }
  }, [room?.description]);

  if (!room) return null;

  const handleDescriptionUpdate = async () => {
    if (description === room.description) return;

    setIsUpdatingDescription(true);
    try {
      await onUpdateRoom({ ...room, description }, true);
    } catch (error) {
      console.error("Failed to update description:", error);
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 overflow-y-auto">
        {/* Sticky Header */}
        <div className="border-b bg-background sticky top-0 z-10">
          <SheetHeader className="px-6 pt-6 pb-5 max-sm:text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 w-full">
                <SheetTitle className="text-xl font-semibold">
                  {room.name}
                </SheetTitle>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="px-6 pb-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 h-10 w-full bg-muted">
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Media
                </TabsTrigger>

                <TabsTrigger
                  value="pricing"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Pricing
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Scrollable Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          {/* Media */}
          <TabsContent value="media" className="px-6 pb-6 mt-0">
            <div className="mb-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionUpdate}
                placeholder="Add a description for this room..."
                className="min-h-5 resize-none"
                disabled={isUpdatingDescription}
              />
            </div>

            <RoomMediaManager
              key={room.id}
              room={room}
              onClose={() => onOpenChange(false)}
              onSave={async (media) => {
                await onUpdateRoom({ ...room, media }, true);
              }}
            />
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="px-6 pb-3 mt-0 space-y-6">
            <PricingConfigDialog
              room={room}
              onSave={onUpdateRoom}
              isSubmitting={isSubmitting}
            />
          </TabsContent>
        </Tabs>

        {/* Sticky Danger Zone */}
        <div className="border-t bg-background px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Deleting this room permanently removes its data.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Room
            </Button>
          </div>
        </div>

        <DeleteRoomDialog
          room={showDeleteDialog ? room : null}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={async (id) => {
            await onDeleteRoom(id);
            setShowDeleteDialog(false);
          }}
          isSubmitting={isSubmitting ?? false}
        />
      </SheetContent>
    </Sheet>
  );
}
