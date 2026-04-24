import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Mapping of MoMo networks to Paystack bank codes for Ghana
const BANK_CODES: Record<string, string> = {
  "MTN": "MTN", // MTN Mobile Money
  "VODAFONE": "VOD", // Telecel (formerly Vodafone)
  "AIRTELTIGO": "ATL", // AirtelTigo
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accommodationId, network, accountNumber, businessName } = body;

    if (!accommodationId || !network || !accountNumber || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bankCode = BANK_CODES[network];
    if (!bankCode) {
      return NextResponse.json({ error: "Invalid network selection" }, { status: 400 });
    }

    // Get existing accommodation data to check for existing subaccount
    const supabase = await createClient();
    const { data: accommodation, error: fetchError } = await supabase
      .from("accommodations")
      .select("paystack_subaccount_code")
      .eq("id", accommodationId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch accommodation:", fetchError);
      return NextResponse.json({ error: "Failed to fetch accommodation data" }, { status: 500 });
    }

    let subaccountCode: string;

    if (accommodation?.paystack_subaccount_code) {
      // Update existing subaccount
      console.log("Updating existing subaccount:", accommodation.paystack_subaccount_code);
      
      const res = await fetch(`https://api.paystack.co/subaccount/${accommodation.paystack_subaccount_code}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: businessName,
          bank_code: bankCode,
          account_number: accountNumber,
          percentage_charge: 1, // Platform takes 1%
        }),
      });

      const data = await res.json();
      
      console.log("Paystack subaccount update response:", { status: res.status, data });

      if (!data.status) {
        console.error("Paystack subaccount update failed:", data);
        return NextResponse.json({ error: data.message || "Paystack subaccount update failed" }, { status: 500 });
      }

      subaccountCode = accommodation.paystack_subaccount_code;
    } else {
      // Create new subaccount
      console.log("Creating new subaccount for accommodation:", accommodationId);
      
      const res = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: businessName,
          bank_code: bankCode,
          account_number: accountNumber,
          percentage_charge: 1, // Platform takes 1%
        }),
      });

      const data = await res.json();
      
      console.log("Paystack subaccount creation response:", { status: res.status, data });

      if (!data.status) {
        console.error("Paystack subaccount creation failed:", data);
        return NextResponse.json({ error: data.message || "Paystack subaccount creation failed" }, { status: 500 });
      }

      subaccountCode = data.data.subaccount_code;
    }

    // Update accommodation in Supabase with new payout details
    const { error } = await supabase
      .from("accommodations")
      .update({
        payout_network: network,
        payout_number: accountNumber,
        paystack_subaccount_code: subaccountCode,
        // Reset verification when payout details change
        payout_verified: false,
      })
      .eq("id", accommodationId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to update accommodation record" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      subaccountCode,
      isUpdate: !!accommodation?.paystack_subaccount_code
    });
  } catch (error) {
    console.error("Subaccount setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
