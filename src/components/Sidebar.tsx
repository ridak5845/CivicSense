import React from "react";
import { 
  LayoutDashboard, 
  MapPin, 
  PlusCircle, 
  MessageSquare, 
  BrainCircuit, 
  Trophy, 
  Building2, 
  Menu, 
  X,
  Compass,
  Sun,
  Moon
} from "lucide-react";
import { Issue, UserProfile } from "../types";
import NotificationBell from "./NotificationBell";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userPoints: number;
  isGovernment?: boolean;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  issues: Issue[];
  currentUser: UserProfile;
  onSelectIssue: (issueId: string) => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  userPoints, 
  isGovernment,
  theme,
  onThemeToggle,
  issues,
  currentUser,
  onSelectIssue
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: "dashboard", label: "Impact Dashboard", icon: LayoutDashboard },
    { id: "tracker", label: "Interactive Tracker", icon: MapPin },
    { id: "report", label: "Report Issue", icon: PlusCircle, highlight: true },
    { id: "chatbot", label: "Civic AI Chatbot", icon: MessageSquare },
    { id: "insights", label: "Predictive Insights", icon: BrainCircuit },
    { id: "leaderboard", label: "Leaderboard & Badges", icon: Trophy },
    { id: "government", label: "Government Portal", icon: Building2 },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.id === "government") {
      return !!isGovernment;
    }
    return true;
  });

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header id="mobile-header" className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 shadow-sm z-40 sticky top-0">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight text-slate-800 dark:text-white">CivicSense</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Quick theme toggle icon button */}
          <button
            id="mobile-header-theme-toggle"
            onClick={onThemeToggle}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Interactive Notification Bell */}
          <NotificationBell 
            issues={issues}
            currentUser={currentUser}
            onSelectIssue={onSelectIssue}
            onViewChange={onViewChange}
            theme={theme}
          />

          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded text-xs text-emerald-600 dark:text-emerald-400 font-mono">
            {userPoints} pts
          </div>
          <button 
            id="mobile-menu-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          id="mobile-drawer-overlay"
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/65 z-40 transition-opacity"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside 
        id="mobile-navigation-drawer"
        className={`md:hidden fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#090D1A]">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-sans font-bold text-lg tracking-tight text-slate-800 dark:text-white">CivicSense</span>
            </div>
            <button 
              id="mobile-close-btn"
              onClick={() => setIsOpen(false)} 
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav id="mobile-nav-items" className="p-3 space-y-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  id={`mobile-nav-${item.id}`}
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-white font-semibold"
                      : item.highlight
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-white" : item.highlight ? "text-white dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D1A] flex flex-col space-y-3">
          {/* Mobile Theme Toggle */}
          <button
            id="mobile-drawer-theme-toggle"
            onClick={onThemeToggle}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <span className="font-sans font-medium">Appearance</span>
            <div className="flex items-center space-x-1.5 bg-slate-200 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-300 dark:border-slate-800/40">
              <span className={`p-1 rounded transition-all ${theme === "light" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400"}`}>
                <Sun className="w-3.5 h-3.5" />
              </span>
              <span className={`p-1 rounded transition-all ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400"}`}>
                <Moon className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          <div className="w-full flex justify-between items-center px-2 py-1.5 rounded bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Your Rank score</span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{userPoints} pts</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono block">CivicSense v1.0.0</span>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        id="desktop-sidebar"
        className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white h-screen sticky top-0 shrink-0 select-none z-10"
      >
        <div>
          {/* Brand Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 bg-slate-50 dark:bg-[#090D1A]">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Compass className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl tracking-tight text-slate-800 dark:text-white leading-tight">CivicSense</h1>
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-500">Hyperlocal Hub</span>
            </div>
          </div>

          {/* User Score Summary Card */}
          <div className="m-4 p-4 bg-slate-50 dark:bg-[#090D1A] rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">Guardian Tier</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">LV. {Math.floor(userPoints / 200) + 1}</span>
            </div>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-800 dark:text-white font-sans">{userPoints}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">XP</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (userPoints % 200) / 2)}%` }}></div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav id="desktop-nav-items" className="px-3 py-2 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  id={`desktop-nav-${item.id}`}
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-white font-semibold shadow-xs"
                      : item.highlight
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20 m-1"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-emerald-600 dark:text-white" : item.highlight ? "text-white dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D1A] flex flex-col space-y-3">
          {/* Desktop Theme Toggle */}
          <button
            id="desktop-theme-toggle"
            onClick={onThemeToggle}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E293B] transition-all cursor-pointer shadow-xs"
            title="Toggle Theme"
          >
            <span className="font-sans font-medium">Appearance</span>
            <div className="flex items-center space-x-1.5 bg-slate-200 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-300 dark:border-slate-800/40">
              <span className={`p-1 rounded transition-all ${theme === "light" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400"}`}>
                <Sun className="w-3.5 h-3.5" />
              </span>
              <span className={`p-1 rounded transition-all ${theme === "dark" ? "bg-[#0F172A] text-emerald-400" : "text-slate-400"}`}>
                <Moon className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono px-1">
            <span>Server Status</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              <span className="text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Online</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 pt-1 font-mono border-t border-slate-200 dark:border-slate-900/50">
            © 2026 CivicSense Corp
          </p>
        </div>
      </aside>
    </>
  );
}
