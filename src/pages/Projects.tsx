import { motion } from "framer-motion";
import { ExternalLink, Github, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioData } from "@/hooks/usePortfolioData";

type EmptyProjectsStateProps = {
  Ar: string;
  En: string;
  language: "ar" | "en";
};

function EmptyProjectsState({ Ar, En, language }: EmptyProjectsStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass rounded-2xl border-border/40">
        <CardContent className="p-6 text-muted-foreground">{language === "ar" ? Ar : En}</CardContent>
      </Card>
    </motion.div>
  );
}

function toSafeString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function toSafeNullableString(value: unknown) {
  const normalized = toSafeString(value, "");
  return normalized.trim() === "" ? null : normalized;
}

function toSafeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((tag) => toSafeString(tag, "")).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

const Projects = () => {
  const { t, language } = useLanguage();
  const { projects, loading: isLoading, error } = usePortfolioData();
  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const projectsData = Array.isArray(projects) ? projects : [];

  console.log("🚨 DEBUG PROJECTS DATA:", projectsData);
  console.log("🚨 DEBUG PROJECTS ERROR:", error);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        Error loading projects. Check Console.
      </div>
    );
  }
  if (!projectsData || !Array.isArray(projectsData) || projectsData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {language === "ar" ? "لا توجد مشاريع متاحة حالياً." : "No Projects Found."}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold">{t("projects.title")}</h1>
          <p className="text-xl text-muted-foreground">{t("projects.subtitle")}</p>
        </motion.div>

        {(() => {
          try {
            return (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {projectsData.map((project, index) => {
                  try {
                    const projectTitle = toSafeString(project?.title, "") || "No Title";
                    const projectDescription = toSafeString(project?.description, "");
                    const imageUrl =
                      toSafeNullableString(project?.thumbnail_url) ??
                      toSafeNullableString((project as { image_url?: unknown })?.image_url);
                    const liveUrl =
                      toSafeNullableString(project?.project_url) ??
                      toSafeNullableString((project as { live_url?: unknown })?.live_url);
                    const githubUrl =
                      toSafeNullableString(project?.repo_url) ??
                      toSafeNullableString((project as { github_url?: unknown })?.github_url);
                    const tags = toSafeTags(project?.tags);
                    const rawStatus = toSafeString(project?.status, "soon").toLowerCase();
                    const status = rawStatus === "live" ? "completed" : rawStatus;
                    const isCompleted = status === "completed";

                    return (
                      <motion.div
                        key={toSafeString(project?.id, `${projectTitle}-${status}-${index}`)}
                        variants={itemVariants}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <Card
                          className={`glass rounded-2xl overflow-hidden group border-border/40 h-full flex flex-col transition-all ${
                            isCompleted
                              ? "border-primary/40 shadow-[0_0_30px_rgba(46,100,23,0.22)]"
                              : "opacity-50 grayscale"
                          }`}
                        >
                          {imageUrl && (
                            <div className="h-44 overflow-hidden border-b border-border/40">
                              <img
                                src={imageUrl}
                                alt={projectTitle || tr("projects.title", "Projects")}
                                className={`h-full w-full object-cover transition-transform duration-500 ${
                                  isCompleted ? "group-hover:scale-105" : ""
                                }`}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          <CardHeader className="pb-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                                {isCompleted ? (
                                  tr("projects.live", "Live")
                                ) : project?.featured ? (
                                  tr("projects.featured", "Featured")
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {tr("projects.coming", "Coming Soon")}
                                  </span>
                                )}
                              </span>
                              <span className="px-2 py-1 text-[11px] rounded-full bg-muted text-muted-foreground">
                                {isCompleted
                                  ? tr("projects.statusCompleted", "Completed")
                                  : status === "in_progress"
                                    ? tr("projects.statusInProgress", "In Progress")
                                    : tr("projects.statusSoon", "Soon")}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{projectTitle}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{projectDescription}</p>
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                  <span key={tag} className="px-2 py-1 text-[11px] rounded-full bg-primary/10 text-primary">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className="pt-0 mt-auto flex flex-wrap gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[120px] rounded-lg"
                              asChild
                              disabled={!githubUrl || !isCompleted}
                            >
                              {githubUrl ? (
                                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                                  <Github className="w-4 h-4 mr-2" />
                                  {tr("projects.code", "View Code")}
                                </a>
                              ) : (
                                <span>{tr("projects.code", "View Code")}</span>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 min-w-[120px] rounded-lg forest-gradient"
                              asChild
                              disabled={!liveUrl || !isCompleted}
                            >
                              {liveUrl ? (
                                <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {tr("projects.view", "View Project")}
                                </a>
                              ) : (
                                <span>{tr("projects.view", "View Project")}</span>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  } catch (projectRenderError) {
                    console.error("Failed to render project card:", projectRenderError);
                    return (
                      <motion.div key={`project-render-error-${index}`} variants={itemVariants}>
                        <Card className="glass rounded-2xl border-border/40">
                          <CardContent className="p-6 text-destructive">
                            {tr("projects.cardError", "Project card failed to render.")}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }
                })}
              </motion.div>
            );
          } catch (projectsRenderError) {
            console.error("Failed to render projects grid:", projectsRenderError);
            return (
              <EmptyProjectsState
                Ar="تعذر عرض المشاريع حالياً."
                En="Unable to render projects right now."
                language={language}
              />
            );
          }
        })()}
      </div>
    </div>
  );
};

export default Projects;
