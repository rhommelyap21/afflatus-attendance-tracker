
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User as UserIcon, Settings, Save } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    full_name: "", // This will hold the name from Google account, used for display only
    surname: "",
    first_name: "",
    middle_initial: "",
    employee_id: "",
    phone: "", // Preserve phone functionality
    department: "",
    position: "",
    start_date: ""
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || "",
        surname: currentUser.surname || "",
        first_name: currentUser.first_name || "",
        middle_initial: currentUser.middle_initial || "",
        employee_id: currentUser.employee_id || "",
        phone: currentUser.phone || "", // Preserve phone functionality
        department: currentUser.department || "",
        position: currentUser.position || "Intern",
        start_date: currentUser.start_date || ""
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.department || !formData.surname || !formData.first_name) {
      setMessage("Surname, First Name, Employee ID and Department are required.");
      return;
    }

    setSaving(true);
    try {
      await User.updateMyUserData(formData);
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("❌ Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
              {formData.first_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Profile Form */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={message.includes("✅") ? "border-green-200 bg-green-50 mb-6" : "border-red-200 bg-red-50 mb-6"}>
              <AlertDescription className={message.includes("✅") ? "text-green-700" : "text-red-700"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name_google" className="text-sm font-medium">Google Account Name</Label>
              <Input
                id="full_name_google"
                value={formData.full_name}
                className="h-12 bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500">This is provided by your Google account and cannot be changed here.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="surname" className="text-sm font-medium">
                    Surname <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => handleInputChange("surname", e.target.value)}
                    placeholder="Enter your surname"
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="Enter your first name"
                    className="h-12"
                    required
                  />
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="middle_initial" className="text-sm font-medium">Middle Initial</Label>
                <Input
                  id="middle_initial"
                  value={formData.middle_initial}
                  onChange={(e) => handleInputChange("middle_initial", e.target.value)}
                  placeholder="e.g. M"
                  maxLength="1"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_id" className="text-sm font-medium">
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange("employee_id", e.target.value)}
                  placeholder="Enter your employee ID"
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Development">IT Development</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium">Position</Label>
                <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intern">Intern</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="h-12 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">This cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Account Role</Label>
                  <Input
                    value={user?.role || "user"}
                    disabled
                    className="h-12 bg-gray-50 capitalize"
                  />
                  <p className="text-xs text-gray-500">Contact admin to change role</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={saving}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
