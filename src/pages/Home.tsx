import { motion } from "framer-motion";
import { ArrowRight, Code, Lightbulb, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const Home = () => {
  const { t, isRTL } = useLanguage();

  const features = [
    { icon: Code, label: t("hero.feature.cleanCode") },
    { icon: Lightbulb, label: t("hero.feature.creative") },
    { icon: Rocket, label: t("hero.feature.fast") },
  ];

  return (
    <div className="relative min-h-[calc(100vh-6rem)] flex items-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div
          className="absolute bottom-1/4 -right-1/4 w-80 h-80 bg-sage/30 rounded-full blur-[100px] animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-primary font-medium"
              >
                {t("hero.greeting")}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              >
                <span className="text-gradient-forest">{t("hero.name")}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-muted-foreground"
              >
                {t("hero.title")}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground max-w-lg"
              >
                {t("hero.description")}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Button asChild size="lg" className="forest-gradient text-primary-foreground glow-box rounded-xl">
                <Link to="/projects">
                  {t("hero.cta")}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <Link to="/contact">{t("hero.contact")}</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-6 pt-4"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground">
                  <feature.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm">{feature.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass rounded-3xl p-8 space-y-4 max-w-md"
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-primary/70" />
                </div>
                <div className="font-mono text-sm space-y-2">
                  <p>
                    <span className="text-primary">const</span> developer = {"{"}
                  </p>
                  <p className="pl-4">
                    <span className="text-sage">name</span>: <span className="text-forest-glow">"Khaled Ahmed"</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-sage">age</span>: <span className="text-accent-foreground">16</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-sage">projects</span>:{" "}
                    <span className="text-forest-glow">["KAC8 Empire", "Portfolio"]</span>
                  </p>
                  <p className="pl-4">
                    <span className="text-sage">passion</span>:{" "}
                    <span className="text-forest-glow">"Building the future"</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-sage">skills</span>:{" "}
                    <span className="text-forest-glow">["React", "TypeScript", "Node.js", "Supabase"]</span>
                  </p>
                  <p>{"}"}</p>
                </div>
              </motion.div>

              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sage/20 rounded-full blur-2xl" />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Home;
