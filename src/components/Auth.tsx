import React from "react";
import { 
  Compass, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  Sun,
  Moon,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

interface AuthProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
  syncProfile: (email: string, name?: string, isGovernment?: boolean) => Promise<void>;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export default function Auth({ onLoginSuccess, syncProfile, theme, onThemeToggle }: AuthProps) {
  const [activeTab, setActiveTab] = React.useState<"citizen" | "government">("citizen");
  const [isRegistering, setIsRegistering] = React.useState(false);
  
  // Form states
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [governmentPin, setGovernmentPin] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showPin, setShowPin] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // OTP Verification Simulation State
  const [showOtpScreen, setShowOtpScreen] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [generatedOtp, setGeneratedOtp] = React.useState("5824");
  const [otpError, setOtpError] = React.useState("");
  const [otpSuccess, setOtpSuccess] = React.useState(false);

  // Preset evaluator quick logins
  const CITIZEN_PRESETS = [
    { name: "Clara Civic", email: "clara.civic@gmail.com", points: 340, desc: "Community Activist" },
    { name: "David Eco", email: "david.eco@gmail.com", points: 580, desc: "Clean Ranger" },
    { name: "Marcus Green", email: "marcus.green@gmail.com", points: 420, desc: "Local Resident" }
  ];

  const GOV_PRESETS = [
    { name: "Officer Harrison", email: "harrison@civic.gov", pin: "GOV123", desc: "Municipal Dispatch Lead" },
    { name: "Director Sarah Bright", email: "director.bright@gov.com", pin: "GOV999", desc: "Environmental Inspector" }
  ];

  // Quick preset login handler
  const handleQuickLogin = async (preset: { name: string; email: string; pin?: string }, isGov: boolean) => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Sync with the backend
      const res = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: preset.email, 
          name: preset.name,
          isGovernment: isGov,
          pin: preset.pin
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Unable to synchronize preset user on server");
      }

      onLoginSuccess(data.profile);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during login");
    } finally {
      setLoading(false);
    }
  };

  // Standard Login / Registration submits
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (activeTab === "citizen") {
      if (isRegistering) {
        // Registration verification trigger
        if (!name.trim()) {
          setErrorMsg("Please enter your full name.");
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          setErrorMsg("Please enter a valid email address.");
          return;
        }
        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters long.");
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
        }

        // Generate a random 4-digit code for interactive simulation
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(randomCode);
        setShowOtpScreen(true);
      } else {
        // Sign In
        if (!email.trim() || !email.includes("@")) {
          setErrorMsg("Please enter a valid email address.");
          return;
        }
        if (!password) {
          setErrorMsg("Please enter your password.");
          return;
        }

        setLoading(true);
        try {
          const res = await fetch("/api/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: email.trim(), 
              password: password, 
              isGovernment: false 
            })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || "Credentials check failed.");
          }
          onLoginSuccess(data.profile);
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to sign in. Please verify network and credentials.");
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Government Login
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter your official email address.");
        return;
      }
      if (!governmentPin) {
        setErrorMsg("Please enter your official administrator Security PIN.");
        return;
      }

      // Enforce official email checks or .gov endings
      const isOfficialEmail = email.toLowerCase().endsWith(".gov") || 
                             email.toLowerCase().includes("@civic.gov") || 
                             email.toLowerCase().includes("@gov.com");
      if (!isOfficialEmail) {
        setErrorMsg("Official login requires an authorized government email (.gov or @gov.com).");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: email.trim(), 
            isGovernment: true,
            pin: governmentPin.trim()
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          throw new Error(data.error || "Government database check failed.");
        }
        onLoginSuccess(data.profile);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to verify government credentials.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Submit OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otpCode !== generatedOtp) {
      setOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    setOtpSuccess(true);
    setLoading(true);

    // Delay slightly to show beautiful verification animation
    setTimeout(async () => {
      try {
        const res = await fetch("/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: email.trim(), 
            name: name.trim(), 
            password: password,
            isGovernment: false 
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Registration failed on server.");
        }
        onLoginSuccess(data.profile);
      } catch (err: any) {
        setOtpError(err.message || "Verification succeeded but profile registration failed. Please try again.");
        setOtpSuccess(false);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-[#050811] dark:via-[#0b1222] dark:to-[#03060c] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none text-slate-800 dark:text-white transition-colors duration-300">
      
      {/* Decorative ambient background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Floating Theme Toggle in Login View */}
      <div className="absolute top-6 right-6 z-50">
        <button
          id="auth-theme-toggle"
          onClick={onThemeToggle}
          className="p-3 bg-white hover:bg-slate-100 dark:bg-[#0F172A] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md transition-all text-slate-500 dark:text-slate-300 cursor-pointer flex items-center space-x-2"
          title="Toggle Theme"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-sans font-medium">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-sans font-medium">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Header / Brand Branding */}
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex p-3.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl shadow-xl shadow-emerald-500/20 text-white mx-auto mb-1"
          >
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "16s" }} />
          </motion.div>
          <motion.h1 
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tight"
          >
            CivicSense
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-xs mx-auto leading-relaxed"
          >
            Keep your town clean, safe, and green. Report community hazards and earn civic reputation rewards.
          </motion.p>
        </div>

        {/* Auth card wrapper */}
        <div className="relative group w-full">
          {/* Subtle colored glow behind the card in dark mode */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[32px] blur-xl opacity-0 dark:opacity-100 transition-all duration-1000 group-hover:duration-200 pointer-events-none" />
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="bg-white border border-slate-200 dark:bg-[#0F172A] dark:border-slate-800 rounded-3xl shadow-2xl dark:shadow-[0_0_50px_-12px_rgba(16,185,129,0.25),0_0_30px_-15px_rgba(59,130,246,0.25)] p-6 relative overflow-hidden w-full"
          >
          {/* Tabs header */}
          {!showOtpScreen && (
            <div className="flex bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-800/80 p-1 rounded-2xl mb-6">
              <button
                id="tab-citizen-btn"
                type="button"
                onClick={() => {
                  setActiveTab("citizen");
                  setErrorMsg("");
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-sans font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activeTab === "citizen" 
                    ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Citizen Portal</span>
              </button>
              <button
                id="tab-government-btn"
                type="button"
                onClick={() => {
                  setActiveTab("government");
                  setErrorMsg("");
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-sans font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activeTab === "government" 
                    ? "bg-emerald-500 text-white shadow shadow-emerald-500/20" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Official Triage Portal</span>
              </button>
            </div>
          )}

          {/* OTP screen verification view */}
          <AnimatePresence mode="wait">
            {showOtpScreen ? (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5 py-2"
              >
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white">Enter Verification Code</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal max-w-xs mx-auto">
                    We have dispatched a security validation code to <strong className="text-slate-900 dark:text-slate-300">{email}</strong>.
                  </p>
                </div>

                {/* Demonstration Alert showing OTP code explicitly */}
                <div className="bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800/80 p-3 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono tracking-widest block uppercase">Developer Sandbox Code</span>
                  <p className="text-lg font-mono font-bold text-emerald-500 dark:text-emerald-400 select-all tracking-widest">
                    {generatedOtp}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">4-Digit Security Code</label>
                  <input
                    id="otp-input-code"
                    type="text"
                    required
                    maxLength={4}
                    placeholder="Enter 4-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl py-3 px-4 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {otpError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                {otpSuccess ? (
                  <div className="w-full py-3 bg-emerald-500 text-white rounded-xl font-sans font-bold text-xs flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 animate-bounce" />
                    <span>Verification Successful! Accessing Portal...</span>
                  </div>
                ) : (
                  <div className="flex space-x-2 pt-2">
                    <button
                      id="otp-back-btn"
                      type="button"
                      onClick={() => setShowOtpScreen(false)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl text-xs font-sans font-semibold"
                    >
                      Back
                    </button>
                    <button
                      id="otp-submit-btn"
                      type="submit"
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-sans font-bold hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 shadow shadow-emerald-500/10"
                    >
                      <span>Verify & Open App</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.form>
            ) : (
              <motion.form 
                key={activeTab + (isRegistering ? "-reg" : "-login")}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {activeTab === "citizen" && isRegistering && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="auth-name-input"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                    {activeTab === "citizen" ? "Email Address" : "Official .gov Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder={activeTab === "citizen" ? "citizen@gmail.com" : "officer@civic.gov"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                 {activeTab === "citizen" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="auth-password-input"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:text-slate-600 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">Administrator PIN / Key</label>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="auth-pin-input"
                        type={showPin ? "text" : "password"}
                        required
                        placeholder="e.g. GOV123"
                        value={governmentPin}
                        onChange={(e) => setGovernmentPin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:text-slate-600 cursor-pointer"
                        title={showPin ? "Hide passcode" : "Show passcode"}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                      Enter an authorized government passcode to register/authenticate.
                    </p>
                  </div>
                )}                   {activeTab === "citizen" && isRegistering && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="auth-confirm-password-input"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:text-slate-600 cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-xl text-xs font-sans font-black tracking-wide transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{activeTab === "citizen" ? (isRegistering ? "Register Profile" : "Secure Sign In") : "Administrative Login"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch between Login and Register for Citizens */}
                {activeTab === "citizen" && (
                  <div className="text-center pt-1">
                    <button
                      id="auth-toggle-reg-btn"
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setErrorMsg("");
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
                    >
                      {isRegistering ? "Already have a citizen account? Sign In" : "New to CivicSense? Register & Create Account"}
                    </button>
                  </div>
                )}

                {/* Quick Demo Login Preset Section */}
                {!isRegistering && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono font-extrabold text-center mb-3">
                      ⚡ Demo Account Quick Access
                    </p>
                    <div className="space-y-2">
                      {(activeTab === "citizen" ? CITIZEN_PRESETS : GOV_PRESETS).map((preset) => (
                        <button
                          key={preset.email}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickLogin(preset, activeTab === "government")}
                          className="w-full text-left p-2.5 rounded-xl border border-dashed border-slate-200 hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-sans font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 flex items-center space-x-1.5">
                              <span>{preset.name}</span>
                              {activeTab === "citizen" ? (
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-mono font-normal">
                                  {(preset as any).points} pts
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-semibold">
                                  {(preset as any).pin}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {preset.desc}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
        
      </div>
    </div>
  );
}
