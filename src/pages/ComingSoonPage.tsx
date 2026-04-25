import { motion } from "framer-motion";
import { Clock4 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComingSoonPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass rounded-2xl border-border/40">
            <CardHeader className="items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Clock4 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-4xl">{t("maintenance.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {t("maintenance.subtitle")}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
