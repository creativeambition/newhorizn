"use client";

import { useState, useMemo, useCallback } from "react";
import { PlusCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import GuestDetailsView from "@/components/guests/guest-details";
import GuestEditForm from "@/components/guests/guest-edit-form";
import { useAppContext } from "@/lib/context/app-context";
import { Guest } from "@/lib/types";
import { Pagination } from "@/components/pagination";
import GuestForm from "@/components/guests/guest-form";
import GuestTable from "@/components/guests/guest-table";

export default function GuestsPage() {
  const {
    guests,
    addGuest,
    updateGuest,
    deleteGuest,
    bookings,
    updateAvailableBeds,
    updateBookingStatus,
    PAGINATION,
  } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [viewGuestId, setViewGuestId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editGuestId, setEditGuestId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const filteredGuests = useMemo(() => {
    return guests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone?.includes(searchQuery),
    );
  }, [guests, searchQuery]);

  // if a guest has no booking, treat their status as null
  const guestsWithComputedStatus = useMemo(() => {
    return filteredGuests.map((guest) => {
      const hasBooking = bookings.some((b) => b.guestId === guest.id);
      return hasBooking ? guest : { ...guest, status: undefined };
    });
  }, [filteredGuests, bookings]);

  const getGuestsByTab = useCallback(
    (tab: string) => {
      switch (tab) {
        case "active":
          return guestsWithComputedStatus.filter((c) => c.status === "active");
        case "checked-out":
          return guestsWithComputedStatus.filter(
            (c) => c.status === "checked-out",
          );
        default:
          return guestsWithComputedStatus;
      }
    },
    [guestsWithComputedStatus],
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newGuest.name) {
      errors.name = "Guest name is required";
    }

    if (!newGuest.phone) {
      errors.phone = "Phone is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGuest = async () => {
    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    try {
      const status = await addGuest(newGuest);

      if ("error" in status) {
        if (status.error.toLowerCase().includes("email")) {
          setFormErrors({ email: status.error });
          toast({
            title: "Email already registered",
            description: "A guest with this email already exists.",
            variant: "destructive",
          });
        }
        return;
      }

      setFormErrors({});
      setDialogOpen(false);
      toast({
        title: "Guest added",
        description: "The guest has been added successfully.",
      });

      setNewGuest({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleViewGuest = (guestId: string) => {
    setViewGuestId(guestId);
    setViewDialogOpen(true);
  };

  const handleEditGuest = (guestId: string) => {
    setEditGuestId(guestId);
    setEditDialogOpen(true);
  };

  const handleSaveGuest = async (updatedGuest: Guest) => {
    const originalGuest = guests.find(
      (guest) => guest.id === updatedGuest.id,
    );

    if (!originalGuest) {
      toast({
        title: "Error",
        description: "Guest not found.",
        variant: "destructive",
      });
      return;
    }

    // Check if any changes were made
    const hasChanges = Object.keys(updatedGuest).some((key) => {
      return (
        updatedGuest[key as keyof Guest] !==
        originalGuest[key as keyof Guest]
      );
    });

    if (!hasChanges) {
      toast({
        title: "No changes made",
        description: "No changes were detected in the guest's information.",
      });
      setEditDialogOpen(false);
      return;
    }

    try {
      // When guest is checked out, free their bed (make it available again)
      // and mark the associated booking as completed
      if (
        updatedGuest.status === "checked-out" &&
        originalGuest.status !== "checked-out"
      ) {
        const guestBooking = bookings.find(
          (b) =>
            b.guestId === updatedGuest.id &&
            (b.status === "active" || b.status === "upcoming"),
        );
        if (guestBooking) {
          await updateAvailableBeds(guestBooking.roomId, false);
          // update booking status so it no longer appears as active/upcoming
          await updateBookingStatus(guestBooking.id, "completed");
        }
      }

      const result = await updateGuest(updatedGuest);
      if (result) {
        toast({
          title: "Guest updated",
          description:
            updatedGuest.status === "checked-out"
              ? "Guest checked out. Bed has been made available."
              : "The guest's information has been updated successfully.",
        });
        setEditDialogOpen(false);
      } else {
        throw new Error("Failed to update guest");
      }
    } catch (error) {
      console.error("Failed to update guest:", error);
      toast({
        title: "Update failed",
        description: "Failed to update guest information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteGuest(guestId);
      if (result) {
        toast({
          title: "Guest deleted",
          description: `${result.name} has been removed from the system.`,
        });
        setViewDialogOpen(false);
      } else {
        throw new Error("Failed to delete guest");
      }
    } catch (error) {
      console.error("Failed to delete guest:", error);
      toast({
        title: "Error",
        description: "Failed to delete guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get the current guest being viewed or edited
  const currentViewedGuest = guestsWithComputedStatus.find(
    (guest) => guest.id === viewGuestId,
  );
  const currentEditGuest = guestsWithComputedStatus.find(
    (guest) => guest.id === editGuestId,
  );

  const [currentPagination, setCurrentPagination] = useState(0);
  return (
    <>
      <main className="relative w-full p-3 md:p-6 lg:px-10">
        <div className="grid gap-6">
          <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Guests
              </h1>
              <p className="text-muted-foreground">
                Manage your accommodation guests
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search guests..."
                  className="w-full sm:w-50 md:w-75 pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Guest
                  </Button>
                </DialogTrigger>

                <GuestForm
                  newGuest={newGuest}
                  formErrors={formErrors}
                  onSubmit={handleAddGuest}
                  onChange={(field, value) =>
                    setNewGuest((prev) => ({ ...prev, [field]: value }))
                  }
                  onErrorClear={(field) =>
                    setFormErrors((prev) => ({ ...prev, [field]: "" }))
                  }
                  isLoading={isRegistering}
                />
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="all" className="overflow-x-auto">
            <TabsList className="w-full overflow-x-auto flex sm:w-auto justify-start md:justify-center">
              <TabsTrigger
                onClick={() => setCurrentPagination(0)}
                value="all"
                className="flex-1 sm:flex-none"
              >
                All Guests
              </TabsTrigger>
              <TabsTrigger
                onClick={() => setCurrentPagination(0)}
                value="active"
                className="flex-1 sm:flex-none"
              >
                Active Guests
              </TabsTrigger>
              <TabsTrigger
                onClick={() => setCurrentPagination(0)}
                value="checked-out"
                className="flex-1 sm:flex-none"
              >
                Checked Out
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <GuestTable
                guests={getGuestsByTab("all")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewGuest={handleViewGuest}
                onEditGuest={handleEditGuest}
                isLoading={searchQuery.length > 0 ? false : undefined}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={Math.ceil(
                        getGuestsByTab("all").length / PAGINATION,
                      )}
                      totalItems={getGuestsByTab("all").length}
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <GuestTable
                guests={getGuestsByTab("active")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewGuest={handleViewGuest}
                onEditGuest={handleEditGuest}
                isLoading={searchQuery.length > 0 ? false : undefined}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={Math.ceil(
                        getGuestsByTab("active").length / PAGINATION,
                      )}
                      totalItems={getGuestsByTab("active").length}
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>

            <TabsContent value="checked-out" className="space-y-4">
              <GuestTable
                guests={getGuestsByTab("checked-out")}
                currentPagination={currentPagination}
                paginationSize={PAGINATION}
                onViewGuest={handleViewGuest}
                onEditGuest={handleEditGuest}
                isLoading={searchQuery.length > 0 ? false : undefined}
                footer={
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Pagination
                      currentPage={currentPagination}
                      totalPages={Math.ceil(
                        getGuestsByTab("checked-out").length / PAGINATION,
                      )}
                      totalItems={getGuestsByTab("checked-out").length}
                      pageSize={PAGINATION}
                      onPageChange={setCurrentPagination}
                    />
                  </CardFooter>
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Guest Details Dialog */}
      {currentViewedGuest && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <GuestDetailsView
            guest={currentViewedGuest}
            guestBookings={bookings
              .filter((b) => b.guestId === currentViewedGuest.id)
              .sort((a, b) => {
                const order = { active: 0, upcoming: 1, completed: 2 };
                return (
                  (order[a.status as keyof typeof order] ?? 3) -
                  (order[b.status as keyof typeof order] ?? 3)
                );
              })}
            onClose={() => setViewDialogOpen(false)}
            onEdit={handleEditGuest}
            onDelete={handleDeleteGuest}
            isDeleting={isDeleting}
          />
        </Dialog>
      )}

      {/* Guest Edit Dialog */}
      {currentEditGuest && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <GuestEditForm
            guest={currentEditGuest}
            onSave={handleSaveGuest}
            onClose={() => setEditDialogOpen(false)}
          />
        </Dialog>
      )}
    </>
  );
}
