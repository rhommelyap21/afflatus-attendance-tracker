
import React, { useState } from "react";
import { Attendance } from "@/entities/Attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { 
  Clock, 
  Coffee, 
  MapPin, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function QuickActions({ user, todayAttendance, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);

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
    setLoading(true);
    setMessage("");

    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);

      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();

      await Attendance.create({
        user_email: user.email,
        date: today,
        clock_in: now.toISOString(),
        status: "present",
        location: locationData
      });

      setMessage("✅ Successfully clocked in!");
      setTimeout(() => onUpdate(), 1000);
    } catch (error) {
      setMessage("❌ Failed to clock in. Please try again.");
      console.error("Clock in error:", error);
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!todayAttendance) {
      setMessage("❌ No clock-in record found for today.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const locationData = await getCurrentLocation();
      const now = new Date();
      const clockInTime = new Date(todayAttendance.clock_in);
      const diffMs = now - clockInTime;
      const totalHours = diffMs / (1000 * 60 * 60);
      
      // Calculate overtime (assuming 8 hours is standard)
      const standardHours = 8;
      const overtimeHours = Math.max(0, totalHours - standardHours);

      await Attendance.update(todayAttendance.id, {
        clock_out: now.toISOString(),
        total_hours: totalHours,
        overtime_hours: overtimeHours,
        status: totalHours >= standardHours ? "present" : "early_leave",
        location: {
          ...todayAttendance.location,
          clock_out_location: locationData
        }
      });

      setMessage("✅ Successfully clocked out!");
      setTimeout(() => onUpdate(), 1000);
    } catch (error) {
      setMessage("❌ Failed to clock out. Please try again.");
      console.error("Clock out error:", error);
    }
    setLoading(false);
  };

  const handleBreak = async (isStarting) => {
    if (!todayAttendance) {
      setMessage("❌ Please clock in first.");
      return;
    }

    setLoading(true);
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
        const breakDuration = (now - breakStart) / (1000 * 60); // in minutes
        updateData.break_duration = breakDuration;
      }

      await Attendance.update(todayAttendance.id, updateData);
      setMessage(isStarting ? "☕ Break started!" : "✅ Back from break!");
      setTimeout(() => onUpdate(), 1000);
    } catch (error) {
      setMessage("❌ Failed to update break status.");
      console.error("Break error:", error);
    }
    setLoading(false);
  };

  const canClockIn = !todayAttendance;
  const canClockOut = todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out;
  const canStartBreak = todayAttendance && todayAttendance.status !== "on_break" && !todayAttendance.clock_out;
  const canEndBreak = todayAttendance && todayAttendance.status === "on_break";

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Clock className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert className={message.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription className={message.includes("✅") ? "text-green-700" : "text-red-700"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleClockIn}
            disabled={!canClockIn || loading}
            className="w-full h-12 text-white disabled:opacity-50"
            style={{backgroundColor: canClockIn ? '#bf2520' : '#989c9f'}}
          >
            {loading && canClockIn ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Clock In
          </Button>

          <Button
            onClick={handleClockOut}
            disabled={!canClockOut || loading}
            variant="outline"
            className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading && canClockOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            Clock Out
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleBreak(true)}
              disabled={!canStartBreak || loading}
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 disabled:opacity-50"
            >
              {loading && canStartBreak ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Coffee className="w-3 h-3 mr-1" />
              )}
              Start Break
            </Button>

            <Button
              onClick={() => handleBreak(false)}
              disabled={!canEndBreak || loading}
              variant="outline"
              size="sm"
              className="border-violet-200 hover:bg-violet-50 disabled:opacity-50"
              style={{color: !canEndBreak ? '#989c9f' : '#bf2520'}}
            >
              {loading && canEndBreak ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              End Break
            </Button>
          </div>
        </div>

        {todayAttendance && (
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{color: '#989c9f'}}>Clock In:</span>
                <span className="font-medium text-gray-900">
                  {todayAttendance.clock_in ? format(new Date(todayAttendance.clock_in), "h:mm a") : "-"}
                </span>
              </div>
              {todayAttendance.clock_out && (
                <div className="flex justify-between">
                  <span style={{color: '#989c9f'}}>Clock Out:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(todayAttendance.clock_out), "h:mm a")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{color: '#989c9f'}}>Status:</span>
                <Badge 
                  variant="outline" 
                  className={
                    todayAttendance.status === "on_break" ? "border-amber-200 text-amber-700" :
                    todayAttendance.status === "present" ? "border-green-200 text-green-700" :
                    "border-gray-200 text-gray-700"
                  }
                >
                  {todayAttendance.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
