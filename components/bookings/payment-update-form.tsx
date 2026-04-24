"use client";

import { FormEvent, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { BookingDetails, PaymentStatus } from "@/lib/types";

type PaymentUpdateFormProps = {
  booking: BookingDetails;
  currentStatus: PaymentStatus;
  totalPrice: number;
  currentPaymentAmount: number;
  paymentNotes: string;
  onUpdatePayment: (
    bookingId: string,
    paymentStatus: PaymentStatus,
    paymentAmount: number,
    paymentNotes: string,
  ) => Promise<void>;
  currency?: string;
  onClose: () => void;
};

export default function PaymentUpdateForm({
  booking,
  currentStatus,
  totalPrice,
  currentPaymentAmount,
  paymentNotes,
  onUpdatePayment,
  currency = "GHS",
  onClose,
}: PaymentUpdateFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>(currentStatus);
  const [paymentAmount, setPaymentAmount] = useState(currentPaymentAmount);
  const [notes, setNotes] = useState(paymentNotes);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (
      (paymentStatus === "deposit_paid" ||
        paymentStatus === "installment_plan") &&
      !paymentAmount
    ) {
      errors.paymentAmount = "Please enter the payment amount";
    }

    if (
      (paymentStatus === "deposit_paid" ||
        paymentStatus === "installment_plan") &&
      paymentAmount > totalPrice
    ) {
      errors.paymentAmount = "Payment amount cannot exceed total price";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      await onUpdatePayment(booking.id, paymentStatus, paymentAmount, notes);
      onClose();
    } catch (error) {
      console.error("Failed to update payment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-125 max-h-screen overflow-y-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e.nativeEvent as SubmitEvent);
        }}
      >
        <DialogHeader className="text-left">
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogDescription>
            Update the payment information for{" "}
            <b className="">{booking.guestName}</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">{currency} {totalPrice}</span>
            </div>
            {currentPaymentAmount > 0 && currentStatus !== "paid_in_full" && (
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">Currently Paid:</span>
                <span className="text-md">{currency} {currentPaymentAmount}</span>
              </div>
            )}
            {currentPaymentAmount > 0 && currentStatus !== "paid_in_full" && (
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">Balance Due:</span>
                <span className="text-md">
                  {currency} {totalPrice - currentPaymentAmount}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Payment Status</Label>
            <RadioGroup
              value={paymentStatus}
              onValueChange={(value: PaymentStatus) => setPaymentStatus(value)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending" className="cursor-pointer">
                  No Payment Yet (Pending)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deposit_paid" id="deposit" />
                <Label htmlFor="deposit" className="cursor-pointer">
                  Deposit Paid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paid_in_full" id="paid" />
                <Label htmlFor="paid" className="cursor-pointer">
                  Paid in Full
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(paymentStatus === "deposit_paid" ||
            paymentStatus === "installment_plan") && (
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{currency}</span>
                  <Input
                    id="payment-amount"
                    type="number"
                    placeholder="0.00"
                    className={`pl-12 ${formErrors.paymentAmount ? "border-red-500" : ""
                      }`}
                    value={paymentAmount || ""}
                    onChange={(e) =>
                      setPaymentAmount(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                {formErrors.paymentAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.paymentAmount}
                  </p>
                )}
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Payment Notes</Label>
            <Input
              id="payment-notes"
              placeholder="e.g., Payment method, reference number, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Update Payment
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
