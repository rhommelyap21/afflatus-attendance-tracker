import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Attendance } from "@/entities/Attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Award,
  Download,
  Filter,
  BarChart3
} from "lucide-react";

export default function Reports() {
  const [user, setUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  useEffect(() => {
    filterDataByPeriod();
  }, [selectedPeriod, attendanceData]);

  const loadReportsData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load last 3 months of attendance data
      const attendance = await Attendance.filter(
        { user_email: currentUser.email },
        "-date",
        100
      );
      setAttendanceData(attendance);
    } catch (error) {
      console.error("Error loading reports data:", error);
    }
    setLoading(false);
  };

  const filterDataByPeriod = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case "current_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case "current_week":
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const filtered = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    setFilteredData(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const calculateStats = () => {
    const totalHours = filteredData.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const totalOvertime = filteredData.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
    const averageHours = filteredData.length > 0 ? totalHours / filteredData.length : 0;
    const perfectDays = filteredData.filter(record => record.total_hours >= 8).length;
    const lateDays = filteredData.filter(record => record.status === "late").length;
    const presentDays = filteredData.filter(record => record.status === "present").length;

    return {
      totalHours,
      totalOvertime,
      averageHours,
      perfectDays,
      lateDays,
      presentDays,
      totalDays: filteredData.length
    };
  };

  const exportToCSV = () => {
    const headers = ["Date", "Clock In", "Clock Out", "Total Hours", "Overtime", "Status"];
    const csvData = filteredData.map(record => [
      record.date,
      record.clock_in ? format(new Date(record.clock_in), "HH:mm") : "-",
      record.clock_out ? format(new Date(record.clock_out), "HH:mm") : "-",
      record.total_hours?.toFixed(2) || "0",
      record.overtime_hours?.toFixed(2) || "0",
      record.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${selectedPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700 border-green-200";
      case "late": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "early_leave": return "bg-orange-100 text-orange-700 border-orange-200";
      case "on_break": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600 mt-1">View and analyze your attendance patterns</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="current_week">Current Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={filteredData.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg: {stats.averageHours.toFixed(1)}h per day
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overtime</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalOvertime.toFixed(1)}h</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Extra hours worked
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Perfect Days</p>
                <p className="text-2xl font-bold text-amber-600">{stats.perfectDays}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              8+ hours days
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.presentDays} of {stats.totalDays} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Records */}
      <Card className="glass-effect border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No records found</p>
              <p>No attendance data available for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Clock In</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Clock Out</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hours</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Overtime</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(record.date), "EEEE")}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {record.clock_in ? format(new Date(record.clock_in), "h:mm a") : "-"}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {record.clock_out ? format(new Date(record.clock_out), "h:mm a") : "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {record.total_hours?.toFixed(1) || "0.0"}h
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {record.overtime_hours > 0 ? (
                          <span className="font-medium text-green-600">
                            +{record.overtime_hours.toFixed(1)}h
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}