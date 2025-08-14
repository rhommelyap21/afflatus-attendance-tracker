import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Calendar, Clock } from "lucide-react";

export default function WeeklyOverview({ attendanceData, currentWeek }) {
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayAttendance = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return attendanceData.find(record => record.date === dayStr);
  };

  const getDayStatus = (day, attendance) => {
    if (!attendance) return { status: "absent", color: "bg-gray-100 text-gray-600" };
    
    if (attendance.status === "present" && attendance.total_hours >= 8) {
      return { status: "perfect", color: "bg-green-100 text-green-700" };
    }
    if (attendance.status === "present" && attendance.total_hours < 8) {
      return { status: "partial", color: "bg-yellow-100 text-yellow-700" };
    }
    if (attendance.status === "late") {
      return { status: "late", color: "bg-orange-100 text-orange-700" };
    }
    
    return { status: "present", color: "bg-blue-100 text-blue-700" };
  };

  return (
    <Card className="glass-effect border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          This Week's Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const attendance = getDayAttendance(day);
            const dayStatus = getDayStatus(day, attendance);
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date() && !isToday;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all ${
                  isToday ? "border-blue-300 bg-blue-50" : "border-gray-200"
                } ${isPast && !attendance ? "opacity-60" : ""}`}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {format(day, "d")}
                  </div>
                  
                  {attendance ? (
                    <div className="space-y-2">
                      <Badge className={`text-xs ${dayStatus.color}`}>
                        {dayStatus.status}
                      </Badge>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          {attendance.total_hours?.toFixed(1) || "0"}h
                        </div>
                        {attendance.overtime_hours > 0 && (
                          <div className="text-green-600 font-medium">
                            +{attendance.overtime_hours.toFixed(1)}h OT
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      {isPast ? "Absent" : "Pending"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-green-100"></div>
            <span className="text-gray-600">Perfect Day (8+h)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-yellow-100"></div>
            <span className="text-gray-600">Partial Day</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-orange-100"></div>
            <span className="text-gray-600">Late</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded bg-gray-100"></div>
            <span className="text-gray-600">Absent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}