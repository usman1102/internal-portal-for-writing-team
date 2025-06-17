import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, TaskStatus, User, UserRole, File as TaskFile, FileCategory, Comment } from "@shared/schema";
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
  Plus,
  Send,
  MessageCircle
} from "lucide-react";
import { formatDate, formatDateTime, getDaysRemaining, getInitials, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CelebrationAnimation } from "@/components/animations/celebration";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string(),
  assignedToId: z.number().nullable(),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

type FormData = z.infer<typeof formSchema>;
type CommentFormData = z.infer<typeof commentSchema>;

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "files" | "comments">("details");

  const { toast } = useToast();
  const { user } = useAuth();

  // File deletion mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${task.id}`] });
      toast({
        title: "File deleted",
        description: "File has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ files, category }: { files: FileList; category: FileCategory }) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('taskId', task.id.toString());
      formData.append('category', category);
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${task.id}`] });
      toast({
        title: "Files uploaded",
        description: "Files have been uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading files",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      return await apiRequest('POST', '/api/comments', {
        ...data,
        taskId: task.id,
        userId: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${task.id}`] });
      commentForm.reset();
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch files
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: [`/api/files/${task.id}`],
    enabled: isOpen,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: [`/api/comments/${task.id}`],
    enabled: isOpen,
  });

  // Comment form
  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  // Helper functions
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (files: FileList | null, category: FileCategory) => {
    if (!files || files.length === 0) return;
    uploadFileMutation.mutate({ files, category });
  };

  // Permission checks
  const canComment = user && (
    user.role === UserRole.SUPERADMIN ||
    user.role === UserRole.SALES ||
    user.role === UserRole.TEAM_LEAD ||
    (task.assignedToId && user.id === task.assignedToId)
  );

  const canUploadInstructions = user && (
    user.role === UserRole.SUPERADMIN ||
    user.role === UserRole.SALES ||
    user.role === UserRole.TEAM_LEAD
  );

  const canDeleteInstructionFiles = (file: TaskFile) => {
    return user && (
      user.role === UserRole.SUPERADMIN ||
      user.role === UserRole.SALES ||
      user.role === UserRole.TEAM_LEAD ||
      file.uploadedById === user.id
    );
  };

  // Filter files by category
  const instructionFiles = files.filter((f: TaskFile) => f.category === FileCategory.INSTRUCTION);
  const draftFiles = files.filter((f: TaskFile) => f.category === FileCategory.DRAFT);
  const finalFiles = files.filter((f: TaskFile) => f.category === FileCategory.FINAL);
  const feedbackFiles = files.filter((f: TaskFile) => f.category === FileCategory.FEEDBACK);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsSubmitting(true);
      
      if (onUpdateTask) {
        await onUpdateTask(task.id, { status: newStatus });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
      
      if (newStatus === TaskStatus.COMPLETED) {
        setShowCelebration(true);
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

  const canEdit = true;

  const handleCommentSubmit = async (data: CommentFormData) => {
    if (!user) return;
    await createCommentMutation.mutateAsync(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[800px] lg:max-w-[1000px] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold truncate">
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

        <Separator className="flex-shrink-0" />

        <div className="flex-1 min-h-0 flex flex-col p-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4 overflow-hidden">
              <div className="h-full overflow-x-auto overflow-y-auto">
                <TabsContent value="details" className="space-y-4 p-1">
                  <div className="min-w-[600px] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <UserIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium">Assigned to:</span>
                          {assignedUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(assignedUser.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{assignedUser.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Unassigned</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <CalendarDays className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Word count:</span>
                            <span>{task.wordCount} words</span>
                          </div>
                        </div>
                      )}

                      {task.clientName && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <UserIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Client:</span>
                            <span className="truncate">{task.clientName}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium">Created:</span>
                          <span>{task.createdAt ? formatDateTime(task.createdAt) : 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description:</label>
                      <div className="p-3 bg-gray-50 rounded-md min-h-[100px] max-h-[200px] overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap break-words">
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
                  </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-6 p-1">
                  <div className="min-w-[600px] space-y-6">
                    {filesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading files...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Files feature coming soon</p>
                          <p className="text-sm text-gray-400">File upload and management will be available here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="space-y-6 p-1">
                  <div className="min-w-[600px] space-y-6">
                    {commentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading comments...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageCircle className="h-5 w-5 text-gray-500" />
                          <h3 className="text-lg font-medium">Comments ({comments?.length || 0})</h3>
                        </div>

                        {comments && comments.length > 0 ? (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {comments.map((comment: Comment) => {
                              const commentUser = users.find(u => u.id === comment.userId);
                              return (
                                <div key={comment.id} className="border-b pb-4 last:border-b-0">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                      <AvatarFallback className="text-xs">
                                        {commentUser ? getInitials(commentUser.fullName) : '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm truncate">
                                          {commentUser?.fullName || 'Unknown User'}
                                        </span>
                                        <span className="text-xs text-gray-500 flex-shrink-0">
                                          {comment.createdAt ? formatDateTime(comment.createdAt) : ''}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No comments yet</p>
                            <p className="text-sm text-gray-400">Be the first to comment on this task</p>
                          </div>
                        )}

                        {canComment && (
                          <div className="border-t pt-4">
                            <Form {...commentForm}>
                              <form onSubmit={commentForm.handleSubmit(handleCommentSubmit)} className="space-y-3">
                                <FormField
                                  control={commentForm.control}
                                  name="content"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Add a comment</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Type your comment here..." 
                                          className="min-h-[80px] resize-vertical"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end">
                                  <Button 
                                    type="submit" 
                                    disabled={createCommentMutation.isPending}
                                    className="flex items-center gap-2"
                                  >
                                    <Send className="h-4 w-4" />
                                    {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </div>
                        )}
                        
                        {!canComment && (
                          <div className="border-t pt-4 text-center">
                            <p className="text-sm text-gray-500">
                              You need appropriate permissions to comment on this task
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 p-6 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      <CelebrationAnimation 
        isVisible={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
    </Dialog>
  );
}