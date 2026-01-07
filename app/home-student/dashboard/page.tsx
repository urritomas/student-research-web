"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getUserInitials = () => {
    if (!user) return "??";
    
    const name = user.user_metadata?.full_name || user.email || "User";
    const nameParts = name.split(" ");
    
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return name.slice(0, 2).toUpperCase();
  };

  const getProfileImage = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-darkSlateBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-darkSlateBlue">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Navbar */}
      <nav className="bg-white border-b border-lightGray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-crimsonRed rounded-lg">
                <svg className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-darkSlateBlue">
                Student Research
              </h1>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-darkSlateBlue hidden sm:block">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              
              {/* Profile Picture or Initials */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="focus:outline-none focus:ring-2 focus:ring-crimsonRed rounded-full transform hover:scale-105 transition-all duration-200"
                  aria-label="User menu"
                  aria-expanded={isDropdownOpen}
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()!}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-lightGray hover:border-skyBlue transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-darkSlateBlue text-white flex items-center justify-center font-bold cursor-pointer hover:opacity-90 transition-opacity">
                      {getUserInitials()}
                    </div>
                  )}
                </button>
                
                {/* Dropdown Menu */}
                <div 
                  className={`absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-lightGray py-2 z-50 overflow-hidden transition-all duration-200 origin-top ${
                    isDropdownOpen 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <div className="px-4 py-3 border-b border-lightGray">
                    <p className="text-sm font-semibold text-darkSlateBlue">
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-xs text-darkSlateBlue opacity-60 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => router.push("/home-student")}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-darkSlateBlue hover:bg-ivory transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-crimsonRed hover:bg-ivory transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-crimsonRed rounded-lg">
              <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-darkSlateBlue">Research Dashboard</h1>
          </div>
          <p className="text-darkSlateBlue opacity-70 ml-14">
            Track your ongoing research projects and manage class invitations
          </p>
        </div>

        {/* In-Progress Research Papers Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-skyBlue rounded-lg">
              <svg className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-darkSlateBlue">In-Progress Research Papers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Research Paper Card 1 */}
            <div className="bg-white rounded-2xl border-2 border-lightGray p-6 hover:border-skyBlue hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-crimsonRed bg-opacity-10 rounded-xl">
                  <svg className="w-6 h-6 text-crimsonRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="bg-skyBlue bg-opacity-20 text-darkSlateBlue text-xs font-semibold px-3 py-1 rounded-full">
                  In Progress
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-darkSlateBlue mb-2">
                Quantum Computing Survey
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-darkSlateBlue opacity-70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Dr. Sarah Johnson - Advanced CS</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-darkSlateBlue opacity-70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Updated: Jan 5, 2026</span>
                </div>
              </div>

              <button className="w-full bg-crimsonRed text-white font-semibold py-3 px-6 rounded-xl hover:bg-opacity-90 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Continue Work
              </button>
            </div>

            {/* Research Paper Card 2 */}
            <div className="bg-white rounded-2xl border-2 border-lightGray p-6 hover:border-skyBlue hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-crimsonRed bg-opacity-10 rounded-xl">
                  <svg className="w-6 h-6 text-crimsonRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="bg-mutedGreen bg-opacity-20 text-darkSlateBlue text-xs font-semibold px-3 py-1 rounded-full">
                  Data Collection
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-darkSlateBlue mb-2">
                AI Ethics in Healthcare
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-darkSlateBlue opacity-70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Prof. Michael Chen - Ethics 301</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-darkSlateBlue opacity-70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Updated: Jan 6, 2026</span>
                </div>
              </div>

              <button className="w-full bg-crimsonRed text-white font-semibold py-3 px-6 rounded-xl hover:bg-opacity-90 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Continue Work
              </button>
            </div>

            {/* Research Paper Card 3 */}
            <div className="bg-white rounded-2xl border-2 border-lightGray p-6 hover:border-skyBlue hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-crimsonRed bg-opacity-10 rounded-xl">
                  <svg className="w-6 h-6 text-crimsonRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="bg-skyBlue bg-opacity-20 text-darkSlateBlue text-xs font-semibold px-3 py-1 rounded-full">
                  In Progress
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-darkSlateBlue mb-2">
                Climate Change Impact Study
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-darkSlateBlue opacity-70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Dr. Emily Martinez - Environmental Sci</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-darkSlateBlue opacity-70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Updated: Jan 4, 2026</span>
                </div>
              </div>

              <button className="w-full bg-crimsonRed text-white font-semibold py-3 px-6 rounded-xl hover:bg-opacity-90 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
