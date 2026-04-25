import { Activity, Lightbulb, Monitor, Rocket, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Brain, Code2, Gamepad2, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const About = () => {
  const { t, isRTL, language } = useLanguage();
  const { profile, projects, skills, loading } = usePortfolioData();

  const parseBilingualStatus = (value: string | null | undefined) => {
    if (!value) {
      return { ar: "", en: "" };
    }
    if (value.includes("|||")) {
      const [ar = "", en = ""] = value.split("|||");
      return { ar: ar.trim(), en: en.trim() };
    }
    return { ar: value, en: value };
  };

  const profileStatus = parseBilingualStatus(profile?.status);
  const statusLabel =
    language === "ar"
      ? profileStatus.ar || profileStatus.en || t("hero.statusDefault")
      : profileStatus.en || profileStatus.ar || t("hero.statusDefault");
  const experienceLabel = (() => {
    const rawExperience = profile?.experience_level;
    if (!rawExperience) {
      return t("hero.experienceDefault");
    }
    const translated = t(`dashboard.exp.${rawExperience}`);
    return translated === `dashboard.exp.${rawExperience}` ? rawExperience : translated;
  })();

  const timeline = [
    {
      icon: Gamepad2,
      title: t("about.timeline.beginning.title"),
      desc: t("about.timeline.beginning.desc"),
    },
    {
      icon: Code2,
      title: t("about.timeline.firstCode.title"),
      desc: t("about.timeline.firstCode.desc"),
    },
    {
      icon: GraduationCap,
      title: t("about.timeline.learning.title"),
      desc: t("about.timeline.learning.desc"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold">{t("about.title")}</h1>
          <p className="text-xl text-primary">{t("about.subtitle")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="glass rounded-2xl border-border/40">
                <CardContent className="p-8 space-y-6">
                  {/* النصوص الأساسية مع دعم النزول لسطر جديد */}
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.story1")}</p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.story2")}</p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.story3")}</p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.story4")}</p>

                  {/* نص الكذبة (بشكل مائل وخافت قليلًا للجمالية) */}
                  <p className="text-muted-foreground/60 italic text-sm">{t("about.story5")}</p>

                  <hr className="border-border/40 my-6" />

                  {/* قسم معلومات شاطحة */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-primary">{t("about.extra_title")}</h3>
                    
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <p className="text-muted-foreground leading-relaxed">{t("about.extra_why")}</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Monitor className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <p className="text-muted-foreground leading-relaxed">{t("about.extra_gear")}</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Rocket className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <p className="text-muted-foreground leading-relaxed">{t("about.extra_ambition")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: isRTL ? -10 : 10 }}
                  className="flex items-start gap-4 glass rounded-xl p-4"
                >
                  <div className="p-3 rounded-lg bg-primary/10">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-6">{t("about.skills")}</h2>
              {loading ? (
                <Card className="glass rounded-2xl border-border/40">
                  <CardContent className="p-6 text-muted-foreground">{t("projects.loading")}</CardContent>
                </Card>
              ) : skills.length === 0 ? (
                <Card className="glass rounded-2xl border-border/40">
                  <CardContent className="p-6 text-muted-foreground">{t("about.noSkills")}</CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {skills.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="glass rounded-xl p-4 border border-border/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-medium">{skill.name}</span>
                          {skill.category && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {skill.category}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground">{skill.proficiency}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.proficiency}%` }}
                          transition={{ duration: 0.9, delay: 0.3 + index * 0.08 }}
                          className="h-full forest-gradient rounded-full"
                        />
                      </div>
                      {skill.icon && <p className="text-[11px] text-muted-foreground">Icon: {skill.icon}</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass rounded-2xl border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-primary" />
                    <CardTitle>{t("about.approach")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{t("about.approach.text")}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {["Strategic", "Innovative", "Detail-Oriented", "User-Focused"].map((trait) => (
                      <span key={trait} className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
                        {trait}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="glass rounded-2xl border-border/40">
                  <CardHeader>
                    <CardTitle>{t("about.profileTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/40 bg-card/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground">{t("about.currentAge")}</p>
                        <p className="text-base font-semibold">{profile?.age ?? "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-card/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          {t("hero.status")}
                        </p>
                        <p className="text-base font-semibold">{statusLabel}</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-card/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          {t("hero.experience")}
                        </p>
                        <p className="text-base font-semibold">
                          {experienceLabel}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-primary mb-2">{t("about.latestProjects")}:</p>
                    {projects.length === 0 ? (
                      <p className="text-muted-foreground">{t("about.noProjects")}</p>
                    ) : (
                      <ul className="space-y-1 text-muted-foreground">
                        {projects.slice(0, 3).map((project) => (
                          <li key={project.id}>• {project.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
