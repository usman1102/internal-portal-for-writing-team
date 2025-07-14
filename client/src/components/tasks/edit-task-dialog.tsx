import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Task, User, UserRole, TaskStatus } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  wordCount: z.coerce.number().positive("Word count must be a positive number").optional(),
  clientName: z.string().min(1, "Client name is required"),
  deadline: z.date().optional(),
  assignedToId: z.number().nullable(),
  proofreaderId: z.number().nullable().optional(),
  status: z.string(),
  writerBudget: z.coerce.number().positive().optional(),
  proofreaderBudget: z.coerce.number().positive().optional(),
  tlBudget: z.coerce.number().positive().optional(),
});

interface EditTaskDialogProps {
  task: Task;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (id: number, data: any) => void;
}

export function EditTaskDialog({
  task,
  users,
  isOpen,
  onClose,
  onUpdateTask,
}: EditTaskDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Filter users to only show writers for assignment
  const assignableWriters = users.filter(user => 
    user.role === UserRole.WRITER
  );

  // Filter users to only show proofreaders for assignment
  const assignableProofreaders = users.filter(user => 
    user.role === UserRole.PROOFREADER
  );

  // Check if current user can see budget fields (superadmin or any team lead)
  const canSeeBudget = currentUser && (
    currentUser.role === UserRole.SUPERADMIN ||
    currentUser.role === UserRole.TEAM_LEAD
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      wordCount: task.wordCount || undefined,
      clientName: task.clientName || "",
      deadline: task.deadline ? new Date(task.deadline) : undefined,
      assignedToId: task.assignedToId,
      proofreaderId: task.proofreaderId,
      status: task.status || TaskStatus.NEW,
      writerBudget: task.writerBudget || undefined,
      proofreaderBudget: task.proofreaderBudget || undefined,
      tlBudget: task.tlBudget || undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Format the data before submitting
      const taskData = {
        ...data,
        deadline: data.deadline ? data.deadline.toISOString() : null,
      };

      // Call the onUpdateTask callback if provided
      if (onUpdateTask) {
        await onUpdateTask(task.id, taskData);
      }

      toast({
        title: "Task updated",
        description: "The task has been updated successfully",
      });

      // Reset form and close dialog
      onClose();
    } catch (error) {
      toast({
        title: "Error updating task",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Task Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Word Count */}
              <FormField
                control={form.control}
                name="wordCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Words (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 500"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Name */}
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskStatus.NEW}>New</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.UNDER_REVIEW}>Under Review</SelectItem>
                        <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={TaskStatus.SUBMITTED}>Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assign to Writer */}
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Writer</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "unassigned" ? null : parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : "unassigned"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a writer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {assignableWriters.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName} (writer)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assign to Proofreader */}
              <FormField
                control={form.control}
                name="proofreaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Proofreader</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "unassigned" ? null : parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : "unassigned"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a proofreader" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {assignableProofreaders.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName} (proofreader)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget Fields - Only visible to superadmin and relevant team leads */}
            {canSeeBudget && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Budget (PKR)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Writer Budget */}
                    <FormField
                      control={form.control}
                      name="writerBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Writer's Budget</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter amount in PKR"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Proofreader Budget */}
                    <FormField
                      control={form.control}
                      name="proofreaderBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proofreader's Budget</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter amount in PKR"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* TL Budget */}
                    <FormField
                      control={form.control}
                      name="tlBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TL Budget</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter amount in PKR"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating..." : "Update Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}