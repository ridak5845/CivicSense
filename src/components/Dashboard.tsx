import React, { useState } from "react";
import { Issue } from "../types";
import { 
  BarChart, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  TrendingUp, 
  ArrowUpRight,
  Map as MapIcon
} from "lucide-react";
import MapView from "./MapView";

interface DashboardProps {
  issues: Issue[];
  onViewChange: (view: string) => void;
  currentUserEmail?: string;
  onUpvoteIssue?: (issueId: string) => Promise<void>;
  setSelectedIssueIdInTracker?: (id: string | null) => void;
}

export default function Dashboard({ 
  issues, 
  onViewChange,
  currentUserEmail = "",
  onUpvoteIssue = async () => {},
  setSelectedIssueIdInTracker
}: DashboardProps) {
  const [dashboardTab, setDashboardTab] = useState<"analytics" | "map">("analytics");

  // Compute analytics from issues list
  const totalCount = issues.length;
  const resolvedCount = issues.filter(i => i.status === "Resolved").length;
  const inProgressCount = issues.filter(i => i.status === "In Progress").length;
  const verifyingCount = issues.filter(i => i.status === "Verifying").length;
  const pendingCount = issues.filter(i => i.status === "Pending").length;
  
  const avgCredibility = totalCount > 0 
    ? Math.round(issues.reduce((acc, curr) => acc + (curr.credibilityScore || 0), 0) / totalCount)
    : 0;

  // Category counts
  const categories = [
    { name: "Pothole & Roads", color: "bg-amber-500", border: "border-amber-500", text: "text-amber-500" },
    { name: "Water & Leakage", color: "bg-blue-500", border: "border-blue-500", text: "text-blue-500" },
    { name: "Streetlight & Power", color: "bg-yellow-400", border: "border-yellow-400", text: "text-yellow-400" },
    { name: "Waste & Sanitation", color: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-500" },
    { name: "Public Parks & Infrastructure", color: "bg-purple-500", border: "border-purple-500", text: "text-purple-500" },
    { name: "Other", color: "bg-slate-500", border: "border-slate-500", text: "text-slate-500" }
  ];

  const categoryCounts = categories.map(cat => {
    const count = issues.filter(i => i.category === cat.name).length;
    return {
      ...cat,
      count,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    };
  }).sort((a, b) => b.count - a.count);

  // Severe active issues list
  const activeSevereIssues = issues
    .filter(i => i.status !== "Resolved" && (i.aiAnalysis?.severity === "Critical" || i.aiAnalysis?.severity === "High"))
    .slice(0, 3);

  // Simulated Weekly Trend
  const weeklyTrendData = [
    { day: "Mon", count: 3 },
    { day: "Tue", count: 5 },
    { day: "Wed", count: issues.filter(i => new Date(i.createdAt).getDay() === 3).length + 4 },
    { day: "Thu", count: issues.filter(i => new Date(i.createdAt).getDay() === 4).length + 6 },
    { day: "Fri", count: issues.filter(i => new Date(i.createdAt).getDay() === 5).length + 2 },
    { day: "Sat", count: 2 },
    { day: "Sun", count: 1 }
  ];
  const maxTrendVal = Math.max(...weeklyTrendData.map(d => d.count), 5);

  // Hotspots by address concentration
  const hotspots = [
    { ward: "Ward 3 - Central Plaza", activeIssues: issues.filter(i => i.status !== "Resolved" && i.address.toLowerCase().includes("plaza") || i.address.toLowerCase().includes("library")).length + 2, status: "Critical Attention" },
    { ward: "Ward 5 - Castro Corridor", activeIssues: issues.filter(i => i.status !== "Resolved" && i.address.toLowerCase().includes("castro")).length + 1, status: "Moderate Wear" },
    { ward: "Ward 1 - Forest Hills", activeIssues: issues.filter(i => i.status !== "Resolved" && i.address.toLowerCase().includes("forest") || i.address.toLowerCase().includes("park")).length, status: "Stable" }
  ].sort((a, b) => b.activeIssues - a.activeIssues);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Upper header action banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 rounded-2xl border border-slate-800 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/20">
            Hackathon Highlight - CivicSense
          </span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold tracking-tight mt-2">Empowering Local Citizens</h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Identify infrastructure failures, submit real-time photographic reports with AI analysis, and coordinate with municipal officers to repair our city.
          </p>
        </div>
        <button
          id="report-issue-banner-btn"
          onClick={() => onViewChange("report")}
          className="bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] active:scale-98 transition-all text-white font-sans font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Report New Hazard (+100 pts)</span>
        </button>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          id="dashboard-tab-analytics"
          onClick={() => setDashboardTab("analytics")}
          className={`pb-3 px-4 font-sans font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            dashboardTab === "analytics"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart className="w-4 h-4" />
          <span>Analytics Hub</span>
        </button>
        <button
          id="dashboard-tab-map"
          onClick={() => setDashboardTab("map")}
          className={`pb-3 px-4 font-sans font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            dashboardTab === "map"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapIcon className="w-4 h-4 text-emerald-500" />
          <span>Interactive Dispatch Map</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">
            LIVE
          </span>
        </button>
      </div>

      {dashboardTab === "map" ? (
        <MapView 
          issues={issues}
          currentUserEmail={currentUserEmail}
          onUpvoteIssue={onUpvoteIssue}
          onViewChange={onViewChange}
          setSelectedIssueIdInTracker={setSelectedIssueIdInTracker}
        />
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div id="stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Resolved Problems</span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-none mt-1 font-mono">{resolvedCount}</h3>
            <span className="text-[10px] text-emerald-600 font-mono font-medium block mt-1">100% waste diverted</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">In Progress / Verifying</span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-none mt-1 font-mono">{inProgressCount + verifyingCount}</h3>
            <span className="text-[10px] text-blue-600 font-mono font-medium block mt-1">Crew dispatched today</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Untreated/Pending</span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-none mt-1 font-mono">{pendingCount}</h3>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Awaiting upvotes</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Avg AI Credibility</span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-none mt-1 font-mono">{avgCredibility}%</h3>
            <span className="text-[10px] text-amber-600 font-mono font-medium block mt-1">98% detection success</span>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div id="dashboard-charts-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Issue Categories Custom Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-lg">Infrastructure Failure Volume</h3>
              <p className="text-xs text-slate-500">Distribution of active and resolved community complaints</p>
            </div>
            <BarChart className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4">
            {categoryCounts.map((cat, idx) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-sans">
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                  <span className="font-mono text-slate-500">{cat.count} issues ({cat.percentage}%)</span>
                </div>
                {/* Custom animated progress bar */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`${cat.color} h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(cat.count > 0 ? 5 : 0, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Color badges legend */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
            {categories.map((c) => (
              <span key={c.name} className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-600 font-medium">
                <span className={`w-2 h-2 ${c.color} rounded-full`}></span>
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Col: Weekly trend + Activity stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-base">Weekly Activity Volume</h3>
                <p className="text-xs text-slate-500">Inbound community reports</p>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            {/* Custom SVG Trend Line Chart */}
            <div className="h-44 w-full pt-4 flex items-end justify-between relative px-2">
              {/* Backgrid guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-4 border-b border-slate-100/80 pointer-events-none">
                <div className="w-full border-b border-slate-100/50"></div>
                <div className="w-full border-b border-slate-100/50"></div>
                <div className="w-full border-b border-slate-100/50"></div>
              </div>

              {weeklyTrendData.map((d, index) => {
                const heightPercent = (d.count / maxTrendVal) * 80; // keep max at 80% for aesthetic spacing
                return (
                  <div key={d.day} className="flex flex-col items-center flex-1 h-full justify-end z-10 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-6 bg-slate-900 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {d.count} posts
                    </div>
                    {/* Colored bar segment */}
                    <div 
                      className="w-4 bg-emerald-500/85 hover:bg-emerald-500 rounded-t-sm transition-all cursor-pointer group-hover:shadow-md"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-2">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Busiest Day this week</span>
            <span className="font-bold text-slate-900">Thursday (6 reports)</span>
          </div>
        </div>

      </div>

      {/* Critical Attention and Hotspots Panels */}
      <div id="hotspots-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hotspots List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-slate-900 text-lg flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <span>Hyperlocal Area Hotspots</span>
          </h3>
          <p className="text-xs text-slate-500">Wards with highest infrastructural wear & tear active logs</p>

          <div className="divide-y divide-slate-100">
            {hotspots.map((spot, idx) => (
              <div key={spot.ward} className="py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800">{spot.ward}</h4>
                  <span className="text-xs text-slate-500">{spot.activeIssues} active unresolved alerts</span>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  idx === 0 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : idx === 1 
                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {spot.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Severe Issues Triage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-lg flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Critical Alerts Triage</span>
            </h3>
            <p className="text-xs text-slate-500">Unresolved hazards categorized as Critical or High priority</p>

            <div className="mt-4 space-y-3">
              {activeSevereIssues.length > 0 ? (
                activeSevereIssues.map((issue) => (
                  <div 
                    key={issue.id} 
                    onClick={() => onViewChange("tracker")}
                    className="p-3 bg-red-50/40 hover:bg-red-50 hover:border-red-300 transition-all border border-red-100 rounded-xl flex justify-between items-start cursor-pointer group"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono uppercase bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
                          {issue.aiAnalysis?.severity || "High"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{issue.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-red-900 leading-snug line-clamp-1">{issue.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{issue.address}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No urgent high-severity issues reported! Excellent job neighborhood.
                </div>
              )}
            </div>
          </div>

          <button
            id="explore-all-critical-btn"
            onClick={() => onViewChange("tracker")}
            className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 pt-3 border-t border-slate-100"
          >
            Explore all issues on Interactive Tracker →
          </button>
        </div>

      </div>

      {/* Quick Map Tab Switcher Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950 rounded-xl text-emerald-400 border border-emerald-500/10 shrink-0">
            <MapIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-sans">Geospatial Smart Dispatch Grid Active</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              All active hazards are dynamically plotted by GPS coordinates. Filter by priority or view live resolution timelines.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDashboardTab("map")}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-sans font-bold text-xs px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer flex items-center space-x-1"
        >
          <span>Explore Dispatch Map</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Success spotlight / Resolved showcase */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-mono uppercase font-bold rounded">
            <span>Resolutions Spotlight</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Successfully Cleared: E-Waste at Forest Park Trail</h4>
          <p className="text-xs text-slate-700">
            A hazardous electronics dumpsite reported by David Eco was cleared by city sanitation in 3 days. Over 200 lbs of toxic chemicals safely recycled!
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-600">Neighborhood votes:</span>
          <span className="font-mono font-bold text-emerald-600 text-xs">24 Upvotes</span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
