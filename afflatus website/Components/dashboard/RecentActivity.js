import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Calendar, TrendingUp } from "lucide-react";

export default function RecentActivity({ attendanceData, loading }) {
  if (loading) {
    return (
      <Card className="glass-effect border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "border-green-200 text-green-700 bg-green-50";
      case "late": return "border-yellow-200 text-yellow-700 bg-yellow-50";
      case "early_leave": return "border-orange-200 text-orange-700 bg-orange-50";
      case "on_break": return "border-amber-200 text-amber-700 bg-amber-50";
      default: return "border-gray-200 text-gray-700 bg-gray-50";
    }
  };

  return (
    <Card className="glass-effect border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attendanceData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity found</p>
            <p className="text-sm">Your attendance records will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attendanceData.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(record.date), "EEEE, MMM d")}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>
                        In: {record.clock_in ? format(new Date(record.clock_in), "h:mm a") : "-"}
                      </span>
                      <span>
                        Out: {record.clock_out ? format(new Date(record.clock_out), "h:mm a") : "-"}
                      </span>
                      {record.total_hours && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {record.total_hours.toFixed(1)}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(record.status)}>
                    {record.status.replace("_", " ")}
                  </Badge>
                  {record.overtime_hours > 0 && (
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      +{record.overtime_hours.toFixed(1)}h OT
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}