import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, TaskStatus, User, UserRole, File as TaskFile, FileCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  File as FileIcon,
  X,
  Plus
} from "lucide-react";
import { formatDate, formatDateTime, getDaysRemaining, getInitials, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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

  // File deletion mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${task.id}`] });
      toast({
        title: "File deleted",
        description: "File has been removed successfully",
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
  const [activeTab, setActiveTab] = useState("details");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: File[] }>({
    DRAFT: [],
    FINAL: [],
    FEEDBACK: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch files for this task
  const { data: files = [], isLoading: filesLoading } = useQuery<TaskFile[]>({
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

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ files, category }: { files: File[], category: FileCategory }) => {
      const uploadPromises = files.map(async (file) => {
        // Convert file to base64
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix to get just the base64 content
            const base64Content = result.split(',')[1];
            resolve(base64Content);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        return apiRequest('POST', '/api/files', {
          taskId: task.id,
          uploadedById: task.assignedToId || 1, // This will be set by the server based on authenticated user
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileContent,
          category,
        });
      });
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${task.id}`] });
      setUploadingFiles({ DRAFT: [], FINAL: [], FEEDBACK: [] });
      toast({
        title: "Files uploaded successfully",
        description: "Your files have been uploaded to the task",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Categorize files by type
  const instructionFiles = files.filter(f => f.category === 'INSTRUCTION');
  const draftFiles = files.filter(f => f.category === 'DRAFT');
  const finalFiles = files.filter(f => f.category === 'FINAL');
  const feedbackFiles = files.filter(f => f.category === 'FEEDBACK');

  // File upload handlers
  const handleFileUpload = (fileList: FileList | null, category: string) => {
    if (!fileList) return;
    
    const filesArray = Array.from(fileList);
    
    // Validate file sizes
    const validFiles = filesArray.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      uploadFileMutation.mutate({ files: validFiles, category: category as FileCategory });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files, category);
  }, []);

  // Check user permissions for file uploads
  const canUploadInstructions = user?.role === UserRole.SUPERADMIN || 
                               user?.role === UserRole.SALES ||
                               user?.role === UserRole.TEAM_LEAD;
  const canUploadDrafts = task.assignedToId === assignedUser?.id && (assignedUser?.role === UserRole.WRITER);
  const canUploadFinal = task.assignedToId === assignedUser?.id && (assignedUser?.role === UserRole.WRITER);
  const canUploadFeedback = user?.role === UserRole.SUPERADMIN ||
                           user?.role === UserRole.TEAM_LEAD ||
                           user?.role === UserRole.PROOFREADER;
  
  // Check permissions for file deletion/management
  const canManageFiles = user?.role === UserRole.SUPERADMIN || 
                        user?.role === UserRole.TEAM_LEAD ||
                        (task.assignedToId === user?.id && 
                         (user?.role === UserRole.WRITER || user?.role === UserRole.PROOFREADER));

  // Special permission for sales to delete instruction files they uploaded
  const canDeleteInstructionFiles = (file: any) => {
    if (user?.role === UserRole.SUPERADMIN || user?.role === UserRole.TEAM_LEAD) return true;
    if (user?.role === UserRole.SALES && file.category === 'INSTRUCTION') return true;
    if (task.assignedToId === user?.id && 
        (user?.role === UserRole.WRITER || user?.role === UserRole.PROOFREADER)) return true;
    return false;
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsSubmitting(true);
      if (onUpdateTask) {
        await onUpdateTask(task.id, { status: newStatus });
        // Force refresh all task queries to ensure consistency across all views
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
        // Force refresh all task queries to ensure consistency across all views
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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

            <TabsContent value="files" className="space-y-6">
              {filesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading files...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Instruction Files Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h4 className="text-sm font-medium">Instruction Files ({instructionFiles.length})</h4>
                      </div>
                      {canUploadInstructions && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'INSTRUCTION');
                            input.click();
                          }}
                          disabled={uploadFileMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Upload Instructions
                        </Button>
                      )}
                    </div>
                    {instructionFiles.length > 0 ? (
                      <div className="space-y-2">
                        {instructionFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.fileSize)} • {formatDateTime(file.uploadedAt!)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:bg-blue-100"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/files/download/${file.id}`;
                                  link.download = file.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {canDeleteInstructionFiles(file) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteFileMutation.mutate(file.id)}
                                  disabled={deleteFileMutation.isPending}
                                  className="text-red-600 hover:bg-red-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No instruction files</p>
                    )}
                  </div>

                  {/* Draft Files Section - Writers can upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-yellow-600" />
                        <h4 className="text-sm font-medium">Draft Files ({draftFiles.length})</h4>
                      </div>
                      {canUploadDrafts && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'DRAFT');
                            input.click();
                          }}
                          disabled={uploadFileMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Upload Draft
                        </Button>
                      )}
                    </div>
                    {draftFiles.length > 0 ? (
                      <div className="space-y-2">
                        {draftFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                          >
                            <div className="h-8 w-8 bg-yellow-100 rounded flex items-center justify-center">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.fileSize)} • {formatDateTime(file.uploadedAt!)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-yellow-600 hover:bg-yellow-100"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/files/download/${file.id}`;
                                  link.download = file.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {canManageFiles && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteFileMutation.mutate(file.id)}
                                  disabled={deleteFileMutation.isPending}
                                  className="text-red-600 hover:bg-red-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No draft files uploaded yet</p>
                    )}
                  </div>

                  {/* Final Files Section - Writers can upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <h4 className="text-sm font-medium">Final Submission ({finalFiles.length})</h4>
                      </div>
                      {canUploadFinal && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'FINAL');
                            input.click();
                          }}
                          disabled={uploadFileMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Upload Final
                        </Button>
                      )}
                    </div>
                    {finalFiles.length > 0 ? (
                      <div className="space-y-2">
                        {finalFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.fileSize)} • {formatDateTime(file.uploadedAt!)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:bg-green-100"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/files/download/${file.id}`;
                                  link.download = file.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {canManageFiles && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteFileMutation.mutate(file.id)}
                                  disabled={deleteFileMutation.isPending}
                                  className="text-red-600 hover:bg-red-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No final files submitted yet</p>
                    )}
                  </div>

                  {/* Feedback Files Section - Proofreaders can upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <h4 className="text-sm font-medium">Feedback Files ({feedbackFiles.length})</h4>
                      </div>
                      {canUploadFeedback && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'FEEDBACK');
                            input.click();
                          }}
                          disabled={uploadFileMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Upload Feedback
                        </Button>
                      )}
                    </div>
                    {feedbackFiles.length > 0 ? (
                      <div className="space-y-2">
                        {feedbackFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                          >
                            <div className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.fileSize)} • {formatDateTime(file.uploadedAt!)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-purple-600 hover:bg-purple-100"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/files/download/${file.id}`;
                                  link.download = file.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {canManageFiles && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteFileMutation.mutate(file.id)}
                                  disabled={deleteFileMutation.isPending}
                                  className="text-red-600 hover:bg-red-100"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No feedback files uploaded yet</p>
                    )}
                  </div>
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