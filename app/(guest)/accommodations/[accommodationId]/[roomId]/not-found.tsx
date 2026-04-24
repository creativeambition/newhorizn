import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Listing Not Found</h1>
      <p className="text-muted-foreground">This listing doesn't exist or is no longer available</p>
      <Link href="/accommodations">
        <Button>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>
      </Link>
    </div>
  );
}
