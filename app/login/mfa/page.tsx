"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

export default function MfaChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const nextPath = searchParams.get("next") || "/dashboard";

    async function loadFactor() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        if (active) {
          setError(factorsError.message);
          setLoading(false);
        }
        return;
      }

      const verifiedFactor = factorsData.totp.find((factor) => factor.status === "verified");

      if (!verifiedFactor) {
        router.replace(`/login/mfa/enroll?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      if (active) {
        setFactorId(verifiedFactor.id);
        setLoading(false);
      }
    }

    loadFactor();

    return () => {
      active = false;
    };
  }, [router, searchParams, supabase]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!factorId) {
      setError("No verified TOTP factor found.");
      return;
    }

    setError(null);
    setVerifying(true);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      setError(challengeError.message);
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      setError(verifyError.message);
      setVerifying(false);
      return;
    }

    const nextPath = searchParams.get("next") || "/dashboard";
    router.replace(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 py-12 text-[#d8ffd0]">
      <section className="w-full max-w-md rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6 shadow-[0_0_40px_rgba(46,100,23,0.2)]">
        <p className="mb-2 text-xs tracking-[0.22em] text-[#39ff14]">OBSIDIAN MFA</p>
        <h1 className="text-2xl font-semibold text-[#eaffdf]">Verify 2FA</h1>
        <p className="mt-2 text-sm text-[#a7cf9f]">
          Enter the 6-digit code from your authenticator app.
        </p>

        {loading ? (
          <div className="mt-6 rounded-lg border border-[#2e6417] bg-[#090909] p-4 text-sm text-[#9bc294]">
            Preparing MFA challenge...
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <label htmlFor="challenge-code" className="block text-sm text-[#b8e8af]">
              6-digit code
            </label>
            <input
              id="challenge-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              required
              className="w-full rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
              placeholder="123456"
            />

            {error && <p className="text-sm text-[#8dff6c]">{error}</p>}

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify and Continue"}
            </button>
          </form>
        )}

        <div className="mt-5 flex items-center justify-between text-sm text-[#9bc294]">
          <Link href="/login" className="hover:text-[#d7ffc9]">
            Back to Login
          </Link>
          <Link href="/login/mfa/enroll" className="hover:text-[#d7ffc9]">
            Enroll New Device
          </Link>
        </div>
      </section>
    </main>
  );
}
