import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Attendance } from "@/entities/Attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { 
  Clock, 
  Coffee, 
  MapPin, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Timer,
  Calendar,
  TrendingUp
} from "lucide-react";

export default function TimeTracking() {
  const [user, setUser] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workDuration, setWorkDuration] = useState(0);
  const [breakDuration, setBreakDuration] = useState(0);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateDurations();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const today = format(new Date(), "yyyy-MM-dd");
      const attendanceRecords = await Attendance.filter(
        { user_email: currentUser.email, date: today },
        "-created_date",
        1
      );

      if (attendanceRecords.length > 0) {
        setTodayAttendance(attendanceRecords[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const updateDurations = () => {
    if (!todayAttendance?.clock_in) return;

    const clockInTime = new Date(todayAttendance.clock_in);
    const now = new Date();
    
    // Calculate work duration
    let totalWorkMinutes = differenceInMinutes(now, clockInTime);
    
    // Subtract break time if currently on break or if break ended
    if (todayAttendance.break_start) {
      const breakStartTime = new Date(todayAttendance.break_start);
      const breakEndTime = todayAttendance.break_end ? new Date(todayAttendance.break_end) : now;
      const breakMinutes = differenceInMinutes(breakEndTime, breakStartTime);
      
      if (todayAttendance.status === 'on_break') {
        setBreakDuration(breakMinutes);
        totalWorkMinutes -= breakMinutes;
      } else if (todayAttendance.break_end) {
        totalWorkMinutes -= breakMinutes;
        setBreakDuration(breakMinutes);
      }
    }

    setWorkDuration(Math.max(0, totalWorkMinutes));
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "Current Location"
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    setMessage("");

    try {
      const locationData = await getCurrentLocation();
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();

      const newAttendance = await Attendance.create({
        user_email: user.email,
        date: today,
        clock_in: now.toISOString(),
        status: "present",
        location: locationData
      });

      setTodayAttendance(newAttendance);
      setMessage("✅ Successfully clocked in!");
    } catch (error) {
      setMessage("❌ Failed to clock in. Please try again.");
      console.error("Clock in error:", error);
    }
    setActionLoading(false);
  };

  const handleClockOut = async () => {
    if (!todayAttendance) {
      setMessage("❌ No clock-in record found for today.");
      return;
    }

    setActionLoading(true);
    setMessage("");

    try {
      const locationData = await getCurrentLocation();
      const now = new Date();
      const clockInTime = new Date(todayAttendance.clock_in);
      
      // Calculate total hours worked (excluding break time)
      let totalMinutes = differenceInMinutes(now, clockInTime);
      if (todayAttendance.break_start && todayAttendance.break_end) {
        const breakMinutes = differenceInMinutes(
          new Date(todayAttendance.break_end), 
          new Date(todayAttendance.break_start)
        );
        totalMinutes -= breakMinutes;
      }

      const totalHours = totalMinutes / 60;
      const standardHours = 8;
      const overtimeHours = Math.max(0, totalHours - standardHours);

      const updatedAttendance = await Attendance.update(todayAttendance.id, {
        clock_out: now.toISOString(),
        total_hours: totalHours,
        overtime_hours: overtimeHours,
        status: totalHours >= standardHours ? "present" : "early_leave",
        location: {
          ...todayAttendance.location,
          clock_out_location: locationData
        }
      });

      setTodayAttendance(updatedAttendance);
      setMessage("✅ Successfully clocked out!");
    } catch (error) {
      setMessage("❌ Failed to clock out. Please try again.");
      console.error("Clock out error:", error);
    }
    setActionLoading(false);
  };

  const handleBreak = async (isStarting) => {
    if (!todayAttendance) {
      setMessage("❌ Please clock in first.");
      return;
    }

    setActionLoading(true);
    setMessage("");

    try {
      const now = new Date();
      const updateData = isStarting ? {
        break_start: now.toISOString(),
        status: "on_break"
      } : {
        break_end: now.toISOString(),
        status: "present"
      };

      // Calculate break duration if ending break
      if (!isStarting && todayAttendance.break_start) {
        const breakStart = new Date(todayAttendance.break_start);
        const breakDuration = differenceInMinutes(now, breakStart);
        updateData.break_duration = breakDuration;
      }

      const updatedAttendance = await Attendance.update(todayAttendance.id, updateData);
      setTodayAttendance(updatedAttendance);
      setMessage(isStarting ? "☕ Break started!" : "✅ Back from break!");
    } catch (error) {
      setMessage("❌ Failed to update break status.");
      console.error("Break error:", error);
    }
    setActionLoading(false);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time tracking...</p>
        </div>
      </div>
    );
  }

  const canClockIn = !todayAttendance;
  const canClockOut = todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out;
  const canStartBreak = todayAttendance && todayAttendance.status !== "on_break" && !todayAttendance.clock_out;
  const canEndBreak = todayAttendance && todayAttendance.status === "on_break";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking</h1>
        <p className="text-gray-600">
          {format(new Date(), "EEEE, MMMM d, yyyy")} • {format(currentTime, "h:mm:ss a")}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-effect border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Work Duration</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(workDuration)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Break Time</h3>
            <p className="text-2xl font-bold text-amber-600">
              {formatDuration(breakDuration)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Today's Goal</h3>
            <p className="text-2xl font-bold text-green-600">
              {Math.min(100, Math.round((workDuration / 480) * 100))}%
            </p>
            <p className="text-xs text-gray-500 mt-1">8 hours target</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Card */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            Time Clock
          </CardTitle>
          {todayAttendance && (
            <Badge 
              className={`text-sm ${
                todayAttendance.status === "on_break" ? "bg-amber-100 text-amber-700" :
                todayAttendance.status === "present" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-700"
              }`}
            >
              {todayAttendance.status.replace("_", " ").toUpperCase()}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert className={message.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className={message.includes("✅") ? "text-green-700" : "text-red-700"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={handleClockIn}
              disabled={!canClockIn || actionLoading}
              className="h-16 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading && canClockIn ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Clock In
            </Button>

            <Button
              onClick={handleClockOut}
              disabled={!canClockOut || actionLoading}
              variant="outline"
              className="h-16 text-lg border-2 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading && canClockOut ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              Clock Out
            </Button>
          </div>

          {/* Break Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleBreak(true)}
              disabled={!canStartBreak || actionLoading}
              variant="outline"
              className="h-12 text-amber-600 border-amber-200 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading && canStartBreak ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Coffee className="w-4 h-4 mr-2" />
              )}
              Start Break
            </Button>

            <Button
              onClick={() => handleBreak(false)}
              disabled={!canEndBreak || actionLoading}
              variant="outline"
              className="h-12 text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading && canEndBreak ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              End Break
            </Button>
          </div>

          {/* Today's Summary */}
          {todayAttendance && (
            <div className="pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Today's Summary</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clock In:</span>
                    <span className="font-medium">
                      {todayAttendance.clock_in ? format(new Date(todayAttendance.clock_in), "h:mm a") : "-"}
                    </span>
                  </div>
                  {todayAttendance.clock_out && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clock Out:</span>
                      <span className="font-medium">
                        {format(new Date(todayAttendance.clock_out), "h:mm a")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">
                      {todayAttendance.total_hours ? `${todayAttendance.total_hours.toFixed(1)}h` : `${(workDuration / 60).toFixed(1)}h`}
                    </span>
                  </div>
                  {(todayAttendance.overtime_hours > 0 || workDuration > 480) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overtime:</span>
                      <span className="font-medium text-green-600">
                        +{todayAttendance.overtime_hours?.toFixed(1) || Math.max(0, ((workDuration - 480) / 60)).toFixed(1)}h
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}