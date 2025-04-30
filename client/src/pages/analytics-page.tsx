import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Analytics, Task, User } from "@shared/schema";
import { 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Calendar
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("7days");
  const [activeTab, setActiveTab] = useState("performance");
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics", timeRange],
  });
  
  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Mock data for charts (would be derived from real data in a production app)
  const taskCompletionData = [
    { name: "Week 1", completed: 12, target: 15 },
    { name: "Week 2", completed: 19, target: 15 },
    { name: "Week 3", completed: 14, target: 15 },
    { name: "Week 4", completed: 21, target: 15 }
  ];
  
  const turnAroundTimeData = [
    { name: "Blog Posts", value: 2.3 },
    { name: "Social Media", value: 1.1 },
    { name: "Product Descriptions", value: 1.8 },
    { name: "Email Campaigns", value: 2.5 },
    { name: "Website Copy", value: 3.2 }
  ];
  
  const revisionRateData = [
    { name: "No Revision", value: 85 },
    { name: "One Revision", value: 10 },
    { name: "Multiple Revisions", value: 5 }
  ];
  
  const COLORS = ["#3f51b5", "#f50057", "#ff9800", "#4caf50", "#9e9e9e"];
  
  const taskStatusData = [
    { name: "New", value: tasks.filter(task => task.status === "NEW").length },
    { name: "In Progress", value: tasks.filter(task => task.status === "IN_PROGRESS").length },
    { name: "Review", value: tasks.filter(task => task.status === "REVIEW").length },
    { name: "Revision", value: tasks.filter(task => task.status === "REVISION").length },
    { name: "Completed", value: tasks.filter(task => task.status === "COMPLETED").length }
  ];
  
  const writerPerformanceData = users
    .filter(user => user.role === "WRITER")
    .map(writer => {
      const writerTasks = tasks.filter(task => task.assignedToId === writer.id);
      const completedTasks = writerTasks.filter(task => task.status === "COMPLETED").length;
      const revisionTasks = writerTasks.filter(task => task.status === "REVISION").length;
      const revisionRate = writerTasks.length > 0 ? (revisionTasks / writerTasks.length) * 100 : 0;
      
      return {
        name: writer.fullName,
        tasks: writerTasks.length,
        completed: completedTasks,
        revisionRate: Math.round(revisionRate)
      };
    })
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5); // Top 5 writers
  
  const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingUsers;

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="Analytics" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="performance" className="flex items-center">
                  <BarChartIcon className="h-4 w-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="taskAnalysis" className="flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Task Analysis
                </TabsTrigger>
                <TabsTrigger value="writers" className="flex items-center">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Writer Metrics
                </TabsTrigger>
              </TabsList>
              
              {/* Performance Tab */}
              <TabsContent value="performance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Task Completion vs Target</CardTitle>
                      <CardDescription>Weekly completion rates compared to targets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={taskCompletionData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="completed" fill="#3f51b5" name="Completed Tasks" />
                              <Bar dataKey="target" fill="#f50057" name="Target" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Average Turn-around Time</CardTitle>
                      <CardDescription>Days to complete by content type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-60 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={turnAroundTimeData}
                              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" />
                              <Tooltip />
                              <Bar dataKey="value" fill="#4caf50" name="Days" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Revision Rate</CardTitle>
                      <CardDescription>Percentage of tasks requiring revisions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-60 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-60 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={revisionRateData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {revisionRateData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Task Analysis Tab */}
              <TabsContent value="taskAnalysis">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Status Distribution</CardTitle>
                      <CardDescription>Current status of all tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-80 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={taskStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {taskStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Deadline Compliance</CardTitle>
                      <CardDescription>On-time vs late task completions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: 'On Time', value: 78 },
                                { name: '1-2 Days Late', value: 15 },
                                { name: '3+ Days Late', value: 7 }
                              ]}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#3f51b5" name="Percentage" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle>Task Volume by Month</CardTitle>
                        <CardDescription>Number of tasks created and completed monthly</CardDescription>
                      </div>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={[
                                { name: 'Jan', created: 45, completed: 40 },
                                { name: 'Feb', created: 52, completed: 48 },
                                { name: 'Mar', created: 48, completed: 45 },
                                { name: 'Apr', created: 70, completed: 65 },
                                { name: 'May', created: 65, completed: 60 },
                                { name: 'Jun', created: 75, completed: 68 }
                              ]}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="created" stroke="#3f51b5" activeDot={{ r: 8 }} name="Created" />
                              <Line type="monotone" dataKey="completed" stroke="#f50057" name="Completed" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Writer Metrics Tab */}
              <TabsContent value="writers">
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Writer Performance</CardTitle>
                      <CardDescription>Task completion rates for top writers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={writerPerformanceData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="tasks" fill="#3f51b5" name="Total Tasks" />
                              <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Writer Revision Rates</CardTitle>
                      <CardDescription>Percentage of tasks needing revision by writer</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={writerPerformanceData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="revisionRate" fill="#f50057" name="Revision Rate (%)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
