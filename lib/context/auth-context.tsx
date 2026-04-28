"use client";
import { RealtimeChannel, User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../supabase/client";
import { Accommodation } from "../types";

type AuthContext = {
  user: User | null;
  signout: () => void;
  accommodationData: Omit<Accommodation, "owner_id"> | null;
  loading: boolean;
  confirmSignOut: boolean;
  setConfirmSignOut: Dispatch<SetStateAction<boolean>>;
  updateGlobalConfig: (config: any) => Promise<void>;
  updateAccommodation: (data: Partial<Accommodation>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [accommodationData, setAccommodationData] = useState<Omit<
    Accommodation,
    "owner_id"
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const allowedPaths = [
    "/",
    "/accommodations",
    "/auth/login",
    "/auth/register",
    "/auth/confirm-email",
    "/auth/onboarding",
  ];

  const unsubscribeRef = useRef<RealtimeChannel | null>(null);
  const fetchingProfileRef = useRef(false);

  const navigationRef = useRef<string | null>(null);

  const setupRealtimeListener = useCallback(
    (accommodationId: string) => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current.unsubscribe();
      }

      const channel = supabase
        .channel(`public:accommodations:id=eq.${accommodationId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "accommodations",
            filter: `id=eq.${accommodationId}`,
          },
          (payload: any) => {
            const data = payload.new;

            const updatedAccommodationData: Omit<Accommodation, "owner_id"> = {
              id: data.id,
              accommodationName: data.accommodationName,
              listingType: data.listingType,
              manager: data.manager,
              email: data.email,
              address: data.address,
              phone: data.phone,
              isVerified: data.isVerified === true,
              globalConfig: data.globalConfig,
            };
          },
        )
        .subscribe();

      unsubscribeRef.current = channel;
    },
    [router],
  );

  async function profile(
    user: User | null,
  ): Promise<Omit<Accommodation, "owner_id"> | null> {
    if (!user) {
      console.error("User is not authenticated");
      return null;
    }

    if (fetchingProfileRef.current) {
      return null;
    }
    fetchingProfileRef.current = true;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("accommodations")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error || !data) {
        // Double check that the user still exists in Auth (prevent ghost redirects for deleted users)
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          console.error("User session is stale or user was deleted");
          await supabase.auth.signOut();
          router.replace("/auth/login");
          return null;
        }

        // If user actually exists but just doesn't have a profile yet,
        // leave them where they are — do not force redirect to onboarding.
        return null;
      }

      setupRealtimeListener(data.id);

      const accommodationData: Omit<Accommodation, "owner_id"> = {
        id: data.id,
        accommodationName: data.accommodationName,
        listingType: data.listingType,
        manager: data.manager,
        email: data.email,
        address: data.address,
        phone: data.phone,
        isVerified: data.isVerified === true,
        globalConfig: data.globalConfig,
        currency: data.currency || "GHS",
        media: data.media,
        managerImage: data.managerImage,
        payout_network: data.payout_network,
        payout_number: data.payout_number,
        paystack_subaccount_code: data.paystack_subaccount_code,
      };

      return accommodationData;
    } catch (error) {
      console.error("Error fetching accommodation profile:", error);
      setAccommodationData(null);
      return null;
    } finally {
      setLoading(false);
      fetchingProfileRef.current = false;
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      fetchingProfileRef.current = false; // allow re-fetch
      const result = await profile(user);
      if (result) {
        setAccommodationData(result);
      }
    }
  }, [user]);

  const signout = async () => {
    await supabase.auth.signOut();
    setConfirmSignOut(false);
    router.push("/");
  };

  const updateGlobalConfig = async (config: any) => {
    if (!accommodationData) return;
    const { error } = await supabase
      .from("accommodations")
      .update({
        globalConfig: config,
      })
      .eq("id", accommodationData.id);

    if (error) {
      console.error("Error updating global config:", error);
      throw error;
    }
    await refreshProfile();
  };

  const updateAccommodation = async (data: Partial<Accommodation>) => {
    if (!accommodationData) return;
    const { error } = await supabase
      .from("accommodations")
      .update(data)
      .eq("id", accommodationData.id);

    if (error) {
      console.error("Error updating accommodation:", error);
      throw error;
    }
    await refreshProfile();
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (
        currentUser &&
        (event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "USER_UPDATED")
      ) {
        const fetchProfile = async () => {
          const result = await profile(currentUser);
          if (result) {
            setAccommodationData(result);
          }
        };

        fetchProfile().catch(console.error);
      } else if (!currentUser) {
        setAccommodationData(null);
        setLoading(false);

        if (
          navigationRef.current !== "/auth/login" &&
          !allowedPaths.some((path) => pathname?.startsWith(path))
        ) {
          navigationRef.current = "/";
          router.push("/");
        }
      }
    });

    return () => {
      subscription.unsubscribe();

      if (unsubscribeRef.current) {
        unsubscribeRef.current.unsubscribe();
      }
    };
  }, []);

  // useEffect(() => {
  //   if (user && accommodationData) {
  //     checkAccess();
  //   }
  // }, [pathname, accommodationData, user, checkAccess]);

  const value = useMemo(
    () => ({
      user,
      signout,
      accommodationData,
      loading,
      confirmSignOut,
      setConfirmSignOut,
      updateGlobalConfig,
      updateAccommodation,
      refreshProfile,
    }),
    [user, accommodationData, loading, confirmSignOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
