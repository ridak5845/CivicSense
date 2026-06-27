import React from "react";
import { Issue } from "../types";
import { 
  Search, 
  Filter, 
  MapPin, 
  ThumbsUp, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Calendar, 
  Eye, 
  ShieldCheck, 
  User, 
  Compass, 
  AlertTriangle 
} from "lucide-react";

interface TrackerProps {
  issues: Issue[];
  currentUserEmail: string;
  onUpvoteIssue: (issueId: string) => Promise<void>;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
}

export default function Tracker({ 
  issues, 
  currentUserEmail, 
  onUpvoteIssue,
  selectedIssueId,
  setSelectedIssueId 
}: TrackerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [isUpvoting, setIsUpvoting] = React.useState(false);

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || issue.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Standard category list for filters
  const categories = ["All", "Pothole & Roads", "Water & Leakage", "Streetlight & Power", "Waste & Sanitation", "Public Parks & Infrastructure", "Other"];
  const statuses = ["All", "Pending", "Verifying", "In Progress", "Resolved"];

  const handleUpvote = async (issueId: string) => {
    if (isUpvoting) return;
    setIsUpvoting(true);
    try {
      await onUpvoteIssue(issueId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpvoting(false);
    }
  };

  // Map limits: 37.7500 to 37.7900 (Lat), -122.4500 to -122.4100 (Lng)
  // Let's translate Lat/Lng into percentage for our SVG map pins!
  const getCoordinatesPercent = (lat: number, lng: number) => {
    const latMin = 37.7500;
    const latMax = 37.7900;
    const lngMin = -122.4500;
    const lngMax = -122.4100;

    // Flip Lat because SVG Y starts at top (0)
    const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;

    // Constrain within bounds
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-slate-500 bg-slate-100 border-slate-200";
      case "Verifying": return "text-amber-600 bg-amber-50 border-amber-200";
      case "In Progress": return "text-blue-600 bg-blue-50 border-blue-200";
      case "Resolved": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      default: return "text-slate-500 bg-slate-100 border-slate-200";
    }
  };

  const getSeverityBadgeColor = (severity?: string) => {
    switch (severity) {
      case "Critical": return "bg-red-600 text-white";
      case "High": return "bg-amber-600 text-white";
      case "Medium": return "bg-blue-600 text-white";
      case "Low": return "bg-slate-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  return (
    <div id="tracker-layout" className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">Interactive Local Tracker</h2>
          <p className="text-sm text-slate-500">Monitor active municipal repairs, upvote credible submissions, or verify coordinates on the smart grid.</p>
        </div>
      </div>

      {/* Grid Layout: Map Top/Left, Issues Bottom/Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Map & List Section (Takes 2 columns) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Schematic Vector Map Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between h-[320px] md:h-[400px]">
            {/* Map Header details */}
            <div className="flex items-center justify-between z-10 text-white">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
                <span className="text-xs font-mono font-semibold text-slate-200">District Smart Grid (Ward 1, 3, 5)</span>
              </div>
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400 font-mono">
                {filteredIssues.length} pin markers shown
              </span>
            </div>

            {/* Simulated Vector SVG Map */}
            <div className="absolute inset-0 w-full h-full opacity-35 pointer-events-none select-none py-10 px-4">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Horizontal Streets */}
                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
                <text x="10" y="18%" fill="#64748b" className="text-[9px] font-mono">Wildwood Trail Rd</text>
                
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#475569" strokeWidth="4" />
                <text x="10" y="47%" fill="#94a3b8" className="text-[10px] font-mono font-bold">Main Street Diagonal</text>

                <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#475569" strokeWidth="2" />
                <text x="10" y="77%" fill="#64748b" className="text-[9px] font-mono">Library Plaza Blvd</text>

                {/* Vertical Streets */}
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#475569" strokeWidth="2" />
                <text x="27%" y="20" fill="#64748b" className="text-[9px] font-mono" transform="rotate(90, 27, 20)">Castro Street</text>

                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />
                <text x="77%" y="20" fill="#64748b" className="text-[9px] font-mono" transform="rotate(90, 77, 20)">Grand Avenue</text>
                
                {/* Civic Landmarks */}
                <rect x="5%" y="65%" width="70" height="40" fill="#1e293b" rx="4" stroke="#475569" />
                <text x="7%" y="78%" fill="#94a3b8" className="text-[8px] font-mono">Public Library</text>

                <rect x="45%" y="10%" width="80" height="30" fill="#1e293b" rx="4" stroke="#475569" />
                <text x="47%" y="25%" fill="#94a3b8" className="text-[8px] font-mono">Community Center</text>

                <rect x="80%" y="40%" width="60" height="35" fill="#1e293b" rx="4" stroke="#475569" />
                <text x="82%" y="55%" fill="#94a3b8" className="text-[8px] font-mono">Forest Park</text>
              </svg>
            </div>

            {/* Interactive Pins layer */}
            <div className="absolute inset-0 w-full h-full p-4">
              {filteredIssues.map((issue) => {
                const { x, y } = getCoordinatesPercent(issue.latitude, issue.longitude);
                const isSelected = issue.id === selectedIssueId;
                const pinColor = 
                  issue.status === "Resolved" ? "bg-emerald-500 border-white ring-emerald-500/30" :
                  issue.status === "In Progress" ? "bg-blue-500 border-white ring-blue-500/30" :
                  issue.status === "Verifying" ? "bg-amber-500 border-white ring-amber-500/30" :
                  "bg-slate-400 border-white ring-slate-400/30";

                return (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="absolute group transition-transform hover:scale-125 focus:outline-none z-20 cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    {/* Ripple ring for active selection */}
                    <span className={`absolute -inset-1.5 rounded-full ring-4 animate-ping ${isSelected ? "opacity-100 inline-block" : "opacity-0 hidden"}`}></span>
                    <div className={`w-4 h-4 rounded-full border-2 shadow-lg flex items-center justify-center transition-all ${pinColor} ${
                      isSelected ? "ring-4 scale-115" : "hover:ring-2"
                    }`} />
                    
                    {/* Hover text preview card */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity w-44 pointer-events-none text-left leading-normal z-30">
                      <p className="text-[9px] font-mono uppercase tracking-wide text-emerald-400 font-bold">{issue.category}</p>
                      <h4 className="text-xs font-bold font-sans mt-0.5 line-clamp-1">{issue.title}</h4>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-slate-300 border-t border-slate-800 pt-1">
                        <span>{issue.status}</span>
                        <span className="font-mono text-emerald-400 font-semibold">{issue.upvotes} votes</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Legend (Bottom) */}
            <div className="flex flex-wrap items-center justify-start gap-3 z-10 bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono">Legend:</span>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-800 inline-block"></span>
                <span className="text-[10px] text-slate-300 font-mono">Resolved</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-800 inline-block"></span>
                <span className="text-[10px] text-slate-300 font-mono">In Progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-800 inline-block"></span>
                <span className="text-[10px] text-slate-300 font-mono">Verifying</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-800 inline-block"></span>
                <span className="text-[10px] text-slate-300 font-mono">Pending</span>
              </div>
            </div>
          </div>

          {/* Filters and List view */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            
            {/* Search and Filters controls */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search issues, streets, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>)}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white w-full"
                >
                  {statuses.map(st => <option key={st} value={st}>{st === "All" ? "All Statuses" : st}</option>)}
                </select>
              </div>
            </div>

            {/* List Results */}
            <div id="tracker-list-results" className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    id={`issue-card-${issue.id}`}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`p-4 border rounded-xl hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex gap-4 ${
                      issue.id === selectedIssueId 
                        ? "border-emerald-500 bg-emerald-50/10 shadow-sm shadow-emerald-500/5" 
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    {/* Miniature thumbnail */}
                    {issue.mediaUrl && (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100 hidden sm:block">
                        <img 
                          src={issue.mediaUrl} 
                          alt="reported infrastructure" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {issue.category}
                        </span>
                        {issue.aiAnalysis?.severity && (
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${getSeverityBadgeColor(issue.aiAnalysis?.severity)}`}>
                            {issue.aiAnalysis?.severity}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{issue.title}</h3>
                      
                      <div className="flex items-center text-[10px] text-slate-500 space-x-1.5 mt-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{issue.address}</span>
                      </div>
                    </div>

                    {/* Upvote score badge */}
                    <div className="text-right shrink-0 flex flex-col justify-between h-16">
                      <span className="text-[9px] text-slate-400 font-mono">{new Date(issue.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg w-fit ml-auto">
                        <ThumbsUp className="w-3.5 h-3.5 fill-emerald-500" />
                        <span className="text-xs font-mono font-bold leading-none">{issue.upvotes}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No issues found matching parameters</p>
                  <p className="text-xs text-slate-400 mt-1">Try modifying your query filters or submit a new report.</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Section: Detailed Complaint Triage Pane */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[700px] xl:h-[780px] overflow-y-auto">
          {selectedIssue ? (
            <div id="tracker-detail-panel" className="space-y-5">
              {/* Card Header image */}
              {selectedIssue.mediaUrl && (
                <div className="w-full h-44 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 relative">
                  <img 
                    src={selectedIssue.mediaUrl} 
                    alt={selectedIssue.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/50 flex items-center space-x-1.5 text-xs text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold">{selectedIssue.credibilityScore}% AI Credible</span>
                  </div>
                </div>
              )}

              {/* Title and stats */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-emerald-600 font-bold uppercase">{selectedIssue.category}</span>
                <h3 className="text-lg font-sans font-bold text-slate-900 leading-snug">{selectedIssue.title}</h3>
                
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${getStatusColor(selectedIssue.status)}`}>
                    {selectedIssue.status}
                  </span>
                  {selectedIssue.aiAnalysis?.severity && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityBadgeColor(selectedIssue.aiAnalysis?.severity)}`}>
                      {selectedIssue.aiAnalysis?.severity} Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Description & metadata */}
              <div className="space-y-2 text-xs leading-relaxed text-slate-600 border-t border-slate-50 pt-3">
                <p className="font-medium text-slate-800">{selectedIssue.description}</p>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 space-y-2 mt-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 line-clamp-1">{selectedIssue.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Reported by: <strong className="text-slate-700 font-semibold">{selectedIssue.reporterName}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Filed: <strong className="text-slate-700 font-semibold">{new Date(selectedIssue.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* AI Diagnostics details */}
              {selectedIssue.aiAnalysis && (
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-1.5">
                    <span className="text-emerald-400 font-mono">AI AUTOMATED DIAGNOSTICS</span>
                    <span className="font-mono text-emerald-500 text-[11px]">{selectedIssue.aiAnalysis.confidence}% Match</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic">
                    "{selectedIssue.aiAnalysis.rationale}"
                  </p>
                  <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                    <p><strong>Objects detected:</strong> {selectedIssue.aiAnalysis.detectedObjects.join(", ") || "generic road elements"}</p>
                    <p><strong>Impact:</strong> {selectedIssue.aiAnalysis.environmentalImpact}</p>
                  </div>
                </div>
              )}

              {/* Upvote & validation action button */}
              <div className="pt-2 border-t border-slate-100">
                {selectedIssue.reporterEmail.toLowerCase() === currentUserEmail.toLowerCase() ? (
                  <div className="bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>You cannot upvote your own reported issue</span>
                  </div>
                ) : selectedIssue.upvoters.includes(currentUserEmail.toLowerCase()) ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center space-x-2">
                    <ThumbsUp className="w-4 h-4 fill-emerald-600" />
                    <span>You've verified & upvoted this hazard</span>
                  </div>
                ) : (
                  <button
                    id="upvote-issue-btn"
                    onClick={() => handleUpvote(selectedIssue.id)}
                    disabled={isUpvoting || selectedIssue.status === "Resolved"}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                      selectedIssue.status === "Resolved"
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/10 active:scale-98"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Upvote & Verify this Complaint (+15 pts)</span>
                  </button>
                )}
                <span className="text-[9px] text-slate-400 text-center block mt-1.5 font-mono">
                  Upvoting verifies coordinates and fast-tracks the report to local public work squads.
                </span>
              </div>

              {/* Real-time status update logs timeline */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 font-sans tracking-wide uppercase">Real-Time Repairs Timeline</h4>
                
                <div className="space-y-4 relative pl-4 border-l border-slate-100 mt-2">
                  {selectedIssue.updates.map((upd, idx) => (
                    <div key={idx} className="relative text-xs space-y-1">
                      {/* Node point */}
                      <span className={`absolute -left-[21px] top-1 rounded-full w-2.5 h-2.5 border-2 bg-white ${
                        upd.status === "Resolved" ? "border-emerald-500" :
                        upd.status === "In Progress" ? "border-blue-500" :
                        upd.status === "Verifying" ? "border-amber-500" :
                        "border-slate-400"
                      }`} />
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-800">{upd.status}</span>
                        <span className="font-mono">{new Date(upd.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-slate-600 leading-normal text-[11px] pr-2">{upd.note}</p>
                      <div className="text-[9px] text-slate-400 font-mono">Logged by: {upd.author}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolved notes spotlight */}
              {selectedIssue.status === "Resolved" && selectedIssue.governmentNotes && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                  <h4 className="font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Official Resolution Summary</span>
                  </h4>
                  <p className="leading-relaxed text-emerald-950 font-sans">
                    {selectedIssue.governmentNotes}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-20">
              <Eye className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Triage Details Pane</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Click any issue on the list or choose a grid pin on the map to inspect its real-time repairs timeline.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
