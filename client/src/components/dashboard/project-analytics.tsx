import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";

interface AnalyticsDataPoint {
  name: string;
  completed: number;
  inProgress: number;
  revision: number;
}

interface ProjectAnalyticsProps {
  data: AnalyticsDataPoint[];
  turnAroundTime: {
    value: number;
    change: number;
  };
  revisionRate: {
    value: number;
    change: number;
  };
  isLoading?: boolean;
}

export function ProjectAnalytics({
  data,
  turnAroundTime,
  revisionRate,
  isLoading = false,
}: ProjectAnalyticsProps) {
  const [period, setPeriod] = useState("7days");

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 font-heading">Project Analytics</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="h-72 animate-pulse bg-gray-100 rounded-md"></div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#4caf50" name="Completed" />
                <Bar dataKey="inProgress" stackId="a" fill="#ff9800" name="In Progress" />
                <Bar dataKey="revision" stackId="a" fill="#f44336" name="Revision Needed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-500">Average Turn-around Time</h4>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold">{turnAroundTime.value} days</p>
              <p className={`ml-2 text-sm flex items-center ${turnAroundTime.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {turnAroundTime.change >= 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 mr-1" />
                    {Math.abs(turnAroundTime.change)}%
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4 mr-1" />
                    {Math.abs(turnAroundTime.change)}%
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-500">Revision Rate</h4>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold">{revisionRate.value}%</p>
              <p className={`ml-2 text-sm flex items-center ${revisionRate.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revisionRate.change <= 0 ? (
                  <>
                    <ArrowDown className="h-4 w-4 mr-1" />
                    {Math.abs(revisionRate.change)}%
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-4 w-4 mr-1" />
                    {Math.abs(revisionRate.change)}%
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
