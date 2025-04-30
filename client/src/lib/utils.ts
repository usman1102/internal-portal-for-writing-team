import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function getDaysRemaining(deadline: Date | string): string {
  const now = new Date();
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'NEW': 'bg-blue-100 text-blue-800',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
    'REVIEW': 'bg-green-100 text-green-800',
    'REVISION': 'bg-red-100 text-red-800',
    'COMPLETED': 'bg-indigo-100 text-indigo-800',
    'AVAILABLE': 'bg-green-100 text-green-800',
    'BUSY': 'bg-yellow-100 text-yellow-800',
    'ON_LEAVE': 'bg-red-100 text-red-800',
    'ACTIVE': 'bg-green-100 text-green-800',
    'COMPLETED': 'bg-blue-100 text-blue-800',
  };

  return statusMap[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusText(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

export function getRoleColor(role: string): string {
  const roleMap: Record<string, string> = {
    'SALES': 'border-l-4 border-secondary',
    'TEAM_LEAD': 'border-l-4 border-primary',
    'WRITER': 'border-l-4 border-success',
    'PROOFREADER': 'border-l-4 border-warning',
  };

  return roleMap[role] || '';
}
