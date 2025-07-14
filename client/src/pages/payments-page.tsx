import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
import { useLocation } from "wouter";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

interface PaymentWithTask extends Payment {
  task: Task;
}

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch payments for the current user
  const { data: payments = [], isLoading } = useQuery<PaymentWithTask[]>({
    queryKey: ["/api/payments"],
    enabled: !!user,
  });

  // Fetch all users for superadmin view
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === UserRole.SUPERADMIN,
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: number; status: PaymentStatus }) => {
      await apiRequest('PATCH', `/api/payments/${paymentId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Payment status updated",
        description: "The payment status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating payment status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (paymentId: number, status: PaymentStatus) => {
    updatePaymentStatusMutation.mutate({ paymentId, status });
  };

  // Calculate totals
  const totalPaid = payments
    .filter(p => p.status === PaymentStatus.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUnpaid = payments
    .filter(p => p.status === PaymentStatus.UNPAID)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalEarned = payments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate unpaid amounts per user for superadmin view
  const getUserUnpaidAmount = (userId: number) => {
    return payments
      .filter(p => p.userId === userId && p.status === PaymentStatus.UNPAID)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // Filter users for payment table (writers, proofreaders, team leads)
  const paymentUsers = users.filter(u => 
    u.role === UserRole.WRITER || 
    u.role === UserRole.PROOFREADER || 
    u.role === UserRole.TEAM_LEAD
  );

  const handleUserClick = (userId: number) => {
    navigate(`/user-payments?userId=${userId}`);
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

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            title="Payments" 
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
          title="Payments" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Payments</h1>
                <p className="text-gray-600">View and manage your payment records</p>
              </div>
            </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalEarned)}
              </div>
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
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
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
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalUnpaid)}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => p.status === PaymentStatus.UNPAID).length} payments
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === UserRole.SUPERADMIN ? "User Payments Overview" : "Payment History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.role === UserRole.SUPERADMIN ? (
            paymentUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Unpaid Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentUsers.map((paymentUser) => (
                    <TableRow 
                      key={paymentUser.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleUserClick(paymentUser.id)}
                    >
                      <TableCell className="font-medium">
                        #{paymentUser.id}
                      </TableCell>
                      <TableCell>
                        {paymentUser.fullName || paymentUser.username}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{paymentUser.role.toLowerCase().replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(getUserUnpaidAmount(paymentUser.id))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payments found</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments
                    .sort((a, b) => a.taskId - b.taskId)
                    .map((payment, index) => (
                    <TableRow key={payment.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <span className="font-medium">#{payment.taskId}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(payment.paidAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
          </div>
        </main>
      </div>
    </div>
  );
}