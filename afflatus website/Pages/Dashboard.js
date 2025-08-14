
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Attendance } from "@/entities/Attendance";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from "date-fns";
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  Coffee, 
  MapPin,
  Clock3,
  Timer
} from "lucide-react";

import DashboardStats from "../components/dashboard/DashboardStats";
import QuickActions from "../components/dashboard/QuickActions";
import RecentActivity from "../components/dashboard/RecentActivity";
import WeeklyOverview from "../components/dashboard/WeeklyOverview";
import ProfileSetup from "../components/setup/ProfileSetup";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Check if profile needs setup
      if (!currentUser.employee_id || !currentUser.department || !currentUser.surname || !currentUser.first_name) {
        setNeedsProfileSetup(true);
        setLoading(false);
        return;
      }
      setNeedsProfileSetup(false);

      // Load attendance data
      const attendance = await Attendance.filter(
        { user_email: currentUser.email },
        "-created_date",
        50
      );
      setAttendanceData(attendance);

      // Find today's attendance
      const today = format(new Date(), "yyyy-MM-dd");
      const todayRecord = attendance.find(record => record.date === today);
      setTodayAttendance(todayRecord);
    } catch (error) {
      // User not authenticated - they'll be redirected to login automatically
      console.error("Authentication error:", error);
    }
    setLoading(false);
  };

  const handleProfileComplete = () => {
    setNeedsProfileSetup(false);
    loadDashboardData();
  };

  const getWeeklyStats = () => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    const weeklyRecords = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    const totalHours = weeklyRecords.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const overtimeHours = weeklyRecords.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
    const daysPresent = weeklyRecords.length;

    return { totalHours, overtimeHours, daysPresent };
  };

  const getMonthlyStats = () => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    const monthlyRecords = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const totalHours = monthlyRecords.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const averageHours = monthlyRecords.length > 0 ? totalHours / monthlyRecords.length : 0;
    const perfectDays = monthlyRecords.filter(record => record.total_hours >= 8).length;

    return { totalHours, averageHours, perfectDays, daysPresent: monthlyRecords.length };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (needsProfileSetup) {
    return <ProfileSetup user={user} onComplete={handleProfileComplete} />;
  }

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const welcomeName = user?.first_name || user?.full_name?.split(' ')[0];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}, {welcomeName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your attendance overview for {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="glass-effect px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <Clock3 className="w-4 h-4 text-blue-600" />
              <span className="font-medium">
                {format(currentTime, "h:mm:ss a")}
              </span>
            </div>
          </div>

          {todayAttendance?.status === 'on_break' && (
            <div className="glass-effect px-4 py-2 rounded-xl border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Coffee className="w-4 h-4" />
                <span className="font-medium">On Break</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <DashboardStats 
        weeklyStats={weeklyStats}
        monthlyStats={monthlyStats}
        todayAttendance={todayAttendance}
      />

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions 
            user={user}
            todayAttendance={todayAttendance}
            onUpdate={loadDashboardData}
          />
        </div>
        
        <div className="lg:col-span-2">
          <RecentActivity 
            attendanceData={attendanceData.slice(0, 5)}
            loading={loading}
          />
        </div>
      </div>

      {/* Weekly Overview */}
      <WeeklyOverview 
        attendanceData={attendanceData}
        currentWeek={format(new Date(), "yyyy-MM-dd")}
      />
    </div>
  );
}
