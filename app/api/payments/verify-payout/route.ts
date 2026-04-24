import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accommodationId, action } = body;

    if (!accommodationId) {
      return NextResponse.json(
        { error: "Missing accommodation ID" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    if (action === "verify") {
      // Get accommodation data
      const { data: accommodation, error: fetchError } = await supabase
        .from("accommodations")
        .select("payout_number, payout_network, accommodationName")
        .eq("id", accommodationId)
        .single();

      if (fetchError || !accommodation?.payout_number) {
        return NextResponse.json(
          { error: "Payout details not found" },
          { status: 404 },
        );
      }

      // Generate unique reference for verification charge
      const reference = `verify_${accommodation.accommodationName}_${Date.now()}`;

      // Create a 1.00 charge to verify the mobile money number
      const paystackRes = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `verification+${accommodation.accommodationName}@newhorizn.com`,
            amount: 100,
            currency: "GHS",
            reference,
            channels: ["mobile_money"],
            mobile_money: {
              phone: accommodation.payout_number,
              provider: accommodation.payout_network.toLowerCase(),
            },
            metadata: {
              type: "verification",
              accommodationId,
              accommodationName: accommodation.accommodationName,
            },
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?verified=true`,
          }),
        },
      );

      const paystackData = await paystackRes.json();
      console.log("Paystack verification charge response:", {
        status: paystackRes.status,
        data: paystackData,
      });

      if (!paystackData.status) {
        return NextResponse.json(
          {
            error:
              paystackData.message || "Failed to initiate verification charge",
          },
          { status: 500 },
        );
      }

      // Mark verification as in progress
      const { error: updateError } = await supabase
        .from("accommodations")
        .update({
          payout_verified: false,
        })
        .eq("id", accommodationId);

      if (updateError) {
        console.error("Failed to update verification status:", updateError);
        return NextResponse.json(
          { error: "Failed to update verification status" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        reference,
        message:
          "Verification charge initiated. Please complete the payment on your mobile money to verify ownership.",
      });
    } else if (action === "complete") {
      // This will be called by webhook or manual completion
      const { reference } = body;

      if (!reference) {
        return NextResponse.json(
          { error: "Reference required" },
          { status: 400 },
        );
      }

      // Verify the transaction with Paystack
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      const verifyData = await verifyRes.json();
      console.log("Paystack verification result:", {
        status: verifyRes.status,
        data: verifyData,
      });

      if (!verifyData.status || verifyData.data.status !== "success") {
        return NextResponse.json(
          { error: "Verification payment not completed" },
          { status: 400 },
        );
      }

      // Mark as verified
      const { error: updateError } = await supabase
        .from("accommodations")
        .update({
          payout_verified: true,
        })
        .eq("id", accommodationId);

      if (updateError) {
        console.error("Failed to mark as verified:", updateError);
        return NextResponse.json(
          { error: "Failed to complete verification" },
          { status: 500 },
        );
      }

      // Initiate refund for the verification charge
      try {
        const refundRes = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction: reference,
            amount: 100, // Refund the 1.00 verification charge
          }),
        });

        const refundData = await refundRes.json();
        console.log("Refund initiated:", {
          status: refundRes.status,
          data: refundData,
        });
      } catch (refundError) {
        console.error("Failed to initiate refund:", refundError);
        // Don't fail the verification if refund fails
      }

      return NextResponse.json({
        success: true,
        message:
          "Mobile number verified successfully! Verification charge will be refunded.",
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Payout verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
