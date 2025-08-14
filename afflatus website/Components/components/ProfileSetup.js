import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Building2, RefreshCw } from "lucide-react";

export default function ProfileSetup({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState("");
  const [generatingId, setGeneratingId] = useState(false);
  const [formData, setFormData] = useState({
    surname: "",
    first_name: "",
    middle_initial: "",
    department: "",
    position: "Intern",
    start_date: ""
  });

  const generateEmployeeId = async () => {
    const { start_date, surname, first_name, middle_initial } = formData;

    // Check if we have the minimum required data
    if (!start_date || !surname?.trim() || !first_name?.trim()) {
      return "";
    }

    try {
      // Parse the start date more carefully
      const dateStr = start_date;
      const dateParts = dateStr.split('-');
      const year = dateParts[0];
      const month = dateParts[1];

      // Create initials safely
      const sInitial = surname.trim().charAt(0).toUpperCase();
      const fInitial = first_name.trim().charAt(0).toUpperCase();
      const mInitial = middle_initial?.trim() ? middle_initial.trim().charAt(0).toUpperCase() : '';
      const initials = `${sInitial}${fInitial}${mInitial}`;

      // Generate a simple unique number based on timestamp
      const timestamp = Date.now();
      const uniqueNumber = (timestamp % 10000).toString().padStart(4, '0');

      const employeeId = `${year}-${initials}-${month}-${uniqueNumber}`;
      console.log("Generated Employee ID:", employeeId);
      return employeeId;
    } catch (error) {
      console.error("Error generating employee ID:", error);
      return "";
    }
  };

  useEffect(() => {
    const updateEmployeeId = async () => {
      const { start_date, surname, first_name } = formData;
      
      if (start_date && surname?.trim() && first_name?.trim()) {
        setGeneratingId(true);
        setGeneratedEmployeeId("Generating...");
        
        // Add a small delay to show the generating state
        setTimeout(async () => {
          try {
            const id = await generateEmployeeId();
            setGeneratedEmployeeId(id || "Unable to generate");
          } catch (error) {
            console.error("Failed to generate ID:", error);
            setGeneratedEmployeeId("Unable to generate");
          }
          setGeneratingId(false);
        }, 500);
      } else {
        setGeneratedEmployeeId("");
      }
    };

    updateEmployeeId();
  }, [formData.start_date, formData.surname, formData.first_name, formData.middle_initial]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.surname?.trim()) {
      setError("Surname is required.");
      return;
    }
    if (!formData.first_name?.trim()) {
      setError("First Name is required.");
      return;
    }
    if (!formData.start_date) {
      setError("Start Date is required.");
      return;
    }
    if (!formData.department) {
      setError("Department is required.");
      return;
    }
    
    // Check if Employee ID was generated successfully
    if (!generatedEmployeeId || generatedEmployeeId === "Generating..." || generatedEmployeeId === "Unable to generate") {
      setError("Please wait for the Employee ID to be generated or refresh the page.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const profileData = {
        surname: formData.surname.trim(),
        first_name: formData.first_name.trim(),
        middle_initial: formData.middle_initial?.trim() || "",
        department: formData.department,
        position: formData.position,
        start_date: formData.start_date,
        employee_id: generatedEmployeeId
      };
      
      console.log("Submitting profile data:", profileData);
      await User.updateMyUserData(profileData);
      console.log("Profile updated successfully");
      onComplete();
    } catch (error) {
      console.error("Profile setup error:", error);
      setError("Failed to save your profile. Please try again.");
    }
    setLoading(false);
  };

  const canSubmit = formData.surname?.trim() && 
                   formData.first_name?.trim() && 
                   formData.start_date && 
                   formData.department && 
                   generatedEmployeeId && 
                   generatedEmployeeId !== "Generating..." && 
                   generatedEmployeeId !== "Unable to generate" &&
                   !loading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Welcome to AttendanceHub
          </h1>
          <p className="text-gray-600 text-lg">
            Hi {user?.full_name}! Let's complete your profile to get started.
          </p>
        </div>

        <Card className="glass-effect border-0 shadow-2xl max-w-2xl mx-auto">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Building2 className="w-6 h-6" />
              Complete Your Profile
            </CardTitle>
            <p className="text-gray-600">Fill in your name and start date to auto-generate your Employee ID</p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="start_date" className="text-sm font-medium">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              {/* Auto-Generated Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="employee_id" className="text-sm font-medium flex items-center gap-2">
                  Auto-Generated Employee ID
                  {generatingId && <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />}
                </Label>
                <div className="relative">
                  <Input
                    id="employee_id"
                    value={generatedEmployeeId || "Fill in name and start date above"}
                    disabled
                    className={`h-12 font-mono text-center text-lg font-semibold ${
                      generatedEmployeeId && generatedEmployeeId !== "Generating..." && generatedEmployeeId !== "Unable to generate"
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                        : generatedEmployeeId === "Unable to generate"
                        ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-700"
                        : "bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 text-violet-700"
                    }`}
                  />
                  {generatedEmployeeId && generatedEmployeeId !== "Generating..." && generatedEmployeeId !== "Unable to generate" && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Format: YYYY-[Surname][FirstName][MiddleInitial]-MM-####
                </p>
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
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Sales and Leasing">Sales and Leasing</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Legal and Compliance">Legal and Compliance</SelectItem>
                      <SelectItem value="Financial and Accounting">Financial and Accounting</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT Development">IT Development</SelectItem>
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
                      <SelectItem value="President">President</SelectItem>
                      <SelectItem value="Vice President of Operations">Vice President of Operations</SelectItem>
                      <SelectItem value="CEO">CEO</SelectItem>
                      <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                      <SelectItem value="Marketing Officer">Marketing Officer</SelectItem>
                      <SelectItem value="Legal Officer">Legal Officer</SelectItem>
                      <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Admin staff">Admin staff</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    "Complete Setup & Continue"
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Next steps:</strong> After completing your profile, you'll be able to clock in/out, view reports, and track your attendance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}