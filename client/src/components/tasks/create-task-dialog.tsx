import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema, User, UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { formatCurrency } from "@/lib/utils";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask?: (data: any) => void;
  users: User[];
}

export function CreateTaskDialog({
  isOpen,
  onClose,
  onCreateTask,
  users,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only writer users can be assigned to tasks
  const availableWriters = users.filter(user => user.role === UserRole.WRITER && user.status !== 'ON_LEAVE');

  const formSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    deadline: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please select a valid date",
    }),
    status: z.string().default("NEW"),
    projectId: z.number().optional(),
    assignedToId: z.number().optional(),
    budget: z.number().min(0, "Budget cannot be negative").optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      status: "NEW",
      budget: 0,
      projectId: undefined,
      assignedToId: undefined,
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

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      console.log("Form data before processing:", data);
      console.log("Form validation errors:", form.formState.errors);
      
      // Format the data before submitting
      const taskData = {
        ...data,
        deadline: new Date(data.deadline),
        projectId: data.projectId || null,
        assignedToId: data.assignedToId || null,
      };
      
      console.log("Formatted task data:", taskData);
      
      // Call the onCreateTask callback if provided
      if (onCreateTask) {
        console.log("Calling onCreateTask with data:", taskData);
        await onCreateTask(taskData);
      } else {
        console.error("onCreateTask callback is not provided");
        toast({
          title: "Error",
          description: "Task creation handler is not available",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Task created",
        description: "The task has been created successfully",
      });
      
      // Close the dialog and reset the form
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error creating task",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new writing task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation failed:", errors);
          })} className="space-y-4">
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Writer</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select writer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        className="pl-7"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Task budget in USD</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Reference Files</FormLabel>
              <FileUpload
                onUpload={handleUploadFile}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                maxSize={10}
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={() => console.log("Create Task button clicked")}
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
