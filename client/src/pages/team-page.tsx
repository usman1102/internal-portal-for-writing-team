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
import { User, UserRole, Task, Team, insertTeamSchema, insertUserSchema } from "@shared/schema";
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
  Mail,
  Building,
  Plus,
  Edit3,
  Trash2
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
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch tasks (for user details view)
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch teams
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
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

  // Team management mutations
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const res = await apiRequest("POST", "/api/teams", teamData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateTeamOpen(false);
      toast({
        title: "Team created",
        description: "New team has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/teams/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsEditTeamOpen(false);
      toast({
        title: "Team updated",
        description: "Team has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive",
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
    teamId: z.number().optional().nullable(),
  });
  
  const form = useForm<z.infer<typeof addMemberSchema>>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: UserRole.WRITER,
      teamId: null,
    },
  });

  // Edit team member form schema
  const editMemberSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum([UserRole.SUPERADMIN, UserRole.SALES, UserRole.TEAM_LEAD, UserRole.WRITER, UserRole.PROOFREADER]),
    teamId: z.number().optional().nullable(),
    status: z.string(),
  });

  const editForm = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: UserRole.WRITER,
      teamId: null,
      status: "ACTIVE",
    },
  });

  // Team form schemas
  const teamSchema = z.object({
    name: z.string().min(2, "Team name must be at least 2 characters"),
    description: z.string().optional(),
    teamLeadId: z.number().optional().nullable(),
  });

  const teamForm = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      teamLeadId: null,
    },
  });

  const editTeamForm = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      teamLeadId: null,
    },
  });
  
  // Handle adding a new team member
  const onSubmit = (data: z.infer<typeof addMemberSchema>) => {
    addMemberMutation.mutate(data);
  };

  // Handle creating a new team
  const onCreateTeam = (data: z.infer<typeof teamSchema>) => {
    createTeamMutation.mutate(data);
  };

  // Handle editing a team
  const onEditTeam = (data: z.infer<typeof teamSchema>) => {
    if (selectedTeam) {
      updateTeamMutation.mutate({ id: selectedTeam.id, data });
    }
  };

  // Handle team actions
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    editTeamForm.reset({
      name: team.name,
      description: team.description || "",
      teamLeadId: team.teamLeadId,
    });
    setIsEditTeamOpen(true);
  };

  const handleDeleteTeam = (teamId: number) => {
    if (confirm("Are you sure you want to delete this team? Writers assigned to this team will need to be reassigned.")) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  // Handle editing a team member
  const onEditSubmit = (data: z.infer<typeof editMemberSchema>) => {
    if (selectedUser) {
      // Only include password in update if it's provided
      const updateData = { ...data };
      if (!data.password || data.password.trim() === "") {
        delete updateData.password;
      }
      updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
    }
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
      username: user.username,
      password: "",
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
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
  
  // Filter users based on role - TEAM_LEAD sees only their team members
  const filteredUsers = user?.role === UserRole.TEAM_LEAD 
    ? users.filter(u => {
        // For team leads, show only writers and proofreaders from teams they lead
        const teamsLedByCurrentUser = teams.filter(team => team.teamLeadId === user.id);
        const teamIds = teamsLedByCurrentUser.map(team => team.id);
        
        // Show writers and proofreaders from those teams
        return (u.role === UserRole.WRITER || u.role === UserRole.PROOFREADER) && 
               u.teamId && teamIds.includes(u.teamId);
      })
    : users;

  // Group users by role
  const writerUsers = filteredUsers.filter(user => user.role === UserRole.WRITER);
  const proofreaderUsers = filteredUsers.filter(user => user.role === UserRole.PROOFREADER);
  const managementUsers = user?.role === UserRole.TEAM_LEAD 
    ? [] // Team leads don't see management users
    : users.filter(user => 
        user.role === UserRole.SALES || user.role === UserRole.TEAM_LEAD || user.role === UserRole.SUPERADMIN
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
                {/* Hide management tab for team leads */}
                {user?.role !== UserRole.TEAM_LEAD && (
                  <TabsTrigger value="management" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Management
                  </TabsTrigger>
                )}
                {user?.role === UserRole.SUPERADMIN && (
                  <TabsTrigger value="teams" className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Teams
                  </TabsTrigger>
                )}
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
                    ) : filteredUsers.length > 0 ? (
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
                          {filteredUsers.map((member) => (
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
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewUser(member)}
                                  >
                                    View Details
                                  </Button>
                                  {user?.role === UserRole.SUPERADMIN && member.id !== user.id && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditUser(member)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(member.id)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
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

              {/* Teams Management Tab */}
              {user?.role === UserRole.SUPERADMIN && (
                <TabsContent value="teams">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Teams Management</CardTitle>
                        <CardDescription>
                          Create and manage teams for organizing writers and proofreaders
                        </CardDescription>
                      </div>
                      <Button onClick={() => setIsCreateTeamOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Team
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {teams.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Team Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Team Lead</TableHead>
                              <TableHead>Members</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teams.map((team) => {
                              const teamLead = users.find(u => u.id === team.teamLeadId);
                              const teamMembers = users.filter(u => u.teamId === team.id);
                              
                              return (
                                <TableRow key={team.id}>
                                  <TableCell>
                                    <div className="font-medium">{team.name}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-gray-500">
                                      {team.description || "No description"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {teamLead ? (
                                      <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
                                          {getInitials(teamLead.fullName)}
                                        </div>
                                        <div className="ml-2">
                                          <div className="text-sm font-medium">{teamLead.fullName}</div>
                                          <div className="text-xs text-gray-500">@{teamLead.username}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">No lead assigned</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {teamMembers.map(m => m.fullName).join(', ') || 'No members'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTeam(team)}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTeam(team.id)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium mb-2">No teams created yet</p>
                          <p className="mb-4">Create teams to organize your writers and manage projects effectively</p>
                          <Button onClick={() => setIsCreateTeamOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Your First Team
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new account for a team member
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Form {...form}>
              <form id="add-member-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
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

                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Team selection for writers */}
              {form.watch("role") === UserRole.WRITER && (
                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              </form>
            </Form>
          </div>
          
          <DialogFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddMemberOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="add-member-form"
              disabled={addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
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
                              <Badge className={getStatusColor(task.status as string || 'NEW')}>
                                {(task.status as string || 'NEW').replace('_', ' ')}
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

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team to organize writers and proofreaders
            </DialogDescription>
          </DialogHeader>
          
          <Form {...teamForm}>
            <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="space-y-4">
              <FormField
                control={teamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={teamForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={teamForm.control}
                name="teamLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Lead (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.filter(u => u.role === UserRole.TEAM_LEAD || u.role === UserRole.SUPERADMIN).map((lead) => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            {lead.fullName} (@{lead.username})
                          </SelectItem>
                        ))}
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
                  onClick={() => setIsCreateTeamOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editTeamForm}>
            <form onSubmit={editTeamForm.handleSubmit(onEditTeam)} className="space-y-4">
              <FormField
                control={editTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editTeamForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editTeamForm.control}
                name="teamLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Lead (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.filter(u => u.role === UserRole.TEAM_LEAD || u.role === UserRole.SUPERADMIN).map((lead) => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            {lead.fullName} (@{lead.username})
                          </SelectItem>
                        ))}
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
                  onClick={() => setIsEditTeamOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateTeamMutation.isPending}
                >
                  {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Dialog */}
      <Dialog open={isEditMemberOpen} onOpenChange={setIsEditMemberOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Form {...editForm}>
              <form id="edit-member-form" onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 p-1">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Leave blank to keep current password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
              
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Selection Field - only for Writers and Proofreaders */}
              {(editForm.watch("role") === UserRole.WRITER || editForm.watch("role") === UserRole.PROOFREADER) && (
                <FormField
                  control={editForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Assignment</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                        value={field.value ? field.value.toString() : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Others (No Team)</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
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
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              </form>
            </Form>
          </div>
          
          <DialogFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditMemberOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="edit-member-form"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Updating..." : "Update Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
