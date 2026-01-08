"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

function Home() {
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
        <div className="bg-white rounded-2xl border border-lightGray p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-crimsonRed rounded-xl">
                <svg className="w-8 h-8 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-darkSlateBlue">
                  Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Student"}!
                </h2>
                <p className="text-darkSlateBlue opacity-70 mt-1">
                  View your assigned research and classes
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/home-student/dashboard")}
              className="bg-crimsonRed text-white font-semibold py-3 px-8 rounded-xl hover:bg-opacity-90 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Go to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Join a Class Section - Prominent */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-skyBlue shadow-lg p-8 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-skyBlue rounded-xl">
                  <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-darkSlateBlue">Join a Class</h3>
              </div>
              
              <p className="text-darkSlateBlue opacity-70 mb-6 text-sm">
                Enter the class code provided by your adviser to join a research class
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="classCode" className="block text-sm font-semibold text-darkSlateBlue mb-2">
                    Class Code
                  </label>
                  <input
                    type="text"
                    id="classCode"
                    placeholder="Enter class code"
                    className="w-full px-4 py-3 border-2 border-lightGray rounded-xl focus:outline-none focus:border-skyBlue focus:ring-2 focus:ring-skyBlue focus:ring-opacity-20 transition-all text-darkSlateBlue placeholder:text-darkSlateBlue placeholder:opacity-40"
                  />
                </div>

                <button className="w-full bg-crimsonRed text-white font-semibold py-3 px-6 rounded-xl hover:bg-opacity-90 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Join Class
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-lightGray">
                <p className="text-xs text-darkSlateBlue opacity-60 text-center">
                  Don't have a class code? Contact your adviser to get an invitation.
                </p>
              </div>
            </div>
          </div>

          {/* Pending Invitations Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-lightGray p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-crimsonRed rounded-xl">
                  <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-darkSlateBlue">Pending Invitations</h3>
              </div>

              {/* Sample Invitation Items */}
              <div className="space-y-4">
                {/* Invitation 1 */}
                <div className="border border-lightGray rounded-xl p-6 hover:border-skyBlue hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-skyBlue bg-opacity-20 rounded-lg">
                          <svg className="w-5 h-5 text-darkSlateBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-darkSlateBlue">Advanced Research Methods</h4>
                          <p className="text-sm text-darkSlateBlue opacity-60">Invited by Dr. Sarah Johnson</p>
                        </div>
                      </div>
                      <p className="text-sm text-darkSlateBlue opacity-70 ml-14">
                        Research project focusing on quantitative analysis and statistical modeling
                      </p>
                    </div>
                    <button className="bg-mutedGreen text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transform hover:scale-[1.05] transition-all duration-200 shadow-sm hover:shadow whitespace-nowrap">
                      Accept
                    </button>
                  </div>
                </div>

                {/* Invitation 2 */}
                <div className="border border-lightGray rounded-xl p-6 hover:border-skyBlue hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-skyBlue bg-opacity-20 rounded-lg">
                          <svg className="w-5 h-5 text-darkSlateBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-darkSlateBlue">Machine Learning Fundamentals</h4>
                          <p className="text-sm text-darkSlateBlue opacity-60">Invited by Prof. Michael Chen</p>
                        </div>
                      </div>
                      <p className="text-sm text-darkSlateBlue opacity-70 ml-14">
                        Introduction to ML algorithms and their applications in research
                      </p>
                    </div>
                    <button className="bg-mutedGreen text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transform hover:scale-[1.05] transition-all duration-200 shadow-sm hover:shadow whitespace-nowrap">
                      Accept
                    </button>
                  </div>
                </div>

                {/* Invitation 3 */}
                <div className="border border-lightGray rounded-xl p-6 hover:border-skyBlue hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-skyBlue bg-opacity-20 rounded-lg">
                          <svg className="w-5 h-5 text-darkSlateBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-darkSlateBlue">Literature Review Workshop</h4>
                          <p className="text-sm text-darkSlateBlue opacity-60">Invited by Dr. Emily Martinez</p>
                        </div>
                      </div>
                      <p className="text-sm text-darkSlateBlue opacity-70 ml-14">
                        Learn systematic approaches to conducting comprehensive literature reviews
                      </p>
                    </div>
                    <button className="bg-mutedGreen text-white font-semibold py-2 px-6 rounded-lg hover:bg-opacity-90 transform hover:scale-[1.05] transition-all duration-200 shadow-sm hover:shadow whitespace-nowrap">
                      Accept
                    </button>
                  </div>
                </div>

                {/* Empty State - Uncomment to show empty state */}
                {/* <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-lightGray bg-opacity-50 rounded-full mb-4">
                    <svg className="w-10 h-10 text-darkSlateBlue opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-darkSlateBlue mb-2">No pending invitations</h4>
                  <p className="text-darkSlateBlue opacity-60 max-w-md mx-auto">
                    You don't have any class invitations at the moment. Use the class code to join a class or wait for your adviser to send you an invitation.
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
