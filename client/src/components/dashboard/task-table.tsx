import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Task, TaskStatus, User } from "@shared/schema";
import { cn, formatDate, getDaysRemaining, getInitials, getStatusColor } from "@/lib/utils";
import { CreateTaskDialog } from "../tasks/create-task-dialog";
import { ViewTaskDialog } from "../tasks/view-task-dialog";
import { EditTaskDialog } from "../tasks/edit-task-dialog";
import { Plus, Trash2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";

interface TaskTableProps {
  tasks: Task[];
  users: User[];
  isLoading?: boolean;
  onTaskCreate?: (data: any) => void;
  onTaskUpdate?: (id: number, data: any) => void;
  onTaskDelete?: (id: number) => void;
  canCreateTasks?: boolean;
  title?: string;
}

export function TaskTable({
  tasks,
  users,
  isLoading = false,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  canCreateTasks = false,
  title = "Tasks",
}: TaskTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest('DELETE', `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user can delete tasks
  const canDeleteTasks = user?.role === UserRole.SUPERADMIN || 
                        user?.role === UserRole.TEAM_LEAD || 
                        user?.role === UserRole.SALES;
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const ITEMS_PER_PAGE = 5;
  
  // Filter tasks by status and search query
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    const statusMatch = statusFilter === "ALL" || task.status === statusFilter;
    
    // Filter by search query (client name, task ID, or task title)
    const searchMatch = searchQuery === "" || 
      task.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toString().includes(searchQuery) ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && searchMatch;
  });
  
  // Paginate tasks
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const getUserById = (id: number | null): User | undefined => {
    if (!id) return undefined;
    return users.find(user => user.id === id);
  };
  
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCreateTask = () => {
    setIsCreateTaskOpen(true);
  };
  
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <h3 className="text-lg font-medium text-gray-800 font-heading">{title}</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by client, ID, or title..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-[220px]"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value={TaskStatus.NEW}>New</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.UNDER_REVIEW}>Under Review</SelectItem>
              <SelectItem value={TaskStatus.SUBMITTED}>Submitted</SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
            </SelectContent>
          </Select>
          
          {canCreateTasks && (
            <Button
              onClick={handleCreateTask}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Word Count
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deadline
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                      <div className="ml-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 mt-1"></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-10 ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => {
                const assignedUser = getUserById(task.assignedToId);
                
                return (
                  <TableRow 
                    key={task.id} 
                    className="hover:bg-gray-50 transition-all duration-150 ease-in-out task-card"
                  >
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        #{task.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignedUser ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-600">
                              {getInitials(assignedUser.fullName)}
                            </span>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                              {assignedUser.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignedUser.role.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {task.wordCount ? `${task.wordCount.toLocaleString()} words` : 'Not specified'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.deadline ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {formatDate(task.deadline)}
                          </div>
                          <div className={cn(
                            "text-xs",
                            getDaysRemaining(task.deadline).includes("Overdue") 
                              ? "text-red-500" 
                              : getDaysRemaining(task.deadline) === "Due today"
                                ? "text-yellow-500"
                                : "text-green-500"
                          )}>
                            {getDaysRemaining(task.deadline)}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No deadline</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        getStatusColor((task.status || 'NEW') as string)
                      )}>
                        {(task.status || 'NEW').replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => handleViewTask(task)}
                        >
                          View
                        </Button>
                        {canCreateTasks && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditTask(task)}
                          >
                            Edit
                          </Button>
                        )}
                        {canDeleteTasks && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredTasks.length}</span>{" "}
                results
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          
          {/* Mobile Pagination */}
          <div className="flex justify-between w-full sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-gray-700 self-center">
              {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreateTask={onTaskCreate}
      />
      
      {/* View Task Dialog */}
      {selectedTask && (
        <ViewTaskDialog
          task={selectedTask}
          assignedUser={getUserById(selectedTask.assignedToId)}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={onTaskUpdate}
          users={users}
        />
      )}
      
      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          users={users}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onUpdateTask={onTaskUpdate}
        />
      )}
    </div>
  );
}
