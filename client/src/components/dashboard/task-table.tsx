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
import { Plus } from "lucide-react";

interface TaskTableProps {
  tasks: Task[];
  users: User[];
  isLoading?: boolean;
  onTaskCreate?: (data: any) => void;
  onTaskUpdate?: (id: number, data: any) => void;
  canCreateTasks?: boolean;
}

export function TaskTable({
  tasks,
  users,
  isLoading = false,
  onTaskCreate,
  onTaskUpdate,
  canCreateTasks = false,
}: TaskTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const ITEMS_PER_PAGE = 5;
  
  // Filter tasks by status
  const filteredTasks = statusFilter === "ALL"
    ? tasks
    : tasks.filter(task => task.status === statusFilter);
  
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
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCreateTask = () => {
    setIsCreateTaskOpen(true);
  };
  
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <h3 className="text-lg font-medium text-gray-800 font-heading">Tasks</h3>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value={TaskStatus.NEW}>New</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
              <SelectItem value={TaskStatus.REVISION}>Revision</SelectItem>
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
                Task
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
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
                        getStatusColor(task.status)
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleViewTask(task)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
        users={users}
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
    </div>
  );
}
