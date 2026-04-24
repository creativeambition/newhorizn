import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateAvailableBeds } from "@/lib/helpers/room-availability";
import { Room } from "@/lib/types";
import {
  DoorClosed,
  Info,
  Pen,
  Settings
} from "lucide-react";

interface RoomsTableProps {
  rooms: Room[];
  currentPagination: number;
  PAGINATION: number;
  onPageChange: (page: number) => void;
  showType?: boolean;
  onUpdateRoom: (room: Room) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onConfigurePricing: (room: Room) => void;
  onManageMedia: (room: Room) => void;
}

import { useAppContext } from "@/lib/context/app-context";
import { Loading } from "../loading";

export function RoomsTable({
  rooms,
  currentPagination,
  PAGINATION,
  onPageChange,
  showType = false,
  onUpdateRoom,
  onEditRoom,
  onDeleteRoom,
  onConfigurePricing,
  onManageMedia,
}: RoomsTableProps) {
  const { isLoading, bookings } = useAppContext();

  return isLoading ? (
    <Loading />
  ) : rooms.length > 0 ? (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Available Beds</TableHead>
              <TableHead>Amenities</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rooms
              .slice(
                currentPagination * PAGINATION,
                currentPagination * PAGINATION + PAGINATION,
              )
              .map((room) => {
                const availableBeds = calculateAvailableBeds(
                  room,
                  bookings || [],
                );
                const upcomingBookings = (bookings || []).filter(
                  (b) =>
                    b.roomId === room.id &&
                    b.status === "upcoming" &&
                    b.checkIn &&
                    new Date(b.checkIn).getTime() > Date.now(),
                );
                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="capitalize">{room.type}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {room.type === "private" && room.beds && (
                          <span className="text-xs text-muted-foreground">
                            ({room.beds} beds)
                          </span>
                        )}

                        {upcomingBookings.length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 hover:bg-transparent flex items-center gap-2 group"
                              >
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors group-hover:opacity-80 ${availableBeds > 0 &&
                                    availableBeds <= room.capacity / 2
                                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : availableBeds
                                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    }`}
                                >
                                  {availableBeds} / {room.capacity}
                                </span>
                                <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 overflow-hidden rounded-xl border border-border/50 shadow-2xl backdrop-blur-xl bg-popover/95">
                              <div className="p-4 border-b border-border/50 bg-muted/30">
                                <h4 className="font-bold text-sm leading-none text-foreground">Upcoming Bookings</h4>
                                <p className="text-xs text-muted-foreground mt-1.5">Scheduled arrivals for {room.name}</p>
                              </div>
                              <div className="p-2">
                                {upcomingBookings.slice(0, 5).map((b, i) => (
                                  <div key={i} className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-sm font-semibold text-foreground">{b.guestName}</p>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                        {b.bookingType}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                                {upcomingBookings.length > 5 && (
                                  <div className="p-2 text-center border-t border-border/50 mt-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                      +{upcomingBookings.length - 5} more bookings
                                    </p>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${availableBeds > 0 &&
                              availableBeds <= room.capacity / 2
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : availableBeds
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                          >
                            {availableBeds} / {room.capacity}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Amenities column */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities?.slice(0, 2).map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          >
                            {amenity}
                          </span>
                        ))}
                        {room.amenities?.length > 2 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            +{room.amenities.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditRoom(room)}
                        >
                          <Pen className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onUpdateRoom(room)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4">
        <Pagination
          currentPage={currentPagination}
          totalPages={Math.ceil(rooms.length / PAGINATION)}
          totalItems={rooms.length}
          pageSize={PAGINATION}
          onPageChange={onPageChange}
        />
      </CardFooter>
    </Card>
  ) : (
    <div className="flex h-75 flex-col items-center justify-center gap-2">
      <DoorClosed className="h-8 w-8 text-muted-foreground" />
      <p className="text-lg font-medium text-muted-foreground">
        No rooms found
      </p>
      <p className="text-sm text-muted-foreground">
        Add a new room to get started
      </p>
    </div>
  );
}
