"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
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
          <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b border-lightGray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-crimsonRed rounded-lg">
                <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-darkSlateBlue">
                Student Research
              </h1>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              
              {/* Profile Picture or Initials */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="focus:outline-none focus:ring-4 focus:ring-crimsonRed rounded-full transform hover:scale-105 transition-all duration-200"
                  aria-label="User menu"
                  aria-expanded={isDropdownOpen}
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()!}
                      alt="Profile"
                      className="w-11 h-11 rounded-full object-cover cursor-pointer border-2 border-indigo-200 hover:border-indigo-400 transition-colors shadow-md"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-darkSlateBlue text-ivory flex items-center justify-center font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all">
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
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-crimsonRed hover:bg-red-50 transition-colors font-medium"
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
        <div className="bg-white rounded-2xl shadow-xl border border-lightGray p-8 mb-8 transform hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-crimsonRed rounded-xl">
              <svg className="w-8 h-8 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-darkSlateBlue">
                Welcome Back, {user?.user_metadata?.full_name?.split(" ")[0] || "Researcher"}!
              </h2>
              <p className="text-gray-600 mt-1">
                Ready to advance your research journey today?
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Research Projects Card */}
          <div className="group bg-white rounded-2xl shadow-lg border border-lightGray p-6 hover:shadow-2xl hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Research Projects</h3>
            </div>
            <p className="text-gray-600 mb-4">View and manage your research projects here.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              Explore Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Resources Card */}
          <div className="group bg-white rounded-2xl shadow-lg border border-lightGray p-6 hover:shadow-2xl hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Resources</h3>
            </div>
            <p className="text-gray-600 mb-4">Access research resources and materials.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              Browse Resources
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Collaboration Card */}
          <div className="group bg-white rounded-2xl shadow-lg border border-lightGray p-6 hover:shadow-2xl hover:border-skyBlue transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-crimsonRed rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-darkSlateBlue">Collaboration</h3>
            </div>
            <p className="text-gray-600 mb-4">Connect with peers and mentors.</p>
            <button className="text-crimsonRed font-semibold hover:text-darkSlateBlue flex items-center gap-2 group-hover:gap-3 transition-all">
              Start Collaborating
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-lightGray p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-skyBlue/20 rounded-xl">
                <svg className="w-8 h-8 text-skyBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-lightGray p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Saved Resources</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-skyBlue/20 rounded-xl">
                <svg className="w-8 h-8 text-skyBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-lightGray p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Collaborators</p>
                <p className="text-3xl font-bold text-darkSlateBlue mt-1">0</p>
              </div>
              <div className="p-3 bg-skyBlue/20 rounded-xl">
                <svg className="w-8 h-8 text-skyBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
