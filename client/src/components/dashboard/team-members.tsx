import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { cn, getInitials, getStatusColor } from "@/lib/utils";
import { MoreVertical, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMembersProps {
  members: User[];
  onAddMember?: () => void;
  onViewMember?: (member: User) => void;
  onUpdateStatus?: (id: number, status: string) => void;
  isLoading?: boolean;
}

export function TeamMembers({
  members,
  onAddMember,
  onViewMember,
  onUpdateStatus,
  isLoading = false,
}: TeamMembersProps) {
  const getColorByRole = (role: string) => {
    switch (role) {
      case "SALES":
        return "bg-secondary";
      case "TEAM_LEAD":
        return "bg-primary";
      case "WRITER":
        return "bg-success";
      case "PROOFREADER":
        return "bg-warning";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 font-heading">Team Members</h3>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: "350px" }}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="py-3 flex justify-between items-center animate-pulse">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-5 bg-gray-200 rounded w-16 mr-2"></div>
                  <div className="h-8 w-8 rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : members.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {members.map((member) => (
              <li key={member.id} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-white",
                    getColorByRole(member.role)
                  )}>
                    <span>{getInitials(member.fullName)}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {member.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={cn(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                    getStatusColor(member.status || 'AVAILABLE')
                  )}>
                    {member.status || 'Available'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 text-gray-400 hover:text-gray-500"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewMember?.(member)}>
                        View Profile
                      </DropdownMenuItem>
                      {onUpdateStatus && (
                        <>
                          <DropdownMenuItem onClick={() => onUpdateStatus(member.id, 'AVAILABLE')}>
                            Set as Available
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(member.id, 'BUSY')}>
                            Set as Busy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(member.id, 'ON_LEAVE')}>
                            Set as On Leave
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No team members found
          </div>
        )}
      </div>

      {onAddMember && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <Button
            variant="ghost"
            className="text-primary hover:text-primary-dark text-sm font-medium"
            onClick={onAddMember}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Team Member
          </Button>
        </div>
      )}
    </div>
  );
}
