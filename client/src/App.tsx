import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { queryClient } from "./lib/queryClient";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TasksPage from "@/pages/tasks-page";
import AnalyticsPage from "@/pages/analytics-page";
import TeamPage from "@/pages/team-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { AuthGuard } from "./components/auth-guard";
import { ThemeProvider } from "./hooks/use-theme";
import { usePWA } from "./hooks/use-pwa";
import { InstallPrompt } from "./components/ui/install-prompt";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={() => <DashboardPage />} />
      <Route path="/tasks" component={() => <TasksPage />} />
      <Route path="/analytics" component={() => <AnalyticsPage />} />
      <Route path="/team" component={() => <TeamPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { canInstall, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Show install prompt after a short delay if app can be installed
    if (canInstall) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // Wait 3 seconds before showing prompt
      
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleInstall = () => {
    installApp();
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <AuthGuard>
              <Router />
            </AuthGuard>
            {showInstallPrompt && !sessionStorage.getItem('pwa-install-dismissed') && (
              <InstallPrompt onInstall={handleInstall} onDismiss={handleDismissInstall} />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
