import { ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSupabaseClient } from "@/utils/supabase";

type GuardState = "loading" | "allow" | "unauthenticated" | "require_mfa";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAal2?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAal2 = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      if (!active) {
        return;
      }

      setState("loading");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (sessionError || !session) {
        setState("unauthenticated");
        return;
      }

      if (!requireAal2) {
        setState("allow");
        return;
      }

      const { data: assuranceData, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (!active) {
        return;
      }

      if (assuranceError || assuranceData.currentLevel !== "aal2") {
        setState("require_mfa");
        return;
      }

      setState("allow");
    }

    validateAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      validateAccess();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [requireAal2, supabase]);

  const nextPath = `${location.pathname}${location.search}`;

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-xl border border-[#2e6417] bg-[#0d0d0d] px-5 py-4 text-sm text-[#d8ffd0] flex items-center gap-3">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-[#2e6417] border-t-transparent animate-spin" />
          <span>Validating secure session...</span>
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(nextPath)}`}
        replace
      />
    );
  }

  if (state === "require_mfa") {
    return (
      <Navigate
        to={`/login/mfa?next=${encodeURIComponent(nextPath)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
