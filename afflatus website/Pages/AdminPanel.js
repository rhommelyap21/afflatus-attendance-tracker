
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Attendance } from "@/entities/Attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { 
  Users, 
  Search,
  Filter,
  Calendar,
  Clock,
  TrendingUp,
  Shield
} from "lucide-react";

export default function AdminPanel() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAttendance, setUserAttendance] = useState([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedDepartment, allUsers]);

  const loadAdminData = async () => {
    try {
      const user = await User.me();
      
      if (user.role !== 'admin') {
        // Redirect non-admin users
        window.location.href = '/dashboard';
        return;
      }
      
      setCurrentUser(user);

      // Load all users
      const users = await User.list();
      setAllUsers(users.filter(u => u.employee_id)); // Only users with complete profiles

      // Load all attendance records
      const attendance = await Attendance.list("-created_date");
      setAllAttendance(attendance);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = allUsers;

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(lowercasedFilter) ||
        user.email?.toLowerCase().includes(lowercasedFilter) ||
        user.employee_id?.toLowerCase().includes(lowercasedFilter) ||
        user.first_name?.toLowerCase().includes(lowercasedFilter) ||
        user.surname?.toLowerCase().includes(lowercasedFilter)
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(user => user.department === selectedDepartment);
    }

    setFilteredUsers(filtered);
  };

  const loadUserAttendance = async (user) => {
    setSelectedUser(user);
    const attendance = allAttendance.filter(record => record.user_email === user.email);
    setUserAttendance(attendance.slice(0, 10)); // Last 10 records
  };

  const calculateUserStats = (userEmail) => {
    const userRecords = allAttendance.filter(record => record.user_email === userEmail);
    const thisMonth = userRecords.filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });

    const totalHours = thisMonth.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const averageHours = thisMonth.length > 0 ? totalHours / thisMonth.length : 0;
    const perfectDays = thisMonth.filter(record => record.total_hours >= 8).length;

    return { totalHours, averageHours, perfectDays, totalDays: thisMonth.length };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage users and monitor attendance</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="IT Development">IT Development</SelectItem>
                <SelectItem value="HR">Human Resources</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2">
          <Card className="glass-effect border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const stats = calculateUserStats(user.email);
                  const displayName = (user.first_name && user.surname) ? `${user.first_name} ${user.surname}`.trim() : user.full_name;
                  const fallbackInitial = user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.full_name?.charAt(0).toUpperCase() || "U");
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                      onClick={() => loadUserAttendance(user)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url} alt={displayName} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            {fallbackInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{displayName}</h3>
                          <p className="text-sm text-gray-500">{user.employee_id} • {user.department}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.position}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {stats.totalHours.toFixed(1)}h this month
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.totalDays} days • {stats.perfectDays} perfect
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Details */}
        <div>
          <Card className="glass-effect border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {selectedUser ? 'User Details' : 'Select a User'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                        {selectedUser.first_name?.charAt(0).toUpperCase() || selectedUser.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-gray-900">{(selectedUser.first_name && selectedUser.surname) ? `${selectedUser.first_name} ${selectedUser.surname}`.trim() : selectedUser.full_name}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <Badge className="mt-2">
                      {selectedUser.department} • {selectedUser.position}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Recent Attendance</h4>
                    {userAttendance.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No attendance records found</p>
                    ) : (
                      <div className="space-y-2">
                        {userAttendance.map((record) => (
                          <div key={record.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(record.date), "MMM d")}
                              </p>
                              <p className="text-xs text-gray-500">
                                {record.clock_in ? format(new Date(record.clock_in), "h:mm a") : "-"} - 
                                {record.clock_out ? format(new Date(record.clock_out), "h:mm a") : "-"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {record.total_hours?.toFixed(1) || "0"}h
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  record.status === "present" ? "border-green-200 text-green-700" :
                                  record.status === "late" ? "border-yellow-200 text-yellow-700" :
                                  "border-gray-200 text-gray-700"
                                }`}
                              >
                                {record.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a team member to view their details and attendance history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
