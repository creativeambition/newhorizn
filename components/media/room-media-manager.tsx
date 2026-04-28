"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash,
  UploadCloud,
  X as XIcon,
  ImageIcon,
  VideoIcon,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Room, DEFAULT_MEDIA_LIMITS } from "@/lib/types";
import { useAuth } from "@/lib/context/auth-context";
import Link from "next/link";
import { Label } from "../ui/label";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import { sanitizeFilename } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type MediaItem = {
  url: string;
  title?: string;
  description?: string;
  mediaType?: "image" | "video";
};

interface RoomMediaManagerProps {
  room: Room;
  onSave: (media: MediaItem[]) => Promise<void>;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${Math.round(bytes / 1_048_576)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function isUnlimited(n: number) {
  return n >= 999_999;
}

export default function RoomMediaManager({
  room,
  onSave,
  onClose,
}: RoomMediaManagerProps) {
  const [items, setItems] = useState<MediaItem[]>(room.media || []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const { user, accommodationData } = useAuth();
  const limits = accommodationData?.globalConfig?.mediaLimits || DEFAULT_MEDIA_LIMITS;

  const imageCount = items.filter((i) => i.mediaType !== "video").length;
  const videoCount = items.filter((i) => i.mediaType === "video").length;

  const imagesFull = imageCount >= limits.photosPerRoom;
  const videosFull =
    limits.videosPerRoom === 0 || videoCount >= limits.videosPerRoom;
  const allFull = imagesFull && videosFull;

  const acceptAttr = ["image/*", limits.videosPerRoom > 0 ? "video/*" : ""]
    .filter(Boolean)
    .join(",");

  const handleFileChange = (chosen: File | null) => {
    setFileError(null);
    if (!chosen) {
      setFile(null);
      setFileType(null);
      setPreview(null);
      return;
    }

    const isImage = chosen.type.startsWith("image/");
    const isVideo = chosen.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setFileError("Only image and video files are supported.");
      return;
    }

    if (isVideo && limits.videosPerRoom === 0) {
      setFileError("Video uploads are not permitted.");
      return;
    }

    if (isImage && imagesFull) {
      setFileError(
        isUnlimited(limits.photosPerRoom)
          ? "Image limit reached."
          : `You've reached the ${limits.photosPerRoom}-photo limit.`,
      );
      return;
    }

    if (isVideo && videosFull) {
      setFileError(
        `You've reached the ${limits.videosPerRoom}-video limit.`,
      );
      return;
    }

    const maxBytes = isImage ? limits.maxImageBytes : limits.maxVideoBytes;
    if (chosen.size > maxBytes) {
      setFileError(
        `File too large. ${isImage ? "Images" : "Videos"} must be under ${formatBytes(maxBytes)}.`,
      );
      return;
    }

    setFile(chosen);
    setFileType(isImage ? "image" : "video");
    setPreview(isImage ? URL.createObjectURL(chosen) : null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileType) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const id = user?.id;
      if (id) {
        const sanitizedName = sanitizeFilename(file.name);
        const filePath = `rooms/${room.id}/${Date.now()}_${sanitizedName}`;

        const { data, error } = await supabase.storage
          .from(SUPABASE_CONFIG.STORAGE_BUCKET)
          .upload(`${id}/${filePath}`, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from(SUPABASE_CONFIG.STORAGE_BUCKET)
          .getPublicUrl(`${id}/${filePath}`);

        const newItem: MediaItem = {
          url: publicUrl,
          title: title || file.name,
          description,
          mediaType: fileType,
        };
        const updated = [newItem, ...items];
        setItems(updated);
        onSave(updated);

        setTitle("");
        setDescription("");
        setFile(null);
        setFileType(null);
        setPreview(null);
        setFileError(null);
      }
    } catch (e) {
      console.error("Failed to upload media", e);
      setFileError(
        `Failed to upload media: ${e instanceof Error ? e.message : "Please try again."}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const itemToRemove = items[index];
    if (!itemToRemove) return;

    try {
      // 1. Extract path from public URL
      // Format: .../storage/v1/object/public/bucket/user_id/rooms/room_id/filename
      const bucketFullPart = `/public/${SUPABASE_CONFIG.STORAGE_BUCKET}/`;
      const parts = itemToRemove.url.split(bucketFullPart);
      const filePath = parts.length > 1 ? parts[1] : null;

      if (filePath) {
        const supabase = createClient();
        const { error } = await supabase.storage
          .from(SUPABASE_CONFIG.STORAGE_BUCKET)
          .remove([filePath]);

        if (error) {
          console.error("Storage deletion error:", error);
          // We continue even if storage delete fails to keep DB in sync
        }
      }

      // 2. Update state and DB
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      onSave(updated);

      toast({
        title: "Media deleted",
        description: "The photo/video has been removed.",
      });
    } catch (e) {
      console.error("Failed to remove media:", e);
      toast({
        title: "Error",
        description: "Failed to delete media. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-0 bg-transparent">
        <CardHeader className="p-1 py-2">
          <CardTitle className="text-base! font-medium">Upload media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0!">
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3">
            {/* Drop zone */}
            <label
              className={[
                "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
                allFull
                  ? "cursor-not-allowed opacity-50 border-muted-foreground/20 bg-muted/20"
                  : dragging
                    ? "cursor-pointer border-primary bg-primary/5"
                    : "cursor-pointer border-muted-foreground/25 bg-muted/40 hover:border-primary/50 hover:bg-muted/60",
              ].join(" ")}
              onDragOver={(e) => {
                if (allFull) return;
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (allFull) return;
                handleFileChange(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <input
                type="file"
                accept={acceptAttr}
                className="sr-only"
                disabled={allFull}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />

              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="preview"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-50">{file?.name}</span>
                    <button
                      type="button"
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFileChange(null);
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : file && fileType === "video" ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <VideoIcon className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                    <VideoIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-50">{file.name}</span>
                    <button
                      type="button"
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFileChange(null);
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    {allFull ? (
                      <p className="text-sm font-medium text-muted-foreground">
                        Upload limit reached
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Drag &amp; drop or{" "}
                          <span className="text-primary underline underline-offset-2">
                            browse
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {limits.videosPerRoom > 0
                            ? `Images up to ${formatBytes(limits.maxImageBytes)} · Videos up to ${formatBytes(limits.maxVideoBytes)}`
                            : `PNG, JPG, WEBP up to ${formatBytes(limits.maxImageBytes)}`}
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </label>

            <div className="">
              <Label>Title*</Label>
              <Input
                required
                placeholder="eg: Kitchen, Bathroom, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the media"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* File-level error */}
            {fileError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span> {fileError}</span>
              </div>
            )}

            {/* Usage counter */}
            <div className="flex max-sm:flex-col items-center justify-between text-xs text-muted-foreground whitespace-normal">
              <span>
                {isUnlimited(limits.photosPerRoom)
                  ? `${imageCount} photo${imageCount !== 1 ? "s" : ""}`
                  : `${imageCount} / ${limits.photosPerRoom} photo${limits.photosPerRoom !== 1 ? "s" : ""}`}
                {limits.videosPerRoom > 0 &&
                  (isUnlimited(limits.videosPerRoom)
                    ? ` · ${videoCount} video${videoCount !== 1 ? "s" : ""}`
                    : ` · ${videoCount} / ${limits.videosPerRoom} video${limits.videosPerRoom !== 1 ? "s" : ""}`)}
                {limits.videosPerRoom === 0 &&
                  " · Videos not permitted"}
              </span>
            </div>

            <Button
              disabled={!file || uploading || allFull}
              className="w-full sm:w-auto sm:ml-auto"
            >
              {uploading
                ? "Uploading..."
                : fileType === "video"
                  ? "Add Video"
                  : "Add Photo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl overflow-hidden bg-black aspect-video shadow-sm"
          >
            {/* Media */}
            {it.mediaType === "video" ? (
              <video
                src={it.url}
                controls
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img
                src={it.url}
                alt={it.title || "media"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Delete button */}
            <button
              className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-red-500 hover:text-white transition-all duration-200 backdrop-blur-sm"
              onClick={() => setDeleteIndex(idx)}
            >
              <Trash className="h-3.5 w-3.5" />
            </button>

            {/* Overlaid title + description */}
            <div className="absolute flex flex-col bottom-0 left-0 right-0 z-10 p-3 space-y-3">
              <input
                value={it.title || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].title = e.target.value;
                  setItems(newItems);
                }}
                onBlur={() => onSave(items)}
                placeholder="e.g. Spacious twin room with balcony"
                className="w-full bg-transparent text-white font-semibold text-base placeholder:text-white/40 border-b border-white/20 focus:border-white/60 outline-none pb-0.5 transition-colors leading-snug text-ellipsis"
              />
              <input
                value={it.description || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].description = e.target.value;
                  setItems(newItems);
                }}
                onBlur={() => onSave(items)}
                placeholder="e.g. Natural light, mountain view, ensuite bathroom"
                className="w-full bg-transparent text-white/70 text-sm placeholder:text-white/30 border-b border-white/10 focus:border-white/40 outline-none pb-0.5 transition-colors leading-snug text-ellipsis"
              />
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => !open && setDeleteIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this media from storage and remove it
              from this room. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteIndex !== null) {
                  handleRemove(deleteIndex);
                  setDeleteIndex(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
