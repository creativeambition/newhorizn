"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const PENDING_EMAIL_COOKIE = "sb-pending-email";

export async function handleSignUp(formData: any) {
  const supabase = await createClient();
  const { email, password } = formData;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    // Email confirmation required
    const cookieStore = await cookies();
    cookieStore.set(PENDING_EMAIL_COOKIE, email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });
    return { success: true, redirect: "/auth/confirm-email" };
  }

  return { success: true, redirect: "/auth/onboarding" };
}

export async function handleLogin(formData: any) {
  const supabase = await createClient();
  const { email, password } = formData;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      const cookieStore = await cookies();
      cookieStore.set(PENDING_EMAIL_COOKIE, email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600,
        path: "/",
      });
      return {
        success: true,
        redirect: "/auth/confirm-email",
        unconfirmed: true,
      };
    }
    return { error: error.message };
  }

  return { success: true, redirect: "/dashboard" };
}

export async function verifyOTP(token: string) {
  const cookieStore = await cookies();
  const email = cookieStore.get(PENDING_EMAIL_COOKIE)?.value;

  if (!email) {
    return { error: "Verification session expired. Please log in again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { error: error.message };
  }

  // Clear the cookie on success
  cookieStore.delete(PENDING_EMAIL_COOKIE);
  return { success: true, redirect: "/auth/onboarding" };
}

export async function resendOTP() {
  const cookieStore = await cookies();
  const email = cookieStore.get(PENDING_EMAIL_COOKIE)?.value;

  if (!email) {
    return { error: "Resend session expired. Please log in again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
