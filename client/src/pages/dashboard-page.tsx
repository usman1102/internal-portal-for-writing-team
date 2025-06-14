import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Task, User, Activity, UserRole, Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TaskTable } from "@/components/dashboard/task-table";
import { TeamMembers } from "@/components/dashboard/team-members";
import { ProjectAnalytics } from "@/components/dashboard/project-analytics";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  ClipboardList,
  Users,
  HourglassIcon,
  CheckCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Fetch teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await apiRequest("POST", "/api/tasks", taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });
  
  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }
  });
  
  // Calculate dashboard statistics
  const activeTasksCount = tasks.filter(task => 
    task.status !== 'COMPLETED'
  ).length;
  
  // Filter users based on role - TEAM_LEAD sees only their team members
  const filteredUsers = user?.role === UserRole.TEAM_LEAD 
    ? users.filter(u => {
        // For team leads, show only writers and proofreaders from teams they lead
        // Find teams led by current user
        const teamsLedByUser = users.filter(teamMember => 
          teamMember.teamId && 
          users.some(lead => lead.id === user.id && lead.role === UserRole.TEAM_LEAD)
        );
        
        // Show writers and proofreaders from those teams
        return (u.role === UserRole.WRITER || u.role === UserRole.PROOFREADER) && 
               u.teamId && teamsLedByUser.some(member => member.teamId === u.teamId);
      })
    : users.filter(user => 
        user.role === UserRole.WRITER || 
        user.role === UserRole.PROOFREADER ||
        user.role === UserRole.TEAM_LEAD ||
        user.role === UserRole.SALES ||
        user.role === UserRole.SUPERADMIN
      );

  const availableWritersCount = filteredUsers.filter(user => 
    user.role === UserRole.WRITER && user.status === 'AVAILABLE'
  ).length;
  
  const pendingReviewsCount = tasks.filter(task => 
    task.status === 'REVIEW'
  ).length;
  
  const completedThisWeekCount = tasks.filter(task => {
    if (task.status !== 'COMPLETED') return false;
    const submissionDate = task.submissionDate ? new Date(task.submissionDate) : null;
    if (!submissionDate) return false;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return submissionDate >= oneWeekAgo;
  }).length;
  
  // Mock analytics data (would be fetched from API in a real app)
  const analyticsData = [
    { name: "Blog", completed: 15, inProgress: 5, revision: 2 },
    { name: "Social", completed: 8, inProgress: 3, revision: 1 },
    { name: "Email", completed: 10, inProgress: 2, revision: 0 },
    { name: "SEO", completed: 12, inProgress: 7, revision: 3 },
    { name: "Product", completed: 6, inProgress: 4, revision: 1 }
  ];
  
  const turnAroundTime = { value: 2.3, change: 8 };
  const revisionRate = { value: 15, change: -3 };
  
  // Determine if the current user can create tasks
  const canCreateTasks = user?.role === UserRole.SALES || user?.role === UserRole.TEAM_LEAD;
  
  // Handle creating a task
  const handleCreateTask = async (taskData: any) => {
    return createTaskMutation.mutateAsync(taskData);
  };
  
  // Handle updating a task
  const handleUpdateTask = async (id: number, data: any) => {
    return updateTaskMutation.mutateAsync({ id, data });
  };
  
  // Handle updating a user's status
  const handleUpdateUserStatus = async (id: number, status: string) => {
    return updateUserStatusMutation.mutateAsync({ id, status });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Dashboard" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={3}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard 
                title="Active Tasks" 
                value={activeTasksCount} 
                icon={<ClipboardList className="h-6 w-6" />} 
                iconColor="primary" 
              />
              
              <StatsCard 
                title="Writers Available" 
                value={availableWritersCount} 
                icon={<Users className="h-6 w-6" />} 
                iconColor="secondary" 
              />
              
              <StatsCard 
                title="Pending Reviews" 
                value={pendingReviewsCount} 
                icon={<HourglassIcon className="h-6 w-6" />} 
                iconColor="warning" 
              />
              
              <StatsCard 
                title="Completed This Week" 
                value={completedThisWeekCount} 
                icon={<CheckCircle className="h-6 w-6" />} 
                iconColor="success" 
              />
            </div>
            
            {/* Task Table */}
            <TaskTable 
              tasks={tasks.slice(0, 5)} // Show only 5 most recent tasks on dashboard
              users={users}
              isLoading={isLoadingTasks}
              onTaskCreate={handleCreateTask}
              onTaskUpdate={handleUpdateTask}
              canCreateTasks={canCreateTasks}
            />
            
            {/* Team Members and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TeamMembers 
                members={users}
                isLoading={isLoadingUsers}
                onUpdateStatus={handleUpdateUserStatus}
              />
              
              <div className="lg:col-span-2">
                <ProjectAnalytics 
                  data={analyticsData}
                  turnAroundTime={turnAroundTime}
                  revisionRate={revisionRate}
                  isLoading={false}
                />
              </div>
            </div>
            
            {/* Recent Activity */}
            <RecentActivity 
              activities={activities.slice(0, 4)} // Show only 4 most recent activities
              isLoading={isLoadingActivities}
              onViewAllActivity={() => {}}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
