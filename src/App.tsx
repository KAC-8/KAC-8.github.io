import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import Home from "./pages/Home";
import { Card, CardContent } from "@/components/ui/card";

const About = lazy(() => import("./pages/About"));
const Projects = lazy(() => import("./pages/Projects"));
const Support = lazy(() => import("./pages/Support"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const MfaPage = lazy(() => import("./pages/MfaPage"));
const MfaEnrollPage = lazy(() => import("./pages/MfaEnrollPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));

const queryClient = new QueryClient();

const SiteLayout = ({ children }: { children: ReactNode }) => <Layout>{children}</Layout>;

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

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
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
