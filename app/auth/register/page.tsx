"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { registerSchema } from "@/lib/validations/auth";
import { Loader, Sparkles } from "lucide-react";
import { handleSignUp } from "../actions";
import { Logo } from "@/components/ui/logo";

type FormData = z.infer<typeof registerSchema>;

const SIGNUP_BG_IMAGE =
  "https://images.unsplash.com/photo-1562602136-b64ddd991ea2?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function RegisterationForm() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/onboarding`,
        },
      });

      if (error) throw error;
      // Note: OAuth redirects the user away immediately, so code below won't run.
    } catch (error: any) {
      console.error("Google sign-up failed:", error);
      toast({
        title: "Sign-up failed",
        description: "Could not initiate sign up with Google.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const result = await handleSignUp(data);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.redirect) {
        router.push(result.redirect);
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred, please try again.",
        variant: "destructive",
      });

      console.error("Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Background image with gradient blend */}
        <div
          className="relative h-44 sm:h-52 lg:h-auto lg:w-[60%] shrink-0 lg:min-h-screen border-r border-border/60 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${SIGNUP_BG_IMAGE}')` }}
        >
          <CardHeader className="relative z-10 lg:hidden space-y-1 text-center pb-1">
            <div className="flex justify-center mb-2">
              <Logo className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-sm">
              Email and password. You’ll add accommodation details next.
            </CardDescription>
          </CardHeader>
          <div className="absolute inset-0 bg-linear-to-b from-black/30 to-background lg:bg-linear-to-r lg:from-black/30 lg:to-transparent" />
        </div>

        {/* Right: Form */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-10">
          <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <CardHeader className="hidden lg:block space-y-1 text-center pb-1 xl:mb-16">
                  <div className="flex justify-center mb-2">
                    <Logo className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Create your account
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Email and password. You’ll add accommodation details next.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="h-10 text-sm rounded-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Min 8 characters"
                            className="h-10 text-sm rounded-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Confirm password
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Confirm"
                            className="h-10 text-sm rounded-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-1">
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-medium rounded-full"
                    disabled={
                      loading || googleLoading || !form.formState.isValid
                    }
                  >
                    {loading && (
                      <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    {loading ? "Creating account…" : "Continue with email"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 text-sm font-medium rounded-full"
                    disabled={loading || googleLoading}
                    onClick={handleGoogleSignUp}
                  >
                    {googleLoading ? (
                      <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    Sign up with Google
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By signing up you agree to our terms and privacy policy.
                  </p>

                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </main>
      </div>

      {/* <footer className="py-4 px-4 md:px-6 border-t border-border/60 shrink-0">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} newhorizn. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
              href="#"
            >
              Terms
            </Link>
            <Link
              className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
              href="#"
            >
              Privacy
            </Link>
            <Link
              className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
              href="#"
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer> */}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RegisterationForm />
    </Suspense>
  );
}
