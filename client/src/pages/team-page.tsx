import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, UserRole, Task } from "@shared/schema";
import { 
  cn, 
  getInitials, 
  getStatusColor 
} from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  ClipboardList, 
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch tasks (for user details view)
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Add new team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddMemberOpen(false);
      toast({
        title: "Team member added",
        description: "The new team member has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding team member",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditMemberOpen(false);
      toast({
        title: "User updated",
        description: "Team member has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "Team member has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Status updated",
        description: "Team member status has been updated",
      });
    }
  });
  
  // New team member form schema
  const addMemberSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum([UserRole.SUPERADMIN, UserRole.SALES, UserRole.TEAM_LEAD, UserRole.WRITER, UserRole.PROOFREADER]),
  });
  
  const form = useForm<z.infer<typeof addMemberSchema>>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: UserRole.WRITER,
    },
  });
  
  // Handle adding a new team member
  const onSubmit = (data: z.infer<typeof addMemberSchema>) => {
    addMemberMutation.mutate(data);
  };
  
  // Handle viewing user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };
  
  // Handle updating user status
  const handleUpdateStatus = (id: number, status: string) => {
    updateUserStatusMutation.mutate({ id, status });
  };

  // Handle editing user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status || 'ACTIVE'
    });
    setIsEditMemberOpen(true);
  };

  // Handle deleting user
  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  // Group users by role
  const writerUsers = users.filter(user => user.role === UserRole.WRITER);
  const proofreaderUsers = users.filter(user => user.role === UserRole.PROOFREADER);
  const managementUsers = users.filter(user => 
    user.role === UserRole.SALES || user.role === UserRole.TEAM_LEAD
  );
  
  // Check if current user can add team members
  const canAddMembers = user?.role === UserRole.SUPERADMIN || user?.role === UserRole.TEAM_LEAD;
  
  // Get user tasks
  const getUserTasks = (userId: number) => {
    return tasks.filter(task => task.assignedToId === userId);
  };
  
  // Get color for role badge
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.SALES:
        return "bg-secondary text-white";
      case UserRole.TEAM_LEAD:
        return "bg-primary text-white";
      case UserRole.WRITER:
        return "bg-success text-white";
      case UserRole.PROOFREADER:
        return "bg-warning text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  
  const getAvatarColorByRole = (role: string) => {
    switch (role) {
      case UserRole.SALES:
        return "bg-secondary";
      case UserRole.TEAM_LEAD:
        return "bg-primary";
      case UserRole.WRITER:
        return "bg-success";
      case UserRole.PROOFREADER:
        return "bg-warning";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Team" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
              
              {canAddMembers && (
                <Button onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  All Members
                </TabsTrigger>
                <TabsTrigger value="writers" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Writers
                </TabsTrigger>
                <TabsTrigger value="proofreaders" className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Proofreaders
                </TabsTrigger>
                <TabsTrigger value="management" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Management
                </TabsTrigger>
              </TabsList>
              
              {/* All Team Members */}
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>All Team Members</CardTitle>
                    <CardDescription>
                      View and manage all team members across different roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : users.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center text-white",
                                    getAvatarColorByRole(member.role)
                                  )}>
                                    <span>{getInitials(member.fullName)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {member.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      @{member.username}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getRoleBadgeColor(member.role)}>
                                  {member.role.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(member.status || 'AVAILABLE')}>
                                  {(member.status || 'Available').replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewUser(member)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <p>No team members found</p>
                        {canAddMembers && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setIsAddMemberOpen(true)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" /> Add Your First Team Member
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Writers Tab */}
              <TabsContent value="writers">
                <Card>
                  <CardHeader>
                    <CardTitle>Writers</CardTitle>
                    <CardDescription>
                      Team members responsible for creating content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : writerUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {writerUsers.map((writer) => (
                            <TableRow key={writer.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center text-white">
                                    <span>{getInitials(writer.fullName)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {writer.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      @{writer.username}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{writer.email}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(writer.status || 'AVAILABLE')}>
                                  {(writer.status || 'Available').replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewUser(writer)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <p>No writers found</p>
                        {canAddMembers && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setIsAddMemberOpen(true)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" /> Add Writer
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Proofreaders Tab */}
              <TabsContent value="proofreaders">
                <Card>
                  <CardHeader>
                    <CardTitle>Proofreaders</CardTitle>
                    <CardDescription>
                      Team members responsible for reviewing and proofreading content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : proofreaderUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proofreaderUsers.map((proofreader) => (
                            <TableRow key={proofreader.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-warning flex items-center justify-center text-white">
                                    <span>{getInitials(proofreader.fullName)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {proofreader.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      @{proofreader.username}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{proofreader.email}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(proofreader.status || 'AVAILABLE')}>
                                  {(proofreader.status || 'Available').replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewUser(proofreader)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <p>No proofreaders found</p>
                        {canAddMembers && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setIsAddMemberOpen(true)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" /> Add Proofreader
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Management Tab */}
              <TabsContent value="management">
                <Card>
                  <CardHeader>
                    <CardTitle>Management</CardTitle>
                    <CardDescription>
                      Team leads and sales personnel managing the content creation process
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : managementUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {managementUsers.map((manager) => (
                            <TableRow key={manager.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center text-white",
                                    manager.role === UserRole.SALES ? "bg-secondary" : "bg-primary"
                                  )}>
                                    <span>{getInitials(manager.fullName)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {manager.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      @{manager.username}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getRoleBadgeColor(manager.role)}>
                                  {manager.role.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{manager.email}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(manager.status || 'AVAILABLE')}>
                                  {(manager.status || 'Available').replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewUser(manager)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <p>No management personnel found</p>
                        {canAddMembers && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setIsAddMemberOpen(true)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" /> Add Manager
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new account for a team member
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.WRITER}>Writer</SelectItem>
                        <SelectItem value={UserRole.PROOFREADER}>Proofreader</SelectItem>
                        {user?.role === UserRole.SUPERADMIN && (
                          <>
                            <SelectItem value={UserRole.TEAM_LEAD}>Team Lead</SelectItem>
                            <SelectItem value={UserRole.SALES}>Sales</SelectItem>
                            <SelectItem value={UserRole.SUPERADMIN}>Super Admin</SelectItem>
                          </>
                        )}
                        {user?.role === UserRole.TEAM_LEAD && (
                          <SelectItem value={UserRole.TEAM_LEAD}>Team Lead</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Team Member Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center text-white text-xl",
                  getAvatarColorByRole(selectedUser.role)
                )}>
                  <span>{getInitials(selectedUser.fullName)}</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                  <div className="flex items-center mt-1">
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role.replace('_', ' ')}
                    </Badge>
                    <span className="mx-2 text-gray-400">•</span>
                    <Badge className={getStatusColor(selectedUser.status || 'AVAILABLE')}>
                      {(selectedUser.status || 'Available').replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">@{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedUser.status === 'AVAILABLE' ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedUser.id, 'AVAILABLE')}
                  >
                    Available
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedUser.status === 'BUSY' ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedUser.id, 'BUSY')}
                  >
                    Busy
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedUser.status === 'ON_LEAVE' ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedUser.id, 'ON_LEAVE')}
                  >
                    On Leave
                  </Button>
                </div>
              </div>
              
              {selectedUser.role === UserRole.WRITER && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2">Assigned Tasks</h4>
                  {isLoadingTasks ? (
                    <div className="animate-pulse space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-8 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {getUserTasks(selectedUser.id).length > 0 ? (
                        <ul className="space-y-2">
                          {getUserTasks(selectedUser.id).map(task => (
                            <li key={task.id} className="flex justify-between border-b pb-2">
                              <span className="text-sm">{task.title}</span>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No tasks assigned</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUserDetailsOpen(false)}
              >
                Close
              </Button>
              {selectedUser.role === UserRole.WRITER && (
                <Button>
                  View All Tasks
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
