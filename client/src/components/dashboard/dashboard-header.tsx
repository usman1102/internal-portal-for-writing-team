import { HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface DashboardHeaderProps {
  title: string;
  onToggleSidebar: () => void;
}

export function DashboardHeader({
  title,
  onToggleSidebar,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Paper Slay" className="h-8 w-8 rounded-lg" />
            <h2 className="text-xl font-semibold text-gray-800 font-heading">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-4">

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-5 w-5 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
