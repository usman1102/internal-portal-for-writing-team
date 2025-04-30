import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Task, TaskStatus, User, UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  formatCurrency, 
  formatDate, 
  getDaysRemaining, 
  getInitials, 
  getStatusColor 
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

interface ViewTaskDialogProps {
  task: Task;
  assignedUser?: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (id: number, data: any) => void;
  users: User[];
}

export function ViewTaskDialog({
  task,
  assignedUser,
  isOpen,
  onClose,
  onUpdateTask,
  users,
}: ViewTaskDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine permissions based on user role
  const canEditTask = currentUser?.role === UserRole.SALES || currentUser?.role === UserRole.TEAM_LEAD;
  const canAssignTask = currentUser?.role === UserRole.SALES || currentUser?.role === UserRole.TEAM_LEAD;
  const canSubmitWork = currentUser?.role === UserRole.WRITER && task.assignedToId === currentUser?.id;
  const canUpdateStatus = currentUser?.role === UserRole.SALES || 
                           currentUser?.role === UserRole.TEAM_LEAD ||
                           (currentUser?.role === UserRole.WRITER && task.assignedToId === currentUser?.id) ||
                           (currentUser?.role === UserRole.PROOFREADER);
  
  // Available writers for assignment
  const availableWriters = users.filter(user => 
    user.role === UserRole.WRITER && (user.status !== 'ON_LEAVE' || user.id === task.assignedToId)
  );

  // Form schema for task updates
  const formSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    deadline: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please select a valid date",
    }),
    status: z.string(),
    assignedToId: z.number().nullable(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
      status: task.status,
      assignedToId: task.assignedToId,
    },
  });

  const handleUploadFile = async (file: File) => {
    // This would normally upload the file to a server or storage service
    return new Promise<void>((resolve) => {
      // Simulate an upload delay
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Format the data before submitting
      const taskData = {
        ...data,
        deadline: new Date(data.deadline),
      };
      
      // Call the onUpdateTask callback if provided
      if (onUpdateTask) {
        await onUpdateTask(task.id, taskData);
      }
      
      toast({
        title: "Task updated",
        description: "The task has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error updating task",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsSubmitting(true);
      
      // Update the form value
      form.setValue("status", newStatus);
      
      // Call the onUpdateTask callback if provided
      if (onUpdateTask) {
        await onUpdateTask(task.id, { status: newStatus });
      }
      
      toast({
        title: "Status updated",
        description: `Task status has been updated to ${newStatus.replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error updating status",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit" disabled={!canEditTask}>Edit</TabsTrigger>
            <TabsTrigger value="submit" disabled={!canSubmitWork}>Submit Work</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  Project ID: {task.projectId || 'Unassigned'}
                </p>
              </div>
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm">Description</h4>
                <p className="mt-1 text-sm text-gray-600">{task.description || 'No description provided'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Assigned To</h4>
                  {assignedUser ? (
                    <div className="mt-1 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {getInitials(assignedUser.fullName)}
                        </span>
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">{assignedUser.fullName}</div>
                        <div className="text-xs text-gray-500">{assignedUser.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">Unassigned</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-sm">Deadline</h4>
                  {task.deadline ? (
                    <div className="mt-1">
                      <p className="text-sm">{formatDate(task.deadline)}</p>
                      <p className="text-xs text-red-500">{getDaysRemaining(task.deadline)}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No deadline set</p>
                  )}
                </div>

                {task.budget !== null && task.budget !== undefined && (
                  <div>
                    <h4 className="font-medium text-sm">Budget</h4>
                    <p className="mt-1 text-sm">{formatCurrency(task.budget)}</p>
                  </div>
                )}
              </div>
            </div>

            {canUpdateStatus && (
              <div className="pt-4">
                <h4 className="font-medium text-sm mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(TaskStatus).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={task.status === status ? "default" : "outline"}
                      onClick={() => handleStatusChange(status as TaskStatus)}
                      disabled={isSubmitting || task.status === status}
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {canAssignTask && (
                    <FormField
                      control={form.control}
                      name="assignedToId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Writer</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select writer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {availableWriters.map((writer) => (
                                <SelectItem key={writer.id} value={writer.id.toString()}>
                                  {writer.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("details")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Submit Work Tab */}
          <TabsContent value="submit" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Submit Your Work</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Final Document
                  </label>
                  <FileUpload
                    onUpload={handleUploadFile}
                    accept=".pdf,.doc,.docx,.txt"
                    maxSize={10}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Add any additional notes or context about your submission"
                    className="mt-1"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("details")}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Work submitted",
                        description: "Your work has been submitted successfully",
                      });
                      handleStatusChange(TaskStatus.REVIEW);
                      setActiveTab("details");
                    }}
                  >
                    Submit Work
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
