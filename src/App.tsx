import React from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Tracker from "./components/Tracker";
import ReportForm from "./components/ReportForm";
import Chatbot from "./components/Chatbot";
import Insights from "./components/Insights";
import Leaderboard from "./components/Leaderboard";
import GovernmentPortal from "./components/GovernmentPortal";
import Auth from "./components/Auth";
import NotificationBell from "./components/NotificationBell";
import { motion, AnimatePresence } from "motion/react";

import { Issue, UserProfile, SystemInsight, ChatMessage } from "./types";
import { 
  User, 
  Sparkles, 
  Award, 
  MapPin, 
  Building2, 
  MessageSquare, 
  ChevronDown, 
  Compass 
} from "lucide-react";

const BADGES_MAP: Record<string, { name: string; description: string; emoji: string; color: string }> = {
  "civic-explorer": { name: "First Responder", description: "Reported your first community issue with geographical tagging & photo upload", emoji: "📣", color: "from-blue-500 to-indigo-600" },
  "local-guardian": { name: "Vigilant Inspector", description: "Upvoted and validated at least 3 neighborhood issues to help filter spam", emoji: "🗳️", color: "from-emerald-500 to-teal-600" },
  "truth-seeker": { name: "Truth Detective", description: "Reported an issue that was validated by Gemini AI with >90% credibility", emoji: "🔍", color: "from-amber-500 to-orange-600" },
  "community-hero": { name: "Gold Guardian", description: "Earned more than 400 total civic reputation points (XP) on CivicSense", emoji: "🏆", color: "from-purple-500 to-pink-600" },
  "civic-champion": { name: "Problem Solver", description: "Had at least one reported community issue successfully Resolved by the municipal office", emoji: "🛠️", color: "from-rose-500 to-red-600" },
  "eco-pioneer": { name: "Eco Pioneer", description: "Reported your first green/sanitation issue under Water & Leakage or Trash & Dumping", emoji: "🌱", color: "from-teal-500 to-emerald-600" },
  "smart-citizen": { name: "Smart Citizen", description: "Consulted the CivicSense AI Bot for hyperlocal reports or public bylaws", emoji: "💬", color: "from-sky-500 to-blue-600" },
  "town-watchdog": { name: "Town Watchdog", description: "Filed 3 or more total neighborhood reports to keep city officials actively on alert", emoji: "🐕", color: "from-orange-500 to-amber-600" }
};

export default function App() {
  // Theme state
  const [theme, setTheme] = React.useState<"light" | "dark" | any>(() => {
    const saved = localStorage.getItem("civicsense-theme");
    return (saved as "light" | "dark") || "light";
  });

  const toggleTheme = () => {
    setTheme((prev: string) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("civicsense-theme", next);
      return next;
    });
  };

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  // Navigation & session state
  const [currentView, setCurrentView] = React.useState(() => {
    const hash = window.location.hash.replace("#", "");
    const allowedViews = ["dashboard", "tracker", "report", "chatbot", "insights", "leaderboard", "government"];
    return allowedViews.includes(hash) ? hash : "dashboard";
  });
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  const handleViewChange = React.useCallback((newView: string) => {
    setCurrentView(newView);
    if (window.location.hash !== `#${newView}`) {
      window.history.pushState({ view: newView }, "", `#${newView}`);
    }
  }, []);

  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const stateView = event.state?.view;
      if (stateView) {
        setCurrentView(stateView);
      } else {
        const hash = window.location.hash.replace("#", "");
        const allowedViews = ["dashboard", "tracker", "report", "chatbot", "insights", "leaderboard", "government"];
        setCurrentView(allowedViews.includes(hash) ? hash : "dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
  
  // Custom login state
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [customEmail, setCustomEmail] = React.useState("");
  const [isCreatingCustom, setIsCreatingCustom] = React.useState(false);

  // Database lists
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = React.useState<string | null>(null);
  const [appError, setAppError] = React.useState("");
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Achievement badge celebration states
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = React.useState<{ id: string; name: string; description: string; emoji: string; color: string } | null>(null);
  const prevBadgesRef = React.useRef<string[]>([]);
  const hasInitializedBadgesRef = React.useRef(false);

  React.useEffect(() => {
    // Reset badges tracking whenever switching users
    hasInitializedBadgesRef.current = false;
  }, [currentUser?.email]);

  React.useEffect(() => {
    if (currentUser && currentUser.badges) {
      if (!hasInitializedBadgesRef.current) {
        prevBadgesRef.current = currentUser.badges;
        hasInitializedBadgesRef.current = true;
      } else {
        const prev = prevBadgesRef.current;
        const newlyUnlocked = currentUser.badges.filter(id => !prev.includes(id));
        if (newlyUnlocked.length > 0) {
          const badgeId = newlyUnlocked[0];
          const badgeDetails = BADGES_MAP[badgeId];
          if (badgeDetails) {
            setNewlyUnlockedBadge({ id: badgeId, ...badgeDetails });
          }
        }
        prevBadgesRef.current = currentUser.badges;
      }
    }
  }, [currentUser]);

  // Standard preset roles for hackathon evaluation
  const PRESET_ROLES = [
    { name: "Clara Civic (Activist)", email: "clara.civic@gmail.com" },
    { name: "David Eco (Clean Ranger)", email: "david.eco@gmail.com" },
    { name: "Marcus Green (Local resident)", email: "marcus.green@gmail.com" }
  ];

  // API Call: Fetch issues
  const loadIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("Failed to load issues");
      const data = await res.json();
      setIssues(data);
    } catch (err: any) {
      console.error(err);
      setAppError("Failed to fetch database entries. App running in robust client cache.");
    }
  };

  // API Call: Synchronize citizen profile with DB
  const syncProfile = async (email: string, name?: string, isGovernment?: boolean) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, isGovernment })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.profile);
      }
    } catch (err) {
      console.error("Profile sync error", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // On Mount: Load issues
  React.useEffect(() => {
    loadIssues();
  }, []);

  // API Call: File reported issue
  const handleReportIssue = async (issueData: any) => {
    if (!currentUser) throw new Error("Authentication required.");
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueData)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to save issue on server.");
    }

    const data = await res.json();
    
    // Refresh issues list
    await loadIssues();
    
    // Sync active reporter profile points & badges
    await syncProfile(currentUser.email);

    return data;
  };

  // API Call: Upvote & Verify
  const handleUpvoteIssue = async (issueId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Upvote error.");
        return;
      }

      const data = await res.json();
      
      // Update issues list locally
      setIssues(prev => prev.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            upvotes: data.issue.upvotes,
            upvoters: data.issue.upvoters,
            credibilityScore: data.issue.credibilityScore,
            status: data.issue.status,
            updates: data.issue.updates
          };
        }
        return issue;
      }));

      // Update current user wallet state
      await syncProfile(currentUser.email);

    } catch (err) {
      console.error("Upvote API failed", err);
    }
  };

  // API Call: Government update
  const handleUpdateStatus = async (issueId: string, status: string, note: string, officer: string) => {
    if (!currentUser) return;
    const res = await fetch(`/api/issues/${issueId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status, 
        note, 
        officerName: officer,
        requesterEmail: currentUser.email
      })
    });

    if (!res.ok) {
      throw new Error("Failed to post status update.");
    }

    // Refresh database
    await loadIssues();
    
    // Sync current session just in case it is the original reporter
    await syncProfile(currentUser.email);
  };

  // API Call: Send Chat message to localized Gemini
  const handleSendChatMessage = async (message: string, history?: ChatMessage[]) => {
    if (!currentUser) throw new Error("Authentication required.");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, email: currentUser.email })
    });

    if (!res.ok) {
      throw new Error("Chat api request failed.");
    }

    const data = await res.json();
    // Sync profile to get the new badge and points instantly
    await syncProfile(currentUser.email);
    return data;
  };

  // API Call: Fetch insights
  const handleFetchInsights = async (): Promise<SystemInsight[]> => {
    const res = await fetch("/api/insights");
    if (!res.ok) throw new Error("Failed to fetch predictive insights");
    return await res.json();
  };

  // API Call: Fetch Leaderboard
  const handleFetchLeaderboard = async () => {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return await res.json();
  };

  // Switch role handler
  const handleSwitchRole = (email: string) => {
    const foundPreset = PRESET_ROLES.find(r => r.email === email);
    const name = foundPreset ? foundPreset.name.split(" ")[0] : email.split("@")[0];
    
    syncProfile(email, name);
    setShowUserDropdown(false);
  };

  // Create custom user login
  const handleCreateCustomProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customEmail) return;

    syncProfile(customEmail, customName);
    setIsCreatingCustom(false);
    setShowUserDropdown(false);
    setCustomName("");
    setCustomEmail("");
  };

  // Successfully reported issue redirect
  const handleReportSuccess = (issueId: string) => {
    setSelectedIssueId(issueId);
    handleViewChange("tracker");
  };

  // Render active view screen content
  const renderViewContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard 
            issues={issues} 
            onViewChange={handleViewChange} 
            currentUserEmail={currentUser.email}
            onUpvoteIssue={handleUpvoteIssue}
            setSelectedIssueIdInTracker={setSelectedIssueId}
          />
        );
      case "tracker":
        return (
          <Tracker 
            issues={issues} 
            currentUserEmail={currentUser.email}
            onUpvoteIssue={handleUpvoteIssue}
            selectedIssueId={selectedIssueId}
            setSelectedIssueId={setSelectedIssueId}
          />
        );
      case "report":
        return (
          <ReportForm 
            currentUserEmail={currentUser.email}
            currentUserName={currentUser.name}
            onSubmitIssue={handleReportIssue}
            onSuccess={handleReportSuccess}
          />
        );
      case "chatbot":
        return <Chatbot onSendMessage={handleSendChatMessage} theme={theme} />;
      case "insights":
        return <Insights onFetchInsights={handleFetchInsights} />;
      case "leaderboard":
        return (
          <Leaderboard 
            currentUserEmail={currentUser.email}
            onFetchLeaderboard={handleFetchLeaderboard}
          />
        );
      case "government":
        if (!currentUser.isGovernment) {
          return (
            <div className="p-8 max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3 shadow-sm">
              <span className="text-3xl">🚫</span>
              <h3 className="text-lg font-bold text-red-900">Access Denied</h3>
              <p className="text-xs text-red-700 leading-relaxed">
                You do not have administrative authorization to access the Government Triage Portal.
              </p>
              <button 
                onClick={() => handleViewChange("dashboard")} 
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          );
        }
        return <GovernmentPortal issues={issues} onUpdateStatus={handleUpdateStatus} />;
      default:
        return (
          <Dashboard 
            issues={issues} 
            onViewChange={handleViewChange} 
            currentUserEmail={currentUser.email}
            onUpvoteIssue={handleUpvoteIssue}
            setSelectedIssueIdInTracker={setSelectedIssueId}
          />
        );
    }
  };

  // If user is not verified/logged in, force Auth portal
  if (!currentUser) {
    return (
      <Auth 
        onLoginSuccess={(profile) => {
          setCurrentUser(profile);
          const initialView = profile.isGovernment ? "government" : "dashboard";
          setCurrentView(initialView);
          window.history.replaceState({ view: initialView }, "", `#${initialView}`);
        }} 
        syncProfile={syncProfile} 
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    );
  }

  return (
    <div id="civicsense-app-shell" className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0B0F19] dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar (Responsive Left Navigation) */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        userPoints={currentUser.points} 
        isGovernment={currentUser.isGovernment}
        theme={theme}
        onThemeToggle={toggleTheme}
        issues={issues}
        currentUser={currentUser}
        onSelectIssue={setSelectedIssueId}
      />

      {/* Main Content Area (Responsive Right) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header id="desktop-header" className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-[#0F172A] border-b border-slate-150/80 dark:border-slate-800/80 sticky top-0 z-20 transition-colors">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentView === "dashboard" && "Impact Dashboard"}
              {currentView === "tracker" && "Interactive Issue Tracker"}
              {currentView === "report" && "Report Community Hazard"}
              {currentView === "chatbot" && "CivicSense AI Assistant"}
              {currentView === "insights" && "Proactive AI Insights"}
              {currentView === "leaderboard" && "Leaderboard & Achievements"}
              {currentView === "government" && "Government Triage Desk"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dynamic Notification Bell with live counter and updates dropdown */}
            <NotificationBell 
              issues={issues}
              currentUser={currentUser}
              onSelectIssue={setSelectedIssueId}
              onViewChange={handleViewChange}
              theme={theme}
            />

            {/* Citizen role switcher workspace */}
            <div className="relative">
            <button
              id="role-switch-trigger"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 bg-slate-50 border border-slate-200 hover:border-slate-300 py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                {currentUser.isGovernment ? "💼" : currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <span className="block leading-none text-slate-900 font-extrabold">{currentUser.name}</span>
                <span className="text-[9px] text-slate-400 leading-none block font-mono mt-0.5">
                  {currentUser.isGovernment ? "Official Worker" : `${currentUser.points} pts`}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown panel */}
            {showUserDropdown && (
              <div id="role-switch-dropdown" className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-30 p-4 animate-in fade-in slide-in-from-top-3 duration-150">
                {currentUser.isGovernment ? (
                  <div className="space-y-3">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                        <span className="text-emerald-500">🛡️</span>
                        <span>Government Session</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Logged in as authorized municipal worker</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-mono">
                      <span className="block font-bold text-slate-700">Email: {currentUser.email}</span>
                      <span className="block mt-0.5">Access Scope: Full Triage, Status Resolution, and Audit Logs</span>
                    </div>
                    <button
                      id="gov-sign-out-btn"
                      onClick={() => setCurrentUser(null)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold py-2 rounded-xl border border-red-200/50 transition-all cursor-pointer text-center"
                    >
                      Sign Out Portal
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-slate-100 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-900">Switch Citizen Role</h4>
                      <p className="text-[10px] text-slate-400">Evaluate leaderboard upvoting and badging rewards</p>
                    </div>

                    {isCreatingCustom ? (
                      <form onSubmit={handleCreateCustomProfile} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Your Name</label>
                          <input
                            id="custom-name-input"
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Your Email</label>
                          <input
                            id="custom-email-input"
                            type="email"
                            required
                            placeholder="e.g. john@me.com"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="flex space-x-2 pt-1">
                          <button
                            id="custom-submit-btn"
                            type="submit"
                            className="flex-1 bg-emerald-500 text-white font-bold text-[10px] py-1.5 rounded-lg"
                          >
                            Login Custom Profile
                          </button>
                          <button
                            id="custom-cancel-btn"
                            type="button"
                            onClick={() => setIsCreatingCustom(false)}
                            className="px-2.5 bg-slate-100 text-slate-500 text-[10px] rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-1.5">
                        {PRESET_ROLES.map((role) => (
                          <button
                            key={role.email}
                            id={`role-btn-${role.email.split("@")[0]}`}
                            onClick={() => handleSwitchRole(role.email)}
                            className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                              currentUser.email === role.email
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                                : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>{role.name}</span>
                            {currentUser.email === role.email && <span className="text-[9px] font-mono">Active</span>}
                          </button>
                        ))}

                        <button
                          id="custom-role-btn"
                          onClick={() => setIsCreatingCustom(true)}
                          className="w-full text-center py-2 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-500 hover:text-slate-900 font-semibold mt-2 hover:bg-slate-50 transition-colors"
                        >
                          + Create Custom Citizen Profile
                        </button>

                        <div className="border-t border-slate-100 pt-2.5 mt-2">
                          <button
                            id="citizen-sign-out-btn"
                            onClick={() => setCurrentUser(null)}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-extrabold py-2 rounded-xl border border-red-150 transition-all cursor-pointer text-center"
                          >
                            Sign Out Portal
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          </div>
        </header>

        {/* Global Error Notice if database is down */}
        {appError && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-xl flex items-center space-x-2 shrink-0">
            <Compass className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
            <span>{appError}</span>
          </div>
        )}

        {/* Dynamic viewport viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderViewContent()}
        </main>
      </div>

      {/* Badge Unlock Celebration Modal */}
      <AnimatePresence>
        {newlyUnlockedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.3, y: 100, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                transition: { 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20 
                } 
              }}
              exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.15 } }}
              className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              {/* Confetti-like ambient gradient behind */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl" />

              {/* Floating elements & Emojis bouncing */}
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2.5, 
                  ease: "easeInOut" 
                }}
                className={`mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br ${newlyUnlockedBadge.color} shadow-xl flex items-center justify-center text-4xl border border-white/20`}
              >
                {newlyUnlockedBadge.emoji}
              </motion.div>

              <div className="mt-6 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-extrabold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block animate-pulse">
                  Achievement Unlocked!
                </span>
                <h3 className="text-xl font-sans font-black text-slate-900">
                  {newlyUnlockedBadge.name}
                </h3>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  {newlyUnlockedBadge.description}
                </p>
              </div>

              {/* Reward feedback points indicator */}
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="mt-6 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-center space-x-2"
              >
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-mono font-extrabold text-slate-800">
                  Reputation Bonus Claimed!
                </span>
              </motion.div>

              {/* Close button with hover scales */}
              <div className="mt-6">
                <button
                  id="close-achievement-btn"
                  onClick={() => setNewlyUnlockedBadge(null)}
                  className="w-full py-3 bg-slate-900 text-white font-sans font-bold text-sm rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-md"
                >
                  Awesome, let's go!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
