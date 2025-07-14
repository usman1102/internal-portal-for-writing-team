import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserRole } from "@shared/schema";
import { LogOut } from "lucide-react";
import { 
  LayoutDashboard,
  ClipboardList,
  Folder,
  Users,
  BarChart3,
  CreditCard
} from "lucide-react";
import { UserProfileDialog } from "@/components/user/user-profile-dialog";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarLink({ href, icon, children, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors",
          active && "bg-gray-100 text-primary"
        )}
      >
        <span className={cn("mr-3", active ? "text-primary" : "text-gray-500")}>
          {icon}
        </span>
        <span>{children}</span>
      </a>
    </Link>
  );
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [showUserProfile, setShowUserProfile] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const sidebarClasses = cn(
    "flex flex-col w-64 bg-white shadow-lg h-screen transition-all duration-300 ease-in-out z-20",
    isOpen ? "fixed inset-y-0 left-0" : "hidden md:flex"
  );

  // Overlay for mobile when sidebar is open
  const overlayClasses = cn(
    "fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden transition-opacity duration-300",
    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  );

  return (
    <>
      <div className={overlayClasses} onClick={onClose}></div>
      <div className={sidebarClasses}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary font-heading">
            Paper Slay
          </h1>
          <p className="text-sm text-gray-500">Freelance Management</p>
        </div>

        <div className="p-2">
          <div 
            className="p-2 mb-2 flex items-center cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setShowUserProfile(true)}
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span>{getInitials(user.fullName)}</span>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-gray-500">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <SidebarLink 
            href="/" 
            icon={<LayoutDashboard size={18} />} 
            active={location === '/'}
          >
            Dashboard
          </SidebarLink>
          
          <SidebarLink 
            href="/tasks" 
            icon={<ClipboardList size={18} />} 
            active={location === '/tasks'}
          >
            Tasks
          </SidebarLink>

          <SidebarLink 
            href="/analytics" 
            icon={<BarChart3 size={18} />} 
            active={location === '/analytics'}
          >
            Analytics
          </SidebarLink>
          
          {(user.role === UserRole.SUPERADMIN || user.role === UserRole.TEAM_LEAD) && (
            <SidebarLink 
              href="/team" 
              icon={<Users size={18} />} 
              active={location === '/team'}
            >
              Team
            </SidebarLink>
          )}

          <SidebarLink 
            href="/payments" 
            icon={<CreditCard size={18} />} 
            active={location === '/payments'}
          >
            Payments
          </SidebarLink>


        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
            {logoutMutation.isPending && (
              <span className="ml-2 animate-spin">⏳</span>
            )}
          </Button>
        </div>

        {user && (
          <UserProfileDialog
            user={user}
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
            isOwnProfile={true}
          />
        )}
      </div>
    </>
  );
}
