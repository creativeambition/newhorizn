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
import { Logo } from "@/components/ui/logo";

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
    if (value.length !== 6) return;

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
          "A new 6-digit verification code has been sent to your email.",
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

  const CONFIRM_BG_IMAGE =
    "https://images.unsplash.com/photo-1624586341193-c48fd13d27ab?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <div className="flex flex-1 flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Background image with gradient blend */}
        <div
          className="relative h-44 sm:h-52 lg:h-auto lg:w-[60%] shrink-0 lg:min-h-screen border-r border-border/60 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${CONFIRM_BG_IMAGE}')` }}
        >
          <div className="relative z-10 lg:hidden p-6 space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <Logo className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Check your inbox
            </h1>
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-black/30 to-background lg:bg-linear-to-r lg:from-black/30 lg:to-transparent" />
        </div>

        {/* Right: Form */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-10 relative">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <div className="hidden lg:block space-y-3 text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Check your inbox
              </h1>
              <p className="text-muted-foreground text-sm">
                Confirm to finish setting up your account.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative p-6 rounded-3xl bg-card border border-border/50 shadow-xl ring-1 ring-primary/10">
                    <Mail className="h-10 w-10 text-primary animate-subtle-pulse" />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border shadow-sm">
                      <Sparkles className="h-3 w-3 text-primary fill-current" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  We've sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium block">
                    {email}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (val.length === 6) handleVerify(val);
                  }}
                  disabled={verifying}
                >
                  <InputOTPGroup className="gap-2">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-10 h-12 text-lg rounded-xl border-border/60 bg-card shadow-sm"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {verifying && (
                  <div className="flex items-center gap-2 text-primary animate-pulse text-xs font-medium">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verifying code...
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-6 pt-4 border-t border-border/40">
                <div className="flex flex-col items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Didn't receive the code?
                  </span>
                  <button
                    onClick={handleResend}
                    disabled={resending || countdown > 0}
                    className="flex items-center gap-1.5 text-primary font-bold hover:text-primary/80 disabled:text-muted-foreground/80 transition-colors"
                  >
                    {resending ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    {resending
                      ? "Resending..."
                      : countdown > 0
                        ? `Resend available in ${countdown}s`
                        : "Resend code"}
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-foreground group rounded-full text-xs"
                >
                  <Link href="/auth/register">
                    <ArrowLeft className="h-3 w-3 mr-1.5 transition-transform group-hover:-translate-x-1" />
                    Back to registration
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
