import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/utils/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { t } = useLanguage();
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get("next") || "/dashboard",
    [location.search],
  );

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFactor() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
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
        navigate(`/login/mfa/enroll?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        });
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
  }, [navigate, nextPath, supabase]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!factorId) {
      setError(t("mfa.error.noVerifiedFactor"));
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

    navigate(nextPath, { replace: true });
  }

  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass rounded-2xl border-border/40">
            <CardHeader className="space-y-3">
              <p className="text-xs tracking-[0.2em] text-primary">{t("mfa.badge")}</p>
              <CardTitle>{t("mfa.verifyTitle")}</CardTitle>
              <CardDescription>{t("mfa.verifySubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <p className="text-sm text-muted-foreground">{t("mfa.preparingChallenge")}</p>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenge-code">{t("mfa.codeLabel")}</Label>
                    <Input
                      id="challenge-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                      required
                      placeholder={t("mfa.codePlaceholder")}
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" disabled={verifying} className="w-full forest-gradient rounded-lg">
                    {verifying ? t("mfa.verifying") : t("mfa.verifyButton")}
                  </Button>
                </form>
              )}

              <div className="flex items-center justify-between text-sm">
                <Link to="/login" className="text-muted-foreground hover:text-primary">
                  {t("mfa.backLogin")}
                </Link>
                <Link
                  to={`/login/mfa/enroll?next=${encodeURIComponent(nextPath)}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {t("mfa.enrollDevice")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
