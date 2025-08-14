
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  Home,
  Clock,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  // Removed Shield icon as Role Management is removed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "Time Tracking", url: createPageUrl("TimeTracking"), icon: Clock },
  { title: "Reports", url: createPageUrl("Reports"), icon: BarChart3 },
  { title: "Profile", url: createPageUrl("Profile"), icon: Settings },
  { title: "Admin Panel", url: createPageUrl("AdminPanel"), icon: Users, adminOnly: true },
  // Removed new navigation item for Role Management as it's non-functional
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("User not authenticated:", error);
      // Don't redirect here - let pages handle authentication
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-lato">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is found, still show the layout but let pages handle auth
  const displayName = user ?
    ((user.first_name && user.surname) ? `${user.first_name} ${user.surname}`.trim() : user.full_name)
    : "User";
  const fallbackInitial = user ?
    (user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.full_name?.charAt(0).toUpperCase() || "U"))
    : "U";

  return (
    <div className="min-h-screen bg-gray-50 font-lato text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        
        :root {
          --accent-primary: #bf2520;
          --text-secondary: #989c9f;
          --text-primary: #ffffff;
        }
        
        body, :root {
          font-family: 'Lato', sans-serif;
        }

        .card-themed {
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          color: #111827 !important;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .nav-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-item:hover {
          transform: translateX(4px);
          background: rgba(191, 37, 32, 0.1);
          border-left: 3px solid var(--accent-primary);
          color: var(--accent-primary);
        }
        
        .nav-item.active {
          background: rgba(191, 37, 32, 0.15);
          border-left: 3px solid var(--accent-primary);
          color: var(--accent-primary) !important;
          font-weight: 700;
        }
      `}</style>

      {/* Mobile Header - Always show */}
      <header className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold" style={{color: '#bf2520'}}>
              AttendanceHub
            </h1>
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar_url} alt={displayName} />
                    <AvatarFallback style={{backgroundColor: '#bf2520'}} className="text-white">
                      {fallbackInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border-gray-200" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm text-gray-900">{displayName}</p>
                    <p className="text-xs" style={{color: '#989c9f'}}>{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-200"/>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Profile")} className="flex items-center gap-2 text-gray-700">
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} style={{color: '#bf2520'}}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - Always show */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:min-h-screen bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold" style={{color: '#bf2520'}}>
              AttendanceHub
            </h1>
            <p className="text-sm mt-1" style={{color: '#989c9f'}}>Professional Time Management</p>
          </div>

          {user && (
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  if (item.adminOnly && user?.role !== 'admin') return null;

                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive ? 'active' : 'hover:text-red-600'
                      }`}
                      style={{color: isActive ? '#bf2520' : '#989c9f'}}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}

          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar_url} alt={displayName} />
                  <AvatarFallback style={{backgroundColor: '#bf2520'}} className="text-white">
                    {fallbackInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-gray-900">{displayName}</p>
                  <p className="text-xs truncate" style={{color: '#989c9f'}}>{user?.department || "Department"}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-gray-500 hover:text-gray-700">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-gray-200">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Profile")} className="text-gray-700">Profile Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} style={{color: '#bf2520'}}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && user && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 h-full bg-white border-r border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{color: '#bf2520'}}>
                  AttendanceHub
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'admin') return null;

                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setSidebarOpen(false)}
                        className={`nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          isActive ? 'active' : 'hover:text-red-600'
                        }`}
                        style={{color: isActive ? '#bf2520' : '#989c9f'}}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-2">
                  <Link
                    to={createPageUrl("Profile")}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all"
                    style={{color: '#989c9f'}}
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                    style={{color: '#bf2520'}}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
