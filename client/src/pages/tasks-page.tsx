import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Task, User, UserRole } from "@shared/schema";
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
    onSuccess: (data) => {
      console.log("Tasks received:", data);
      if (data.length > 0) {
        data.forEach(task => {
          console.log(`Task ${task.id}: assignedToId=${task.assignedToId} (type: ${typeof task.assignedToId}), deadline=${task.deadline} (type: ${typeof task.deadline})`);
        });
      }
    }
  });
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter users for display - writers see all users for task assignment info
  const displayUsers = user?.role === UserRole.WRITER ? users : users;
  
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
            {/* Writer-specific task view */}
            {user?.role === UserRole.WRITER ? (
              <div className="space-y-8">
                {/* Unassigned Tasks */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Tasks (Unassigned)</h2>
                  <TaskTable 
                    tasks={tasks.filter(task => task.assignedToId === null || task.assignedToId === undefined)}
                    users={displayUsers}
                    isLoading={isLoadingTasks || isLoadingUsers}
                    onTaskCreate={handleCreateTask}
                    onTaskUpdate={handleUpdateTask}
                    canCreateTasks={canCreateTasks}
                  />
                </div>
                
                {/* My Assigned Tasks */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">My Assigned Tasks</h2>
                  <TaskTable 
                    tasks={tasks.filter(task => task.assignedToId === user?.id && task.assignedToId !== null && task.assignedToId !== undefined)}
                    users={displayUsers}
                    isLoading={isLoadingTasks || isLoadingUsers}
                    onTaskCreate={handleCreateTask}
                    onTaskUpdate={handleUpdateTask}
                    canCreateTasks={canCreateTasks}
                  />
                </div>
              </div>
            ) : (
              /* Regular task view for other roles */
              <TaskTable 
                tasks={tasks}
                users={displayUsers}
                isLoading={isLoadingTasks || isLoadingUsers}
                onTaskCreate={handleCreateTask}
                onTaskUpdate={handleUpdateTask}
                canCreateTasks={canCreateTasks}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
