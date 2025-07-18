import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Task, User, UserRole, Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { TaskTable } from "@/components/dashboard/task-table";

export default function TasksPage() {
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
  
  // Determine if the current user can create tasks
  const canCreateTasks = user?.role === UserRole.SUPERADMIN || user?.role === UserRole.SALES || user?.role === UserRole.TEAM_LEAD;
  
  // Handle creating a task
  const handleCreateTask = async (taskData: any) => {
    return createTaskMutation.mutateAsync(taskData);
  };
  
  // Handle updating a task
  const handleUpdateTask = async (id: number, data: any) => {
    return updateTaskMutation.mutateAsync({ id, data });
  };

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest('DELETE', `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });

  // Handle deleting a task
  const handleDeleteTask = async (id: number) => {
    return deleteTaskMutation.mutateAsync(id);
  };

  // Fetch teams to get proper team structure
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Filter tasks for writers and team leads
  const myTasks = (() => {
    if (user?.role === UserRole.WRITER || user?.role === UserRole.PROOFREADER) {
      return tasks.filter(task => task.assignedToId === user?.id);
    }
    if (user?.role === UserRole.TEAM_LEAD) {
      // Find the team where this user is the team lead
      const teamLedByUser = teams.find(team => team.teamLeadId === user.id);
      if (teamLedByUser) {
        // Get team members (users with the same teamId as the team led by this user)
        const teamMemberIds = users
          .filter(u => u.teamId === teamLedByUser.id && u.id !== user.id)
          .map(u => u.id);
        return tasks.filter(task => task.assignedToId !== null && teamMemberIds.includes(task.assignedToId));
      }
    }
    return [];
  })();
    
  const unassignedTasks = (() => {
    if (user?.role === UserRole.WRITER || user?.role === UserRole.PROOFREADER || user?.role === UserRole.TEAM_LEAD) {
      return tasks.filter(task => task.assignedToId === null || task.assignedToId === undefined);
    }
    return [];
  })();

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Tasks" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={3}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {(user?.role === UserRole.WRITER || user?.role === UserRole.PROOFREADER || user?.role === UserRole.TEAM_LEAD) ? (
              <>
                {/* My Assigned Tasks Table */}
                <TaskTable 
                  tasks={myTasks}
                  users={users}
                  isLoading={isLoadingTasks || isLoadingUsers}
                  onTaskCreate={handleCreateTask}
                  onTaskUpdate={handleUpdateTask}
                  onTaskDelete={handleDeleteTask}
                  canCreateTasks={user?.role === UserRole.TEAM_LEAD}
                  title={user?.role === UserRole.TEAM_LEAD ? "Team Assigned Tasks" : "My Assigned Tasks"}
                />
                
                {/* Unassigned Tasks Table */}
                <TaskTable 
                  tasks={unassignedTasks}
                  users={users}
                  isLoading={isLoadingTasks || isLoadingUsers}
                  onTaskCreate={handleCreateTask}
                  onTaskUpdate={handleUpdateTask}
                  onTaskDelete={handleDeleteTask}
                  canCreateTasks={user?.role === UserRole.TEAM_LEAD}
                  title="Available Tasks"
                />
              </>
            ) : (
              /* All Tasks Table for non-writers */
              <TaskTable 
                tasks={tasks}
                users={users}
                isLoading={isLoadingTasks || isLoadingUsers}
                onTaskCreate={handleCreateTask}
                onTaskUpdate={handleUpdateTask}
                onTaskDelete={handleDeleteTask}
                canCreateTasks={canCreateTasks}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
