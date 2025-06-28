import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    console.log('AuthGuard:', { user: !!user, isLoading, location });
    
    // If not loading and no user, redirect to auth page
    if (!isLoading && !user && location !== "/auth") {
      console.log('Redirecting to /auth');
      setLocation("/auth");
    }
    // If user exists and on auth page, redirect to dashboard
    if (!isLoading && user && location === "/auth") {
      console.log('Redirecting to dashboard');
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation]);

  console.log('AuthGuard render:', { user: !!user, isLoading, location });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}