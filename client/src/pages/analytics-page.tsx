import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

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
          notificationCount={3}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="min-h-full flex items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="p-12 text-center">
                <div className="relative">
                  {/* Animated background elements */}
                  <div className="absolute inset-0 -z-10">
                    <div className="absolute top-4 left-8 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute top-16 right-12 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-30 animate-bounce"></div>
                    <div className="absolute bottom-8 left-16 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-25 animate-pulse"></div>
                    <div className="absolute bottom-16 right-8 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-bounce"></div>
                  </div>

                  {/* Main icon with gradient */}
                  <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <BarChart3 className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Main heading with gradient text */}
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Analytics
                  </h1>
                  
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-xl font-semibold text-gray-600">Coming Soon</span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                    We're crafting powerful analytics and insights to help you track your freelance writing performance and team productivity.
                  </p>

                  {/* Feature preview cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-medium text-blue-800 mb-1">Performance Metrics</h3>
                      <p className="text-xs text-blue-600">Track task completion rates and productivity trends</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-medium text-purple-800 mb-1">Team Insights</h3>
                      <p className="text-xs text-purple-600">Visualize team performance and workload distribution</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <h3 className="font-medium text-green-800 mb-1">Time Tracking</h3>
                      <p className="text-xs text-green-600">Monitor project timelines and deadline adherence</p>
                    </div>
                  </div>

                  {/* Coming soon badge */}
                  <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-lg">
                    <Sparkles className="h-4 w-4" />
                    <span>Exciting Features Coming Soon</span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}