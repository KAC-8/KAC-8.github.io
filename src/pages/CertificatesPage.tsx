import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CertificatesPage() {
  const { t } = useLanguage();
  const { certificates, error, loading } = usePortfolioData();
  const sortedCertificates = [...certificates].sort((a, b) => {
    const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
  });

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-4"
        >
          <div className="flex gap-3 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              {t("dashboard.homeLink")}
            </Link>
          </div>
          <p className="text-sm tracking-wide text-primary">{t("cert.badge")}</p>
          <h1 className="text-4xl md:text-5xl font-bold">{t("cert.title")}</h1>
          <p className="text-muted-foreground max-w-2xl">{t("cert.subtitle")}</p>
          {error && <p className="text-sm text-destructive">{t("cert.error")}</p>}
        </motion.div>

        {loading ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass rounded-2xl border-border/40">
              <CardContent className="p-6 text-muted-foreground">{t("cert.loading")}</CardContent>
            </Card>
          </motion.div>
        ) : certificates.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass rounded-2xl border-border/40">
              <CardContent className="p-6 text-muted-foreground">{t("cert.empty")}</CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="columns-1 md:columns-2 gap-6 space-y-6">
            {sortedCertificates.map((certificate, index) => (
              <div
                key={certificate.id}
                className="break-inside-avoid inline-block w-full h-fit mb-6 flex flex-col justify-start"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="h-fit"
                >
                <Card
                  className={`glass h-fit rounded-2xl border-border/40 transition-all ${
                    certificate.is_specialization
                      ? "border-primary/60 shadow-[0_0_30px_rgba(46,100,23,0.3)] bg-gradient-to-br from-primary/10 to-transparent"
                      : ""
                  }`}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-xl">{certificate.title}</CardTitle>
                      {certificate.sort_order !== null && (
                        <span className="px-2 py-1 rounded-full text-[11px] bg-primary/15 text-primary">
                          {t("cert.priority")}: {certificate.sort_order}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{certificate.organization}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("cert.issued")}: {formatDate(certificate.issued_at)}
                    </p>
                    {certificate.is_specialization && (
                      <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full bg-primary/20 text-primary border border-primary/40">
                        <Crown className="w-3.5 h-3.5" />
                        {t("cert.specialization")}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent
                    className={`pt-0 ${
                      certificate.local_path || (certificate.specialization_courses?.length ?? 0) > 0
                        ? "space-y-3"
                        : ""
                    }`}
                  >
                    {certificate.link ? (
                      <Button asChild className="forest-gradient rounded-lg">
                        <a href={certificate.link} target="_blank" rel="noreferrer">
                          {t("cert.view")}
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t("cert.noLink")}</span>
                    )}

                    {certificate.local_path && (
                      <p className="text-xs text-muted-foreground">
                        {t("cert.localPath")}: <span className="text-primary">{certificate.local_path}</span>
                      </p>
                    )}

                    {(certificate.specialization_courses?.length ?? 0) > 0 && (
                      <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
                        <p className="text-xs text-primary">{t("cert.subCourses")}</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {(certificate.specialization_courses ?? []).map((course) => (
                            <li key={course.id}>• {course.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
