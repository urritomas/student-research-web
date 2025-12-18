"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa"; 
import Button from "./Button"

type Mode = "login" | "register";

function GoogleSignInButton() {
    const [loading, setLoading] = useState(false);
  
    const handleGoogleSignIn = async () => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/home`,
          },
        });
        
        if (error) {
          console.error("Google sign in error:", error);
          alert("Failed to sign in with Google. Please try again.");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        alert("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition duration-100 hover:scale-110"
        aria-label="Sign in with Google"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </button>
    );
  }
  

function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/home`
          },
        });
        
        if (error) throw error;
        
        if (data?.user?.identities?.length === 0) {
          setMessage("This email is already registered. Please login instead.");
        } else if (data?.user && !data.session) {
          setMessage("Registration successful! Please check your email to verify your account.");
        } else {
          setMessage("Registration successful!");
          router.push("/home");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Signed in successfully");
        router.push("/home");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] md:scale-110 ">
      {/* <Button children='hello' color='primaryTxt' size='sm'/>
      <Button children='hello' color='success' size='md'/>
      <Button children='hello' color='alert' size='lg'/>
      <Button children='hello' color='accent' size='xl'/> */}
      <form onSubmit={handleSubmit} className="flex flex-col justify-center bg-lightGray rounded-lg border-darkSlateBlue border-2 shadow-xl p-6 m-3">
        <h1 className="text-2xl text-center text-darkSlateBlue font-bold">
          {mode === "login" ? "Login" : "Register"}
        </h1>
        
        {mode === "register" && (
          <div className="flex flex-wrap items-center">
            <input
              className="text-darkSlateBlue w-full h-8 outline-none pl-3 pr-10 pb-4 pt-4 border-slate-300 my-5 border-2 rounded-sm"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FaUser className="absolute right-14" />
          </div>
        )}

        <div className="flex flex-wrap items-center">
          <input
            className="text-darkSlateBlue w-full h-8 outline-none pl-3 pr-10 py-5 border-slate-300 my-5 border-2 rounded-lg transition duration-150 hover:border-slate-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FaUser className="absolute right-14 transition duration-150 hover:scale-110" />
        </div>

        <div className="flex flex-wrap items-center">
          <input
            className="text-darkSlateBlue w-full h-8 outline-none pl-3 pr-10 py-5 border-slate-300 border-2 rounded-lg transition duration-150 hover:border-slate-400"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <FaLock className="absolute right-14 transition duration-150 hover:scale-110" />
        </div>

        {mode === "login" && (
          <div className="flex justify-between items-center my-4">
            <div className="flex items-center transition duration-150">
              <input 
                id="rememberMe" 
                className="accent-darkSlateBlue transition duration-150"
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="text-darkSlateBlue ml-2 text-sm transition duration-150 hover:text-blue-600" htmlFor="rememberMe">
                Remember me
              </label>
            </div>

            <a href="#" className="text-darkSlateBlue ml-2 text-sm transition duration-150 hover:text-blue-600">
              Forgot Password?
            </a>
          </div>
        )}

        {message && (
          <div className={`text-darkSlateBlue text-sm text-center my-2 ${message.includes("error") || message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="text-darkSlateBlue bg-skyBlue rounded-lg my-2 w-4/5 p-2 self-center cursor-pointer hover:bg-blue-400 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed duration-150"
        >
          {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
        </button>

        <div className="flex justify-center my-3">
          <GoogleSignInButton />
        </div>

        <p className="text-darkSlateBlue text-center text-sm">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <a href={mode === "login" ? "/register" : "/login"} className="font-bold transition duration-150 hover:text-blue-600">
            {mode === "login" ? "Register" : "Login"}
          </a>
        </p>
      </form>
    </div>
  );
}

export default AuthForm