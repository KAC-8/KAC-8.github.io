import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/utils/supabase";
import { createSecurityLog } from "@/utils/securityLogs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { t } = useLanguage();
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get("next") || "/dashboard",
    [location.search],
  );

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
      await createSecurityLog({
        supabase,
        actionType: "failed_login",
        actionStatus: "failed",
        details: signInError.message,
        metadata: { email },
      });
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      setError(factorsError.message);
      setLoading(false);
      return;
    }

    const hasVerifiedTotp = factorsData.totp.some((factor) => factor.status === "verified");

    if (!hasVerifiedTotp) {
      navigate(`/login/mfa/enroll?next=${encodeURIComponent(nextPath)}`, {
        replace: true,
      });
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
      navigate(nextPath, { replace: true });
      return;
    }

    navigate(`/login/mfa?next=${encodeURIComponent(nextPath)}`, { replace: true });
  }

  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-md px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass rounded-2xl border-border/40">
            <CardHeader className="space-y-3">
              <p className="text-xs tracking-[0.2em] text-primary">{t("login.badge")}</p>
              <CardTitle className="text-3xl">{t("login.title")}</CardTitle>
              <CardDescription>{t("login.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder={t("login.emailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder={t("login.passwordPlaceholder")}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full forest-gradient rounded-lg">
                  {loading ? t("login.submitting") : t("login.submit")}
                </Button>
              </form>

              <div className="flex items-center justify-between text-sm">
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  {t("login.backHome")}
                </Link>
                <Link to="/certificates" className="text-muted-foreground hover:text-primary">
                  {t("login.certificates")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
