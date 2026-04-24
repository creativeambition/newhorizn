import { Room } from "@/lib/types";
import { Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface DeleteRoomDialogProps {
  room: Room | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isSubmitting: boolean;
}

function DeleteRoomDialog({
  room,
  onClose,
  onConfirm,
  isSubmitting,
}: DeleteRoomDialogProps) {
  return (
    <Dialog open={room !== null} onOpenChange={onClose}>
      {room && (
        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm room delete?</DialogTitle>
            <DialogDescription>
              This will permanently delete room <b>&quot;{room.name}&quot;</b>{" "}
              and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(room.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader className="animate-spin mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default DeleteRoomDialog;
