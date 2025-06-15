import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Task, TaskStatus, User, UserRole, File } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CalendarDays, 
  User as UserIcon, 
  FileText, 
  Upload,
  Clock,
  Hash,
  Download,
  Image,
  File as FileIcon
} from "lucide-react";
import { formatDate, formatDateTime, getDaysRemaining, getInitials, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string(),
  assignedToId: z.number().nullable(),
});

type FormData = z.infer<typeof formSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  // Fetch files for this task
  const { data: files = [], isLoading: filesLoading } = useQuery<File[]>({
    queryKey: [`/api/files/${task.id}`],
    enabled: isOpen && !!task.id,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
      status: (task.status || TaskStatus.NEW) as string,
      assignedToId: task.assignedToId,
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadFile = async (file: File) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsSubmitting(true);
      if (onUpdateTask) {
        await onUpdateTask(task.id, { status: newStatus });
      }
      toast({
        title: "Status updated",
        description: `Task status changed to ${newStatus.replace('_', ' ')}`,
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

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      if (onUpdateTask) {
        const updateData = {
          ...data,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        };
        await onUpdateTask(task.id, updateData);
      }

      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });

      onClose();
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

  const canEdit = true; // For now, allow all users to edit

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {task.title}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Task ID: #{task.id}
              </p>
            </div>
            <Badge className={getStatusColor((task.status || TaskStatus.NEW) as string)}>
              {(task.status || TaskStatus.NEW).replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[60vh] mt-4">
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Assigned to:</span>
                    {assignedUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(assignedUser.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{assignedUser.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Due date:</span>
                    {task.deadline ? (
                      <div className="flex flex-col">
                        <span>{formatDate(task.deadline)}</span>
                        <span className="text-xs text-gray-500">
                          {getDaysRemaining(task.deadline)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">No deadline</span>
                    )}
                  </div>
                </div>

                {task.wordCount && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Word count:</span>
                      <span>{task.wordCount} words</span>
                    </div>
                  </div>
                )}

                {task.clientName && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Client:</span>
                      <span>{task.clientName}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Created:</span>
                    <span>{task.createdAt ? formatDateTime(task.createdAt) : 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description:</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {task.description || "No description provided"}
                  </p>
                </div>
              </div>

              {canEdit && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Update Status:</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(TaskStatus).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={(task.status || TaskStatus.NEW) === status ? "default" : "outline"}
                        onClick={() => handleStatusChange(status as TaskStatus)}
                        disabled={isSubmitting || (task.status || TaskStatus.NEW) === status}
                      >
                        {status.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              {filesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading files...</p>
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload More
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                      >
                        <div className="h-10 w-10 bg-white rounded flex items-center justify-center border">
                          {getFileIcon(file.fileType)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDateTime(file.uploadedAt!)}</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No files uploaded yet</p>
                  <Button variant="outline" className="mt-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="text-center py-8">
                <p className="text-gray-500">No comments yet</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}