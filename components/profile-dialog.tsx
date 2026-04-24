"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/context/auth-context";
import { supabase } from "@/lib/supabase/client";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import { Accommodation } from "@/lib/types";
import { cn, sanitizeFilename } from "@/lib/utils";
import clsx from "clsx";
import {
  AlertCircle,
  CameraIcon,
  CheckCircle2,
  Loader,
  Loader2,
  Mail,
  MapPin,
  Pen,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { toast } = useToast();

  const [accommodationInfo, setAccommodationInfo] = useState<
    Omit<Accommodation, "owner_id">
  >({
    id: "",
    accommodationName: "",
    address: "",
    phone: "",
    manager: "",
    email: "",
    managerImage: "",
    isVerified: false,
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { user, accommodationData } = useAuth();

  useEffect(() => {
    if (accommodationData) {
      setAccommodationInfo({
        id: accommodationData.id,
        accommodationName: accommodationData.accommodationName,
        address: accommodationData.address,
        phone: accommodationData.phone,
        manager: accommodationData.manager,
        email: accommodationData.email,
        listingType: accommodationData.listingType,
        isVerified: accommodationData.isVerified,
        managerImage: accommodationData.managerImage,
      });
    }
  }, [accommodationData]);

  const saveProfileChanges = async () => {
    setIsEditMode(false);
    setIsSaving(true);
    try {
      // Using global supabase singleton
      const { error } = await supabase
        .from("accommodations")
        .update({
          accommodationName: accommodationInfo.accommodationName,
          address: accommodationInfo.address,
          phone: accommodationInfo.phone,
          manager: accommodationInfo.manager,
          managerImage: accommodationInfo.managerImage,
        })
        .eq("owner_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check plan-specific limits (using standard high limit if plan logic removed)
    const maxImageBytes = 10485760; // 10MB default
    if (file.size > maxImageBytes) {
      toast({
        title: "File too large",
        description: `Images must be under 10 MB.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Delete old image if it exists
      if (accommodationInfo.managerImage) {
        try {
          const oldUrl = new URL(accommodationInfo.managerImage);
          const pathSegments = oldUrl.pathname.split("/");
          // The path in the bucket is typically after /public/bucket-name/
          // URL format: https://.../storage/v1/object/public/bucket-name/user-id/profile/filename
          const publicIndex = pathSegments.indexOf("public");
          if (publicIndex !== -1 && pathSegments.length > publicIndex + 2) {
            const bucketName = pathSegments[publicIndex + 1];
            if (bucketName === SUPABASE_CONFIG.STORAGE_BUCKET) {
              const oldPath = pathSegments.slice(publicIndex + 2).join("/");
              await supabase.storage
                .from(SUPABASE_CONFIG.STORAGE_BUCKET)
                .remove([decodeURIComponent(oldPath)]);
            }
          }
        } catch (e) {
          console.error("Failed to parse or delete old image:", e);
        }
      }

      const sanitizedName = sanitizeFilename(file.name);
      const filePath = `profile/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(SUPABASE_CONFIG.STORAGE_BUCKET)
        .upload(`${user.id}/${filePath}`, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from(SUPABASE_CONFIG.STORAGE_BUCKET)
        .getPublicUrl(`${user.id}/${filePath}`);

      setAccommodationInfo((prev) => ({
        ...prev,
        managerImage: publicUrl,
      }));

      // Update in DB immediately so it sticks for all plans
      const { error: dbError } = await supabase
        .from("accommodations")
        .update({
          managerImage: publicUrl,
        })
        .eq("owner_id", user.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Profile image updated successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload profile image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-screen overflow-y-auto">
        <DialogHeader className="text-left mb-3">
          <DialogTitle>Account Profile</DialogTitle>
          <DialogDescription>
            View and manage your account information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="relative size-16 shrink-0">
              <AvatarImage
                src={accommodationInfo.managerImage}
                className="object-cover h-full w-full rounded-full"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-medium">
                {accommodationInfo.accommodationName
                  ? accommodationInfo.accommodationName[0].toUpperCase()
                  : "X"}
              </AvatarFallback>

              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleProfileImageUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <CameraIcon className="h-5 w-5 text-white" />
                )}
              </label>
            </Avatar>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-3 w-full">
                <Input
                  value={accommodationInfo.accommodationName}
                  tabIndex={isEditMode ? 0 : -1}
                  onChange={(e) =>
                    setAccommodationInfo((prev) => ({
                      ...prev,
                      accommodationName: e.target.value,
                    }))
                  }
                  readOnly={!isEditMode}
                  placeholder="Accommodation Name"
                  className={cn(
                    "text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 w-full min-w-0 sm:min-w-50",
                    !isEditMode ? "bg-transparent" : "bg-muted p-2",
                  )}
                />
                {accommodationInfo.isVerified ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 shrink-0 bg-success/10 text-success hover:bg-success/20 border border-success/20"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-muted-foreground font-normal"
                  >
                    Unverified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={accommodationInfo.address}
                  tabIndex={isEditMode ? 0 : -1}
                  onChange={(e) =>
                    setAccommodationInfo((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  readOnly={!isEditMode}
                  placeholder="Address"
                  className={cn(
                    "text-sm border-0 p-0 h-auto focus-visible:ring-0",
                    !isEditMode ? "bg-transparent" : "bg-muted p-2",
                  )}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={accommodationInfo.phone}
                  tabIndex={isEditMode ? 0 : -1}
                  onChange={(e) =>
                    setAccommodationInfo((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Phone Number"
                  readOnly={!isEditMode}
                  className={cn(
                    "text-sm border-0 p-0 h-auto focus-visible:ring-0",
                    !isEditMode ? "bg-transparent" : "bg-muted p-2",
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">
                  {accommodationData?.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={accommodationInfo.manager}
                  tabIndex={isEditMode ? 0 : -1}
                  onChange={(e) =>
                    setAccommodationInfo((prev) => ({
                      ...prev,
                      manager: e.target.value,
                    }))
                  }
                  placeholder="Manager"
                  readOnly={!isEditMode}
                  className={cn(
                    "text-sm border-0 p-0 h-auto focus-visible:ring-0",
                    !isEditMode ? "bg-transparent" : "bg-muted p-2",
                  )}
                />
              </div>
            </div>
          </div>

          <footer className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={saveProfileChanges}
                  className="gap-2 w-full sm:w-auto"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Pen className="h-4 w-4" />
                  Edit Profile
                </Button>
              </>
            )}
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
