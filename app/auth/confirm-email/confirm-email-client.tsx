"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, Sparkles, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { verifyOTP, resendOTP } from "../actions";

interface ConfirmEmailClientProps {
  email: string;
}

export default function ConfirmEmailClient({ email }: ConfirmEmailClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (value: string) => {
    if (value.length !== 8) return;

    setVerifying(true);
    try {
      const result = await verifyOTP(value);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Account verified",
        description: "Your email has been successfully confirmed. Welcome!",
      });

      if (result.redirect) {
        router.push(result.redirect);
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description:
          error.message || "The code you entered is invalid or has expired.",
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      const result = await resendOTP();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Code resent",
        description:
          "A new 8-digit verification code has been sent to your email.",
      });

      setCountdown(60); // 60 seconds cooldown
    } catch (error: any) {
      toast({
        title: "Resend failed",
        description: error.message || "Could not resend the verification code.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-10 relative overflow-hidden bg-background">
      {/* Abstract Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-subtle-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-subtle-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="w-full max-w-lg space-y-12 text-center animate-fade-in">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative p-6 rounded-3xl bg-card border border-border/50 shadow-2xl ring-1 ring-primary/10">
              <Mail className="h-12 w-12 text-primary animate-subtle-pulse" />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1.5 border shadow-sm">
                <Sparkles className="h-4 w-4 text-primary fill-current" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-sm">
            Check your inbox
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            We've sent an 8-digit code to{" "}
            <span className="text-foreground font-medium underline decoration-primary/30 underline-offset-4">
              {email}
            </span>
            . Confirm to finish setting up your account.
          </p>
        </div>

        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center gap-6">
            <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground/80">
              Enter verification code
            </label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (val.length === 6) handleVerify(val);
              }}
              disabled={verifying}
            >
              <InputOTPGroup className="gap-1.5 md:gap-2">
                <InputOTPSlot
                  index={0}
                  className="w-9 h-12 md:w-11 md:h-14 text-lg rounded-lg border-border/60 bg-card shadow-sm"
                />
                <InputOTPSlot
                  index={1}
                  className="w-9 h-12 md:w-11 md:h-14 text-lg rounded-lg border-border/60 bg-card shadow-sm"
                />
                <InputOTPSlot
                  index={2}
                  className="w-9 h-12 md:w-11 md:h-14 text-lg rounded-lg border-border/60 bg-card shadow-sm"
                />
                <InputOTPSlot
                  index={3}
                  className="w-9 h-12 md:w-11 md:h-14 text-lg rounded-lg border-border/60 bg-card shadow-sm"
                />
                <InputOTPSlot
                  index={4}
                  className="w-9 h-12 md:w-11 md:h-14 text-lg rounded-lg border-border/60 bg-card shadow-sm"
                />
                <InputOTPSlot
                  index={5}
                  className="w-9 h-12 md:w-11 md:h-14 text-lg rounded-lg border-border/60 bg-card shadow-sm"
                />
              </InputOTPGroup>
            </InputOTP>

            {verifying && (
              <div className="flex items-center gap-2 text-primary animate-pulse text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying code...
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm min-h-6">
            <span className="text-muted-foreground">
              Didn't receive the code?
            </span>
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="flex items-center gap-2 text-primary font-semibold hover:text-primary/80 disabled:text-muted-foreground/50 transition-colors"
            >
              {resending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {resending
                ? "Resending..."
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : "Resend code"}
            </button>
          </div>

          <div className="pt-8">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground group rounded-full"
            >
              <Link href="/auth/register">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to registration
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
