import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import CertificatesPage from "./pages/CertificatesPage";
import LoginPage from "./pages/LoginPage";
import MfaPage from "./pages/MfaPage";
import MfaEnrollPage from "./pages/MfaEnrollPage";
import DashboardPage from "./pages/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import { Card, CardContent } from "@/components/ui/card";

const queryClient = new QueryClient();

const SiteLayout = ({ children }: { children: ReactNode }) => <Layout>{children}</Layout>;

const MaintenanceRoute = ({ children }: { children: ReactNode }) => {
  const { enabled, loading } = useMaintenanceMode();
  const { t } = useLanguage();

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen py-20">
          <div className="mx-auto max-w-3xl px-4">
              <Card className="glass rounded-2xl border-border/40">
              <CardContent className="p-6 text-muted-foreground">{t("maintenance.loading")}</CardContent>
            </Card>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (enabled) {
    return (
      <SiteLayout>
        <ComingSoonPage />
      </SiteLayout>
    );
  }

  return <SiteLayout>{children}</SiteLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <MaintenanceRoute>
                    <Home />
                  </MaintenanceRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <MaintenanceRoute>
                    <About />
                  </MaintenanceRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <MaintenanceRoute>
                    <Projects />
                  </MaintenanceRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <MaintenanceRoute>
                    <Support />
                  </MaintenanceRoute>
                }
              />
              <Route
                path="/contact"
                element={
                  <MaintenanceRoute>
                    <Contact />
                  </MaintenanceRoute>
                }
              />

              <Route
                path="/certificates"
                element={
                  <MaintenanceRoute>
                    <CertificatesPage />
                  </MaintenanceRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <SiteLayout>
                    <LoginPage />
                  </SiteLayout>
                }
              />
              <Route
                path="/login/mfa"
                element={
                  <SiteLayout>
                    <MfaPage />
                  </SiteLayout>
                }
              />
              <Route
                path="/login/mfa/enroll"
                element={
                  <SiteLayout>
                    <MfaEnrollPage />
                  </SiteLayout>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <SiteLayout>
                    <ProtectedRoute requireAal2>
                      <DashboardPage />
                    </ProtectedRoute>
                  </SiteLayout>
                }
              />

              <Route
                path="*"
                element={
                  <SiteLayout>
                    <NotFound />
                  </SiteLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
