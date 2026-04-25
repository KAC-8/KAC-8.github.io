import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { getSupabaseClient } from "@/utils/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MfaEnrollPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { t } = useLanguage();
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get("next") || "/dashboard",
    [location.search],
  );

  const [factorId, setFactorId] = useState<string | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(t("mfa.preparingEnrollment"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setStatus(t("mfa.preparingEnrollment"));
  }, [t]);

  useEffect(() => {
    let active = true;

    async function enrollTotp() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factorsData?.totp?.find((factor) => factor.status === "verified");

      if (verifiedFactor && active) {
        navigate(`/login/mfa?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        });
        return;
      }

      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Portfolio Authenticator",
      });

      if (enrollError) {
        if (active) {
          setError(enrollError.message);
          setStatus(t("mfa.enrollmentFailed"));
          setLoading(false);
        }
        return;
      }

      if (active) {
        setFactorId(enrollData.id);
        setOtpAuthUri(enrollData.totp.uri);
        setSecret(enrollData.totp.secret);
        setStatus(t("mfa.scanInstruction"));
        setLoading(false);
      }
    }

    enrollTotp();

    return () => {
      active = false;
    };
  }, [navigate, nextPath, supabase, t]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!factorId) {
      setError(t("mfa.error.noEnrollmentFactor"));
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
      <div className="mx-auto max-w-xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass rounded-2xl border-border/40">
            <CardHeader className="space-y-3">
              <p className="text-xs tracking-[0.2em] text-primary">{t("mfa.badge")}</p>
              <CardTitle>{t("mfa.enrollTitle")}</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <p className="text-sm text-muted-foreground">{t("mfa.preparingEnrollment")}</p>
              ) : (
                <>
                  {otpAuthUri && (
                    <div className="flex justify-center rounded-xl border border-border/40 bg-card/30 p-5">
                      <QRCodeSVG
                        value={otpAuthUri}
                        size={220}
                        bgColor="#080808"
                        fgColor="#2e6417"
                        level="M"
                        includeMargin
                      />
                    </div>
                  )}

                  {secret && (
                    <p className="break-all rounded-md border border-border/40 bg-card/40 px-3 py-2 text-sm">
                      {t("mfa.manualKey")}: {secret}
                    </p>
                  )}

                  <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="totp-code">{t("mfa.codeLabel")}</Label>
                      <Input
                        id="totp-code"
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
                      {verifying ? t("mfa.verifying") : t("mfa.completeEnrollment")}
                    </Button>
                  </form>
                </>
              )}

              <div className="flex items-center justify-between text-sm">
                <Link to="/login" className="text-muted-foreground hover:text-primary">
                  {t("mfa.backLogin")}
                </Link>
                <Link
                  to={`/login/mfa?next=${encodeURIComponent(nextPath)}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {t("mfa.useExisting")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
