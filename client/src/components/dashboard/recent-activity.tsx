import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "@shared/schema";
import { formatDateTime } from "@/lib/utils";
import { FileText, CheckSquare, ClipboardList, RotateCcw } from "lucide-react";

interface RecentActivityProps {
  activities: Activity[];
  onViewAllActivity?: () => void;
  isLoading?: boolean;
}

export function RecentActivity({
  activities,
  onViewAllActivity,
  isLoading = false,
}: RecentActivityProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'SUBMISSION':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
        );
      case 'APPROVAL':
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckSquare className="h-5 w-5" />
          </div>
        );
      case 'TASK_CREATED':
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <ClipboardList className="h-5 w-5" />
          </div>
        );
      case 'REVISION':
        return (
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <RotateCcw className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <FileText className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 font-heading">Recent Activity</h3>
      </div>

      <div className="p-4">
        {isLoading ? (
          <ul className="divide-y divide-gray-200">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="py-3 animate-pulse">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : activities.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="py-3">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        )}
      </div>

      {onViewAllActivity && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <Button
            variant="link"
            className="text-primary hover:text-primary-dark text-sm font-medium p-0"
            onClick={onViewAllActivity}
          >
            View All Activity
          </Button>
        </div>
      )}
    </Card>
  );
}
