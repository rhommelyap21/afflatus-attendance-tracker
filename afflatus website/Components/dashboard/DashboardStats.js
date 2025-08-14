
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  Timer,
  Target
} from "lucide-react";

export default function DashboardStats({ weeklyStats, monthlyStats, todayAttendance }) {
  const stats = [
    {
      title: "Today's Status",
      value: todayAttendance ? (
        todayAttendance.clock_out ? "Completed" : "In Progress"
      ) : "Not Started",
      subtitle: todayAttendance?.total_hours ? 
        `${todayAttendance.total_hours.toFixed(1)}h worked` : 
        "No time logged",
      icon: Clock,
      color: todayAttendance?.clock_out ? "text-green-600" : 
             todayAttendance?.clock_in ? "text-violet-600" : "text-gray-400",
      bgColor: todayAttendance?.clock_out ? "bg-green-50" : 
               todayAttendance?.clock_in ? "bg-violet-50" : "bg-gray-50"
    },
    {
      title: "This Week",
      value: `${weeklyStats.totalHours.toFixed(1)}h`,
      subtitle: `${weeklyStats.daysPresent} days present`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      badge: weeklyStats.overtimeHours > 0 ? `+${weeklyStats.overtimeHours.toFixed(1)}h OT` : null
    },
    {
      title: "Monthly Average",
      value: `${monthlyStats.averageHours.toFixed(1)}h`,
      subtitle: `${monthlyStats.daysPresent} working days`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Perfect Days",
      value: monthlyStats.perfectDays,
      subtitle: "8+ hours this month",
      icon: Award,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{color: '#989c9f'}}>
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs mt-1" style={{color: '#989c9f'}}>
                  {stat.subtitle}
                </p>
              </div>
              {stat.badge && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs border border-green-200">
                  {stat.badge}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
