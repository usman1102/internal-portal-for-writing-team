import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Payment, PaymentStatus, UserRole, Task, User } from "@shared/schema";
import { DollarSign, CreditCard, TrendingUp, ArrowLeft } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

interface PaymentWithTask extends Payment {
  task: Task;
}

export default function UserPaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get user ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');

  // Fetch user details
  const { data: targetUser } = useQuery<User>({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('User not found');
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user-specific payments
  const { data: payments = [], isLoading } = useQuery<PaymentWithTask[]>({
    queryKey: ["/api/payments", userId],
    queryFn: async () => {
      const response = await fetch(`/api/payments/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    enabled: !!userId,
  });

  // Update payment status mutation (only for superadmin)
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: number; status: PaymentStatus }) => {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", userId] });
      toast({
        title: "Payment updated",
        description: "Payment status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const totalEarned = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = payments.filter(p => p.status === PaymentStatus.PAID).reduce((sum, payment) => sum + payment.amount, 0);
  const totalUnpaid = payments.filter(p => p.status === PaymentStatus.UNPAID).reduce((sum, payment) => sum + payment.amount, 0);

  const handleStatusChange = (paymentId: number, newStatus: PaymentStatus) => {
    updatePaymentMutation.mutate({ paymentId, status: newStatus });
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "bg-green-500";
      case PaymentStatus.UNPAID:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if user has permission to view this user's payments
  const canViewPayments = () => {
    if (!user || !targetUser) return false;
    
    // Superadmin can view all payments
    if (user.role === UserRole.SUPERADMIN) return true;
    
    // Team leads can view their team members' payments
    if (user.role === UserRole.TEAM_LEAD) {
      // For team leads, we need to check if they lead a team that contains the target user
      // This will be handled by the backend API call
      return true; // Let the backend handle the team membership check
    }
    
    // Users can view their own payments
    if (user.id === targetUser.id) return true;
    
    return false;
  };

  const canUpdatePaymentStatus = () => {
    return user?.role === UserRole.SUPERADMIN;
  };

  if (!user) return null;

  if (!userId) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            title="User Payments" 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center min-h-full">
              <div className="text-lg text-red-600">User ID not specified</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!canViewPayments()) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            title="User Payments" 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center min-h-full">
              <div className="text-lg text-red-600">Access denied</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            title="User Payments" 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center min-h-full">
              <div className="text-lg">Loading payments...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="User Payments" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/team")}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Team
                </Button>
                <h1 className="text-2xl font-bold">
                  {targetUser?.fullName}'s Payments
                </h1>
                <p className="text-gray-600">Payment records for {targetUser?.fullName}</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalEarned)}</div>
                  <p className="text-xs text-muted-foreground">
                    {payments.length} total payments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                  <p className="text-xs text-muted-foreground">
                    {payments.filter(p => p.status === PaymentStatus.PAID).length} payments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</div>
                  <p className="text-xs text-muted-foreground">
                    {payments.filter(p => p.status === PaymentStatus.UNPAID).length} payments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p>No payment records found for this user.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Task ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date of Payment</TableHead>
                        {canUpdatePaymentStatus() && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments
                        .sort((a, b) => a.taskId - b.taskId)
                        .map((payment, index) => (
                        <TableRow key={payment.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>#{payment.taskId}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.paidAt)}</TableCell>
                          {canUpdatePaymentStatus() && (
                            <TableCell>
                              <Select
                                value={payment.status}
                                onValueChange={(value) => handleStatusChange(payment.id, value as PaymentStatus)}
                                disabled={updatePaymentMutation.isPending}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                                  <SelectItem value={PaymentStatus.UNPAID}>Unpaid</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}