"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const nextPath = searchParams.get("next") || "/dashboard";

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      setError(factorsError.message);
      setLoading(false);
      return;
    }

    const hasVerifiedTotp = factorsData.totp.some(
      (factor) => factor.status === "verified"
    );

    if (!hasVerifiedTotp) {
      router.replace(`/login/mfa/enroll?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const { data: assuranceData, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      setError(assuranceError.message);
      setLoading(false);
      return;
    }

    if (assuranceData.currentLevel === "aal2") {
      router.replace(nextPath);
      return;
    }

    router.replace(`/login/mfa?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 py-12 text-[#d8ffd0]">
      <section className="w-full max-w-md rounded-2xl border border-[#2e6417] bg-[#0d0d0d] p-6 shadow-[0_0_40px_rgba(46,100,23,0.25)]">
        <p className="mb-2 text-xs tracking-[0.2em] text-[#39ff14]">OBSIDIAN AUTH</p>
        <h1 className="text-2xl font-semibold text-[#eaffdf]">Sign in</h1>
        <p className="mt-2 text-sm text-[#a7cf9f]">
          Email and password sign-in with mandatory TOTP verification for secure
          dashboard access.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <label className="block text-sm text-[#b8e8af]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            placeholder="you@example.com"
          />

          <label className="block text-sm text-[#b8e8af]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-md border border-[#2e6417] bg-[#080808] px-3 py-2 text-[#ecffe7] outline-none ring-[#39ff14] placeholder:text-[#6f9169] focus:ring-2"
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-[#8dff6c]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md border border-[#2e6417] bg-[#173212] px-4 py-2 text-sm font-medium text-[#7fff5a] transition hover:border-[#39ff14] hover:bg-[#1f4318] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-[#9bc294]">
          <Link href="/login/mfa" className="hover:text-[#d7ffc9]">
            Verify MFA
          </Link>
          <Link href="/login/mfa/enroll" className="hover:text-[#d7ffc9]">
            Enroll Authenticator
          </Link>
        </div>
      </section>
    </main>
  );
}
