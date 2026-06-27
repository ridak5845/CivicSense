import React, { useState, useMemo, useRef } from "react";
import { Issue } from "../types";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  ThumbsUp, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  ShieldCheck, 
  User, 
  Calendar, 
  ArrowUpRight, 
  Layers, 
  Map, 
  X, 
  Locate 
} from "lucide-react";

interface MapViewProps {
  issues: Issue[];
  currentUserEmail: string;
  onUpvoteIssue: (issueId: string) => Promise<void>;
  onViewChange?: (view: string) => void;
  setSelectedIssueIdInTracker?: (id: string | null) => void;
}

export default function MapView({ 
  issues, 
  currentUserEmail, 
  onUpvoteIssue,
  onViewChange,
  setSelectedIssueIdInTracker
}: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Interactive Map Navigation States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapStyle, setMapStyle] = useState<"dark" | "light" | "blueprint">("blueprint");
  
  // Real-time cursor coordinates simulation
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic boundaries based on issues + safety margins to center all reports
  const bounds = useMemo(() => {
    if (issues.length === 0) {
      return {
        latMin: 37.7500,
        latMax: 37.7900,
        lngMin: -122.4500,
        lngMax: -122.4100
      };
    }
    const lats = issues.map(i => i.latitude);
    const lngs = issues.map(i => i.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add 15% padding so pins aren't on the absolute edge
    const latDiff = maxLat - minLat || 0.01;
    const lngDiff = maxLng - minLng || 0.01;

    return {
      latMin: minLat - latDiff * 0.15,
      latMax: maxLat + latDiff * 0.15,
      lngMin: minLng - lngDiff * 0.15,
      latMaxLng: maxLng + lngDiff * 0.15,
      // Fallback/standard limits if tight
      get latMinVal() { return Math.min(this.latMin, 37.7500); },
      get latMaxVal() { return Math.max(this.latMax, 37.7900); },
      get lngMinVal() { return Math.min(this.lngMin, -122.4500); },
      get lngMaxVal() { return Math.max(maxLng + lngDiff * 0.15, -122.4100); }
    };
  }, [issues]);

  const getCoordinatesPercent = (lat: number, lng: number) => {
    const { latMinVal, latMaxVal, lngMinVal, lngMaxVal } = bounds;

    // Flip Lat because SVG Y starts at top
    const y = 100 - ((lat - latMinVal) / (latMaxVal - latMinVal)) * 100;
    const x = ((lng - lngMinVal) / (lngMaxVal - lngMinVal)) * 100;

    return {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y))
    };
  };

  // Convert cursor position back to Simulated coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const { latMinVal, latMaxVal, lngMinVal, lngMaxVal } = bounds;
    
    const virtualLng = lngMinVal + (xPercent / 100) * (lngMaxVal - lngMinVal);
    const virtualLat = latMaxVal - (yPercent / 100) * (latMaxVal - latMinVal);

    setHoveredCoords({
      lat: Number(virtualLat.toFixed(4)),
      lng: Number(virtualLng.toFixed(4))
    });
  };

  // Drag-to-Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(4, prev + 0.3));
  const handleZoomOut = () => setZoom(prev => Math.max(1, prev - 0.3));
  const handleResetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Filter logic
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || issue.category === selectedCategory;
      const matchesStatus = selectedStatus === "All" || issue.status === selectedStatus;
      const matchesSeverity = selectedSeverity === "All" || issue.aiAnalysis?.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
    });
  }, [issues, searchQuery, selectedCategory, selectedStatus, selectedSeverity]);

  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId);
  }, [issues, selectedIssueId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-slate-600 bg-slate-100 border-slate-200";
      case "Verifying": return "text-amber-600 bg-amber-50 border-amber-200";
      case "In Progress": return "text-blue-600 bg-blue-50 border-blue-200";
      case "Resolved": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      default: return "text-slate-500 bg-slate-100 border-slate-200";
    }
  };

  const getPriorityColor = (severity?: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500 border-red-200 text-white ring-red-500/20";
      case "High": return "bg-amber-500 border-amber-200 text-white ring-amber-500/20";
      case "Medium": return "bg-blue-500 border-blue-200 text-white ring-blue-500/20";
      case "Low": return "bg-slate-500 border-slate-200 text-white ring-slate-500/20";
      default: return "bg-slate-400 border-slate-200 text-white ring-slate-400/20";
    }
  };

  const centerOnIssue = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    const { x, y } = getCoordinatesPercent(issue.latitude, issue.longitude);
    
    // Zoom in slightly and adjust pan to center on the pin
    setZoom(1.8);
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const targetX = (rect.width / 2) - (x / 100) * rect.width * 1.8;
      const targetY = (rect.height / 2) - (y / 100) * rect.height * 1.8;
      setPan({ x: targetX, y: targetY });
    }
  };

  const handleUpvote = async (issueId: string) => {
    try {
      await onUpvoteIssue(issueId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigateToTracker = (issueId: string) => {
    if (onViewChange) {
      if (setSelectedIssueIdInTracker) {
        setSelectedIssueIdInTracker(issueId);
      }
      onViewChange("tracker");
    }
  };

  // Lists of unique attributes for dropdowns
  const categoriesList = ["All", "Pothole & Roads", "Water & Leakage", "Streetlight & Power", "Waste & Sanitation", "Public Parks & Infrastructure", "Other"];
  const statusesList = ["All", "Pending", "Verifying", "In Progress", "Resolved"];
  const severitiesList = ["All", "Low", "Medium", "High", "Critical"];

  return (
    <div id="map-view-container" className="space-y-4">
      {/* Search and Filters Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-lg">Interactive GPS Dispatch Grid</h3>
            <p className="text-xs text-slate-500">Real-time coordinates visualizer and neighborhood repair zones</p>
          </div>
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 flex-1 max-w-4xl">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search address or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="All">All Categories</option>
              {categoriesList.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              {statusesList.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="All">All Severities</option>
              {severitiesList.filter(v => v !== "All").map(v => <option key={v} value={v}>{v} Severity</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Visualizer Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map Stage (Left Column, takes 2 spaces) */}
        <div className="lg:col-span-2 relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-[450px] md:h-[550px] flex flex-col justify-between shadow-inner">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 z-10">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "16s" }} />
              <span className="text-[11px] font-mono font-semibold text-slate-200">District Map Layout</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase">
                Interactive Grid
              </span>
            </div>

            {/* Map Theme Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button 
                onClick={() => setMapStyle("blueprint")}
                className={`px-2 py-1 text-[9px] font-mono rounded transition-all ${mapStyle === "blueprint" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400 hover:text-white"}`}
              >
                Blueprint
              </button>
              <button 
                onClick={() => setMapStyle("dark")}
                className={`px-2 py-1 text-[9px] font-mono rounded transition-all ${mapStyle === "dark" ? "bg-slate-800 text-slate-200 font-bold" : "text-slate-400 hover:text-white"}`}
              >
                Dark
              </button>
              <button 
                onClick={() => setMapStyle("light")}
                className={`px-2 py-1 text-[9px] font-mono rounded transition-all ${mapStyle === "light" ? "bg-slate-100 text-slate-800 font-bold" : "text-slate-400 hover:text-slate-200"}`}
              >
                Grey
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas Container */}
          <div 
            ref={mapContainerRef}
            className={`flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none ${
              mapStyle === "light" ? "bg-slate-200" : mapStyle === "dark" ? "bg-slate-950" : "bg-slate-900"
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveDrag}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Styled Vector SVG Street Map Backdrop */}
            <div 
              className="absolute inset-0 w-full h-full origin-center transition-all duration-300 ease-out pointer-events-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                opacity: mapStyle === "light" ? 0.9 : 0.4
              }}
            >
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Major River / Waterfront */}
                <path d="M 0 95 Q 30 92 60 98 T 100 93 L 100 100 L 0 100 Z" fill={mapStyle === "light" ? "#93c5fd" : "#1e293b"} opacity="0.6" />

                {/* Grid guidelines / coordinates lines */}
                <line x1="10" y1="0" x2="10" y2="100" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="30" y1="0" x2="30" y2="100" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="50" y1="0" x2="50" y2="100" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="70" y1="0" x2="70" y2="100" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="90" y1="0" x2="90" y2="100" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                
                <line x1="0" y1="20" x2="100" y2="20" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="0" y1="40" x2="100" y2="40" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="0" y1="60" x2="100" y2="60" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />
                <line x1="0" y1="80" x2="100" y2="80" stroke={mapStyle === "light" ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1" />

                {/* Primary Ring Road */}
                <circle cx="50" cy="50" r="32" fill="none" stroke={mapStyle === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" strokeDasharray="1,2" />

                {/* Streets Diagonal lines & Secondary Grids */}
                <line x1="0" y1="20" x2="100" y2="35" stroke={mapStyle === "light" ? "#94a3b8" : "#334155"} strokeWidth="0.6" />
                <line x1="0" y1="50" x2="100" y2="50" stroke={mapStyle === "light" ? "#94a3b8" : "#475569"} strokeWidth="1" />
                <line x1="0" y1="80" x2="100" y2="78" stroke={mapStyle === "light" ? "#94a3b8" : "#334155"} strokeWidth="0.6" />

                <line x1="25" y1="0" x2="25" y2="100" stroke={mapStyle === "light" ? "#94a3b8" : "#334155"} strokeWidth="0.6" />
                <line x1="55" y1="0" x2="58" y2="100" stroke={mapStyle === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.8" />
                <line x1="82" y1="0" x2="82" y2="100" stroke={mapStyle === "light" ? "#94a3b8" : "#334155"} strokeWidth="0.6" strokeDasharray="2,2" />

                {/* District Park Zones */}
                <rect x="5" y="8" width="18" height="18" fill={mapStyle === "light" ? "#bbf7d0" : "#064e3b"} opacity="0.3" rx="1" />
                <rect x="72" y="38" width="22" height="25" fill={mapStyle === "light" ? "#bbf7d0" : "#064e3b"} opacity="0.35" rx="2" />
                <circle cx="15" cy="72" r="10" fill={mapStyle === "light" ? "#bbf7d0" : "#064e3b"} opacity="0.2" />

                {/* Industrial Area */}
                <rect x="42" y="70" width="12" height="12" fill={mapStyle === "light" ? "#e2e8f0" : "#1e293b"} opacity="0.4" rx="1" />
              </svg>
            </div>

            {/* Landmark text indicators */}
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none select-none text-[8px] font-mono tracking-wider"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            >
              <div className={`absolute left-[7%] top-[12%] ${mapStyle === "light" ? "text-emerald-800" : "text-emerald-500/80"}`}>
                🌲 Wildwood Park Range
              </div>
              <div className={`absolute left-[45%] top-[45%] ${mapStyle === "light" ? "text-slate-800" : "text-slate-300"}`}>
                🏢 Central Sector Grid
              </div>
              <div className={`absolute left-[78%] top-[50%] ${mapStyle === "light" ? "text-emerald-800" : "text-emerald-500/80"}`}>
                🌳 Forest Hill Conservation
              </div>
              <div className={`absolute left-[10%] top-[78%] ${mapStyle === "light" ? "text-blue-800" : "text-slate-400"}`}>
                🏛️ Civic Plaza Blvd
              </div>
            </div>

            {/* Pins layer */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            >
              {filteredIssues.map((issue) => {
                const { x, y } = getCoordinatesPercent(issue.latitude, issue.longitude);
                const isSelected = issue.id === selectedIssueId;
                const markerColor = getPriorityColor(issue.aiAnalysis?.severity);

                return (
                  <button
                    key={issue.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIssueId(issue.id);
                    }}
                    className="absolute group transition-transform hover:scale-125 focus:outline-none z-20 cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    {/* Pulsing beacon outer ring */}
                    <span className={`absolute -inset-2.5 rounded-full ring-4 animate-ping opacity-75 ${
                      issue.aiAnalysis?.severity === "Critical" ? "ring-red-500/40" : 
                      issue.aiAnalysis?.severity === "High" ? "ring-amber-500/40" : 
                      "ring-blue-500/40"
                    }`}></span>

                    {/* Outer core circle */}
                    <div className={`w-5 h-5 rounded-full shadow-lg border-2 border-slate-950 flex items-center justify-center transition-all ${markerColor} ${
                      isSelected ? "ring-4 ring-emerald-500 scale-120 z-30" : "hover:ring-2 hover:ring-white"
                    }`}>
                      {/* Priority Initial tag inside marker */}
                      <span className="text-[7px] font-sans font-extrabold text-slate-950">
                        {issue.aiAnalysis?.severity ? issue.aiAnalysis.severity[0] : "L"}
                      </span>
                    </div>

                    {/* Hover Card Mini Tooltip */}
                    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none text-left leading-normal z-50">
                      <div className="flex justify-between items-center text-[8px] font-mono font-bold">
                        <span className="text-emerald-400 uppercase tracking-wider">{issue.category}</span>
                        <span className={`px-1 rounded ${
                          issue.aiAnalysis?.severity === "Critical" ? "bg-red-950 text-red-400" :
                          issue.aiAnalysis?.severity === "High" ? "bg-amber-950 text-amber-400" :
                          "bg-slate-800 text-slate-300"
                        }`}>
                          {issue.aiAnalysis?.severity || "High"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold font-sans mt-1 line-clamp-1 text-slate-100">{issue.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{issue.address}</p>
                      
                      <div className="flex items-center justify-between mt-1.5 border-t border-slate-800 pt-1 text-[9px] font-mono">
                        <span className="text-slate-400 font-semibold">{issue.status}</span>
                        <span className="text-emerald-400 font-bold">{issue.upvotes} Upvotes</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Utility Grid & Coordinates status footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 z-10 flex flex-wrap items-center justify-between gap-3 text-white text-[10px] font-mono">
            {/* Live coordinates display */}
            <div className="flex items-center space-x-2 text-slate-400">
              <Locate className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
              <span>Cursor Coordinate:</span>
              <span className="text-slate-200 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                {hoveredCoords ? `LAT: ${hoveredCoords.lat} / LNG: ${hoveredCoords.lng}` : "HOVER OVER MAP"}
              </span>
            </div>

            {/* Zoom / Pan Navigation buttons */}
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={handleZoomOut} 
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all rounded-lg shrink-0 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <span className="px-1.5 text-[9px] font-bold text-slate-400 font-mono">{(zoom * 100).toFixed(0)}%</span>
              <button 
                onClick={handleZoomIn} 
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all rounded-lg shrink-0 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <button 
                onClick={handleResetMap} 
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 text-[9px] font-bold tracking-wide transition-all rounded-lg shrink-0 flex items-center space-x-1 cursor-pointer"
                title="Recenter"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar & Inspector (Right Column) */}
        <div className="flex flex-col h-[450px] md:h-[550px] space-y-4">
          
          {/* Active Issue List Sidepane */}
          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-0">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans mb-3">
              Visible Reports ({filteredIssues.length})
            </h4>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => {
                  const isSelected = issue.id === selectedIssueId;
                  const severityText = issue.aiAnalysis?.severity || "High";
                  
                  return (
                    <div
                      key={issue.id}
                      onClick={() => centerOnIssue(issue)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-start ${
                        isSelected 
                          ? "border-emerald-500 bg-emerald-50/10 shadow-sm" 
                          : "border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <div className="space-y-1 pr-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[8px] font-mono px-1 rounded uppercase font-bold ${
                            severityText === "Critical" ? "bg-red-100 text-red-700 border border-red-200" :
                            severityText === "High" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}>
                            {severityText}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{issue.category}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{issue.title}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{issue.address}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col justify-between items-end h-10">
                        <span className="text-[8px] text-slate-400 font-mono">{issue.status}</span>
                        <div className="text-[10px] font-mono font-semibold text-emerald-600 flex items-center space-x-0.5">
                          <ThumbsUp className="w-2.5 h-2.5 fill-emerald-500" />
                          <span>{issue.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
                  <AlertTriangle className="w-8 h-8 text-slate-300 mb-1.5" />
                  <p className="text-xs font-bold">No active pins matches</p>
                  <p className="text-[10px] text-slate-400 max-w-xs px-2 mt-0.5">Modify the keyword search or drop-down filters above.</p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Inspection panel for Selected Pin */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white flex flex-col justify-between h-[230px] shrink-0">
            {selectedIssue ? (
              <div className="flex flex-col justify-between h-full space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono uppercase text-emerald-400 tracking-wider font-bold">
                      {selectedIssue.category}
                    </span>
                    <button 
                      onClick={() => setSelectedIssueId(null)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold line-clamp-1 font-sans text-slate-100">{selectedIssue.title}</h4>
                  <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">{selectedIssue.description}</p>
                  
                  <div className="flex items-center text-[10px] text-slate-400 space-x-1 py-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{selectedIssue.address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className="text-[9px] font-mono text-slate-400 space-y-0.5">
                    <p>Status: <strong className="text-slate-100">{selectedIssue.status}</strong></p>
                    <p>Priority: <strong className="text-slate-100">{selectedIssue.aiAnalysis?.severity || "High"}</strong></p>
                  </div>

                  <div className="flex items-center justify-end space-x-1 text-right shrink-0">
                    <button 
                      onClick={() => handleUpvote(selectedIssue.id)}
                      disabled={selectedIssue.reporterEmail.toLowerCase() === currentUserEmail.toLowerCase() || selectedIssue.upvoters.includes(currentUserEmail.toLowerCase())}
                      className={`px-2 py-1 text-[10px] rounded-lg font-bold flex items-center space-x-1 border transition-all cursor-pointer ${
                        selectedIssue.reporterEmail.toLowerCase() === currentUserEmail.toLowerCase()
                          ? "bg-amber-950/20 border-amber-800/40 text-amber-500 cursor-not-allowed opacity-70"
                          : selectedIssue.upvoters.includes(currentUserEmail.toLowerCase())
                            ? "bg-slate-800 border-slate-700 text-emerald-400"
                            : "bg-emerald-500 border-emerald-600 hover:bg-emerald-600 text-slate-950 active:scale-95"
                      }`}
                      title={selectedIssue.reporterEmail.toLowerCase() === currentUserEmail.toLowerCase() ? "You cannot upvote your own reported issue" : ""}
                    >
                      <ThumbsUp className="w-3 h-3 fill-current" />
                      <span>
                        {selectedIssue.reporterEmail.toLowerCase() === currentUserEmail.toLowerCase() 
                          ? "Your Report" 
                          : selectedIssue.upvoters.includes(currentUserEmail.toLowerCase()) 
                            ? "Upvoted" 
                            : "Upvote"}
                      </span>
                    </button>

                    <button 
                      onClick={() => handleNavigateToTracker(selectedIssue.id)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-all cursor-pointer"
                      title="Inspect Timeline Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-6">
                <Compass className="w-8 h-8 text-slate-500 mb-1.5 animate-pulse" />
                <p className="text-xs font-bold text-slate-200 font-sans">Active Pin Inspector</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-0.5 leading-normal">
                  Click any marker on the map or select a complaint from the list above to view GPS metadata and resolution controls.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
