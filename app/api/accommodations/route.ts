import { createClient } from "@/lib/supabase/server";
import type { Accommodation } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: accommodationsData, error } = await supabase
      .from("accommodations")
      .select("*")
      .eq('"isVerified"', true);

    if (error) throw error;

    const accommodations: Accommodation[] = [];

    for (const data of accommodationsData) {
      accommodations.push({
        id: data.id,
        owner_id: data.owner_id || "",
        accommodationName: data.accommodationName || "Unknown Accommodation",
        listingType: data.listingType || "hostel",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        manager: data.manager || "",
        isVerified: data.isVerified === true,
        globalConfig: data.globalConfig || null,
        description: data.description || "",
        nearbyInstitutions: data.nearbyInstitutions || [],
        isLocationVerified: data.isLocationVerified === true,
        media: data.media || [],
        currency: data.currency || "GHS",
      });
    }

    return NextResponse.json(accommodations);
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 },
    );
  }
}
