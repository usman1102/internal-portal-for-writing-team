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
import { ThemeProvider } from "./hooks/use-theme";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <DashboardPage />} />
      <ProtectedRoute path="/tasks" component={() => <TasksPage />} />
      <ProtectedRoute path="/analytics" component={() => <AnalyticsPage />} />
      <ProtectedRoute path="/team" component={() => <TeamPage />} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
