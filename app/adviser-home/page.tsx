"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

function AdviserHome() {
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
                Research Adviser Portal
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
                    <p className="text-xs text-darkSlateBlue truncate">{user?.email}</p>
                  </div>
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
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl border border-lightGray p-8 mb-8 hover:border-skyBlue transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-crimsonRed rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-darkSlateBlue">
                Welcome Back, {user?.user_metadata?.full_name?.split(" ")[0] || "Adviser"}!
              </h2>
              <p className="text-darkSlateBlue mt-1">
                Manage and guide your students' research journey
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Students Card */}
          <div className="group bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">My Students</h3>
            </div>
            <p className="text-darkSlateBlue mb-4">View and manage your advisees' information.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              View Students
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Research Projects Card */}
          <div className="group bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Research Projects</h3>
            </div>
            <p className="text-darkSlateBlue mb-4">Review and provide feedback on student projects.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              Review Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Pending Reviews Card */}
          <div className="group bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Pending Reviews</h3>
            </div>
            <p className="text-darkSlateBlue mb-4">Check submissions awaiting your review.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              View Pending
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Meetings & Schedule Card */}
          <div className="group bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Meetings</h3>
            </div>
            <p className="text-darkSlateBlue mb-4">Schedule and manage student consultations.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              View Calendar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Resources Library Card */}
          <div className="group bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Resources</h3>
            </div>
            <p className="text-darkSlateBlue mb-4">Share research materials with students.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              Manage Resources
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Analytics & Reports Card */}
          <div className="group bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Analytics</h3>
            </div>
            <p className="text-darkSlateBlue mb-4">View progress reports and analytics.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              View Reports
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-darkSlateBlue font-medium">Total Students</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-darkSlateBlue font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-darkSlateBlue font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-darkSlateBlue font-medium">Upcoming Meetings</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl border border-lightGray p-6 hover:border-skyBlue transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-crimsonRed rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-darkSlateBlue">Recent Activity</h3>
          </div>
          <div className="text-center py-8 text-darkSlateBlue">
            <svg className="w-16 h-16 mx-auto mb-4 text-lightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No recent activity to display</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdviserHome;
