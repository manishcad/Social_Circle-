'use client'
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import "./style.css";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user was redirected after email verification
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccess("Email verified successfully! You can now login with your credentials.");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignup) {
        const res = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify(form),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess("Registration successful! Please check your email to verify your account.");
          // Clear form after successful registration
          setForm({ name: "", email: "", password: "" });
        } else {
          setError(data.error || "Registration failed. Please try again.");
        }
      } else {
        const res = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (res?.ok) {
          router.push("/");
        } else {
          setError("Invalid login credentials. Please check your email and password.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container flex flex-col">
      {/* App Title */}
      <div className="text-center mb-8">
        <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter drop-shadow-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Social Circle
        </h1>
        <p className="text-xl md:text-2xl font-light text-indigo-100 mb-2">
          Your Life&apos;s Playground
        </p>
        <div className="w-16 h-1 bg-gradient-to-r from-indigo-400 to-pink-400 mx-auto rounded-full"></div>
      </div>
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isSignup ? "Create Account" : "Login"}</h2>
        
        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {isSignup && (
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            value={form.name}
            onChange={handleChange}
            disabled={isLoading}
          />
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={handleChange}
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={handleChange}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <span>{isSignup ? "Sign Up" : "Login"}</span>
          )}
        </button>
        <p onClick={() => {
          setIsSignup(!isSignup);
          setError("");
          setSuccess("");
          setForm({ name: "", email: "", password: "" });
        }}>
          {isSignup
            ? "Already have an account? Login"
            : "Dont have an account? Sign Up"}
        </p>
      </form>
    </div>
  );
}
