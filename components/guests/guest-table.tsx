import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Guest } from "@/lib/types";
import { Eye, Pencil, UserX2 } from "lucide-react";
import { ReactNode } from "react";

interface GuestTableProps {
  guests: Guest[];
  currentPagination: number;
  paginationSize: number;
  onViewGuest: (id: string) => void;
  onEditGuest: (id: string) => void;
  showInstitution?: boolean;
  footer: ReactNode;
  isLoading?: boolean;
}

import { useAppContext } from "@/lib/context/app-context";
import { Loading } from "../loading";

const GuestTable = ({
  guests,
  currentPagination,
  paginationSize,
  onViewGuest,
  onEditGuest,
  footer,
  isLoading: isLoadingProp,
}: GuestTableProps) => {
  const { isLoading: contextLoading } = useAppContext();
  const isLoading = isLoadingProp ?? contextLoading;

  return isLoading ? (
    <Loading />
  ) : guests.length > 0 ? (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {guests
                .slice(
                  currentPagination * paginationSize,
                  currentPagination * paginationSize + paginationSize,
                )
                .map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.email || "-"}</TableCell>
                    <TableCell>{guest.phone || "-"}</TableCell>
                    <TableCell>{guest.address || "-"}</TableCell>
                    <TableCell>
                      {guest.status ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            guest.status === "active"
                              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {guest.status === "active"
                            ? "Active Guest"
                            : "Checked Out"}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="sticky text-end right-0 bg-linear-to-r from-transparent to-background">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewGuest(guest.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditGuest(guest.id)}
                        className="ml-3"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {footer}
    </Card>
  ) : (
    <div className="flex h-75 flex-col items-center justify-center gap-2">
      <UserX2 className="h-8 w-8 text-muted-foreground" />
      <p className="text-lg font-medium text-muted-foreground">
        No guests found
      </p>
      <p className="text-sm text-muted-foreground">
        Add a new guest to get started
      </p>
    </div>
  );
};

export default GuestTable;
