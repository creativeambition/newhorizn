"use client";

import { PlusCircle, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import EditRoomForm from "@/components/rooms/edit-room-form";
import { ManageRoomSheet } from "@/components/rooms/manage-room-sheet";
import { RoomForm } from "@/components/rooms/room-form";
import { RoomsTable } from "@/components/rooms/rooms-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAppContext } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import { Room } from "@/lib/types";
import { sanitizeFilename } from "@/lib/utils";

export default function RoomsPage() {
  const { rooms, addRoom, updateRoom, deleteRoom, PAGINATION } =
    useAppContext();

  const [roomFormDialog, setRoomFormDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newRoom, setNewRoom] = useState<Omit<Room, "id">>({
    name: "",
    type: "",
    capacity: 0,
    availableBeds: 0,
    amenities: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [managingRoom, setManagingRoom] = useState<Room | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const handleManageRoom = (room: Room) => {
    setManagingRoom(room);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newRoom.name) {
      errors.name = "Room name is required";
    }
    if (!newRoom.type) {
      errors.type = "Room type is required";
    }
    if (!newRoom.capacity) {
      errors.capacity = "Capacity is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const { user } = useAuth();

  const handleAddRoom = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // upload selected files (if any) to storage and attach URLs to room.media
      let mediaItems: { url: string; title?: string; description?: string }[] =
        [];
      if (selectedFiles.length > 0) {
        try {
          const supabase = createClient();
          const id = user?.id;
          if (id) {
            for (const file of selectedFiles) {
              const sanitizedName = sanitizeFilename(file.name);
              const filePath = `rooms/${Date.now()}_${sanitizedName}`;
              const { error } = await supabase.storage
                .from(SUPABASE_CONFIG.STORAGE_BUCKET)
                .upload(`${id}/${filePath}`, file);

              if (error) throw error;

              const {
                data: { publicUrl },
              } = supabase.storage
                .from(SUPABASE_CONFIG.STORAGE_BUCKET)
                .getPublicUrl(`${id}/${filePath}`);

              mediaItems.push({ url: publicUrl, title: file.name });
            }
          }
        } catch (e) {
          console.error("Failed to upload media:", e);
        }
      }

      const payload: Omit<Room, "id"> = {
        ...newRoom,
        media: mediaItems,
      };

      const result = await addRoom(payload);
      if (result) {
        toast({
          title: "Success",
          description: "Room added successfully",
        });

        setNewRoom({
          name: "",
          type: "",
          capacity: 0,
          availableBeds: 0,
          amenities: [],
        });
        setSelectedFiles([]);
        setRoomFormDialog(false);
      }
    } catch (error) {
      console.error("Failed to add room:", error);
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRoom = async (room: Room, stayOpen = false) => {
    setIsSubmitting(true);
    try {
      const result = await updateRoom(room);
      if (result) {
        toast({
          title: "Success",
          description: "Room updated successfully",
        });
        if (!stayOpen) {
          setManagingRoom(null);
          setEditingRoom(null);
        }
      }
    } catch (error) {
      console.error("Failed to update room:", error);
      toast({
        title: "Error",
        description: "Failed to update room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteRoom = async (id: string) => {
    try {
      setIsSubmitting(true);
      const result = await deleteRoom(id);
      if (result) {
        toast({
          title: "Success",
          description: "Room deleted successfully",
        });
        setManagingRoom(null);
      }
    } catch (error) {
      console.error("Failed to delete room:", error);
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [currentPagination, setCurrentPagination] = useState(0);

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="relative w-full p-3 md:p-6 lg:px-10">
      <div className="grid gap-6">
        <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
            <p className="text-muted-foreground">
              Manage your accommodation rooms and beds
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search rooms..."
                className="w-full sm:w-50 md:w-75 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Dialog
              open={roomFormDialog}
              onOpenChange={(open) => {
                if (!isSubmitting) setRoomFormDialog(open);
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>

              <RoomForm
                newRoom={newRoom}
                setNewRoom={setNewRoom}
                onSubmit={handleAddRoom}
                formErrors={formErrors}
                onErrorClear={(field) =>
                  setFormErrors((prev) => ({ ...prev, [field]: "" }))
                }
                isSubmitting={isSubmitting}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />
            </Dialog>
          </div>
        </div>

        <ManageRoomSheet
          room={managingRoom}
          open={!!managingRoom}
          onOpenChange={(open) => !open && setManagingRoom(null)}
          onUpdateRoom={handleUpdateRoom}
          onDeleteRoom={handleConfirmDeleteRoom}
          isSubmitting={isSubmitting}
        />

        <Dialog
          open={!!editingRoom}
          onOpenChange={(open) => !open && setEditingRoom(null)}
        >
          <DialogContent className="sm:max-w-md md:max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader className="text-left">
              <DialogTitle>Edit Room Details</DialogTitle>
              <DialogDescription>
                Make changes to your room information here.
              </DialogDescription>
            </DialogHeader>
            {editingRoom && (
              <EditRoomForm
                room={editingRoom}
                onClose={() => setEditingRoom(null)}
                onSubmit={handleUpdateRoom}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="all" className="overflow-x-auto">
          <TabsList className="w-full overflow-x-auto flex sm:w-auto justify-start md:justify-center">
            <TabsTrigger onClick={() => setCurrentPagination(0)} value="all">
              All Rooms
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setCurrentPagination(0)}
              value="available"
            >
              Available
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setCurrentPagination(0)}
              value="general"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              onClick={() => setCurrentPagination(0)}
              value="private"
            >
              Private Rooms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <RoomsTable
              rooms={filteredRooms}
              currentPagination={currentPagination}
              PAGINATION={PAGINATION}
              onPageChange={setCurrentPagination}
              showType={true}
              onUpdateRoom={handleManageRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleManageRoom}
              onConfigurePricing={handleManageRoom}
              onManageMedia={handleManageRoom}
            />
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <RoomsTable
              rooms={filteredRooms.filter((room) => room.type === "general")}
              currentPagination={currentPagination}
              PAGINATION={PAGINATION}
              onPageChange={setCurrentPagination}
              onUpdateRoom={handleManageRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleManageRoom}
              onConfigurePricing={handleManageRoom}
              onManageMedia={handleManageRoom}
            />
          </TabsContent>

          <TabsContent value="private" className="space-y-4">
            <RoomsTable
              rooms={filteredRooms.filter((room) => room.type === "private")}
              currentPagination={currentPagination}
              PAGINATION={PAGINATION}
              onPageChange={setCurrentPagination}
              onUpdateRoom={handleManageRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleManageRoom}
              onConfigurePricing={handleManageRoom}
              onManageMedia={handleManageRoom}
            />
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <RoomsTable
              rooms={filteredRooms.filter((room) => room.availableBeds > 0)}
              currentPagination={currentPagination}
              PAGINATION={PAGINATION}
              onPageChange={setCurrentPagination}
              showType={true}
              onUpdateRoom={handleManageRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleManageRoom}
              onConfigurePricing={handleManageRoom}
              onManageMedia={handleManageRoom}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
