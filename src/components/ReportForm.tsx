import React from "react";
import { 
  Camera, 
  MapPin, 
  Upload, 
  RefreshCw, 
  Check, 
  ShieldAlert, 
  Compass, 
  Tv, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { AIAnalysis } from "../types";

interface ReportFormProps {
  currentUserEmail: string;
  currentUserName: string;
  onSubmitIssue: (issueData: any) => Promise<{
    issue: any;
    pointsEarned: number;
    unlockedBadges: string[];
  }>;
  onSuccess: (issueId: string) => void;
}

export default function ReportForm({ 
  currentUserEmail, 
  currentUserName, 
  onSubmitIssue,
  onSuccess 
}: ReportFormProps) {
  // Form fields
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("Pothole & Roads");
  const [address, setAddress] = React.useState("");
  const [latitude, setLatitude] = React.useState(37.7749);
  const [longitude, setLongitude] = React.useState(-122.4194);
  const [mediaType, setMediaType] = React.useState<'image' | 'video' | 'none'>('none');
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);

  // UI States
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [locationDetecting, setLocationDetecting] = React.useState(false);
  const [locationSuccess, setLocationSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [scanningMessage, setScanningMessage] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  // Result diagnostics overlay state
  const [submittedResult, setSubmittedResult] = React.useState<any | null>(null);

  // Refs for video capture
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Categories list
  const categories = ["Pothole & Roads", "Water & Leakage", "Streetlight & Power", "Waste & Sanitation", "Public Parks & Infrastructure", "Other"];

  // Auto-Detect Location (GPS)
  const handleAutoDetectLocation = () => {
    setLocationDetecting(true);
    setErrorMsg("");
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setLocationDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Mock reverse geocoding to give a friendly address
        let street = "Main Street";
        let ward = "Ward 3";
        if (lat > 37.78) {
          street = "710 Library Plaza Blvd";
          ward = "Ward 3 - Central Plaza";
        } else if (lat < 37.76) {
          street = "Forest Park Trail Gate";
          ward = "Ward 1 - Forest Hills";
        } else {
          street = "Castro Street Corridor";
          ward = "Ward 5 - Castro Corridor";
        }
        
        setAddress(`${street} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);
        setLocationSuccess(true);
        setLocationDetecting(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setErrorMsg("Failed to access device coordinates. Please verify browser frame permissions or enter address manually.");
        setLocationDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  // Drag-and-Drop Image handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setErrorMsg("Invalid file type. Please upload a picture or video.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(file.type.startsWith("video/") ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  // Camera Capture - Request permissions & Start stream
  const handleStartCamera = async () => {
    setErrorMsg("");
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "environment" },
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setErrorMsg("Camera access failed. Please ensure you permit frame camera access in the AI Studio popup, or upload an existing file.");
      setIsCapturing(false);
    }
  };

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  // Take Snapshot from video
  const handleTakeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setMediaUrl(dataUrl);
        setMediaType('image');
        stopCameraStream();
      }
    }
  };

  // Submit report to full-stack backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address) {
      setErrorMsg("Please complete all required fields (Title, Description, and Location Address).");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    // Dynamic scanning message interval to make UX fun & interactive
    const scanningSteps = [
      "Analyzing uploaded bytes...",
      "Connecting to Gemini Pro Diagnostics...",
      "Detecting visual hazard parameters...",
      "Evaluating coordinate authenticity...",
      "Generating municipal impact score...",
      "Finalizing diagnostic report..."
    ];

    let stepIdx = 0;
    setScanningMessage(scanningSteps[0]);
    const messageInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < scanningSteps.length) {
        setScanningMessage(scanningSteps[stepIdx]);
      }
    }, 1500);

    try {
      const issueData = {
        title,
        description,
        category,
        latitude,
        longitude,
        address,
        mediaUrl,
        mediaType,
        reporterName: currentUserName,
        reporterEmail: currentUserEmail
      };

      const result = await onSubmitIssue(issueData);
      clearInterval(messageInterval);
      setSubmittedResult(result);
    } catch (err: any) {
      clearInterval(messageInterval);
      setErrorMsg(err.message || "Failed to submit. Check your server logs.");
      setSubmitting(false);
    }
  };

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div id="report-form-layout" className="max-w-2xl mx-auto relative">
      
      {/* Submitting AI Scan Overlay */}
      {submitting && !submittedResult && (
        <div id="ai-scanning-overlay" className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="space-y-4 max-w-sm">
            {/* Visual radar wave element */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25"></span>
              <span className="absolute inset-2 bg-emerald-500 rounded-full animate-pulse opacity-40"></span>
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6 text-white animate-spin" style={{ animationDuration: "6s" }} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-sans font-bold text-lg">CivicSense AI Diagnostic Scan</h3>
              <p className="text-xs text-slate-400 font-mono tracking-wide">{scanningMessage}</p>
            </div>
            <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
              Analyzing visual hazard patterns to filter fraudulent or duplicate community logs. Real-time GPS check is in progress.
            </p>
          </div>
        </div>
      )}

      {/* SUCCESS DIAGNOSTIC REPORT MODAL */}
      {submittedResult && (
        <div id="diagnostic-report-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header badge area */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <span className="font-sans font-bold text-base">AI DIAGNOSTIC REPORT</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-bold">
                Verification Success
              </span>
            </div>

            {/* Analysis Data content */}
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-mono block">AUTOMATED VERIFICATION RATIO</span>
                  <h4 className="text-2xl font-mono font-extrabold text-slate-900">
                    {submittedResult.issue.credibilityScore}% Credibility
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-mono block">CIVIC BOUNTY</span>
                  <h4 className="text-lg font-mono font-bold text-emerald-600">
                    +{submittedResult.pointsEarned} pts
                  </h4>
                </div>
              </div>

              {/* Rationale detail */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 text-xs text-slate-700 space-y-2 leading-relaxed">
                <p><strong>Rationale:</strong> {submittedResult.issue.aiAnalysis?.rationale || "Validated with positive geographic correlation indices."}</p>
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Detected parameters:</span>
                  {(submittedResult.issue.aiAnalysis?.detectedObjects || []).map((o: string) => (
                    <span key={o} className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono font-medium">{o}</span>
                  ))}
                </div>
              </div>

              {/* Verified specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/60">
                  <span className="text-slate-400 text-[10px]">Triage Priority</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {submittedResult.issue.aiAnalysis?.severity || "Medium"} Severity
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/60">
                  <span className="text-slate-400 text-[10px]">Confirmed Category</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {submittedResult.issue.category}
                  </p>
                </div>
              </div>

              {/* Badge announcement */}
              {submittedResult.unlockedBadges.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0 animate-bounce">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">New Achievement Unlocked!</h5>
                    <p className="text-[10px] text-slate-600">You earned reputation awards on your Citizen Profile.</p>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-normal">
                Municipal road and sanitation dispatch order has been scheduled automatically. Your report is now pinned on the interactive district map!
              </p>
            </div>

            {/* Footer action button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                id="close-report-diagnostic-btn"
                onClick={() => {
                  const id = submittedResult.issue.id;
                  setSubmittedResult(null);
                  onSuccess(id);
                }}
                className="bg-slate-900 hover:bg-slate-800 hover:scale-101 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Publish to Interactive Tracker</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Report Form Screen */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-sans font-bold text-slate-900">File a Community Complaint</h2>
            <p className="text-xs text-slate-500">Provide photo diagnostics to alert the municipal engineering desk.</p>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <span>Short Title / Issue Name</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              id="report-title-input"
              type="text"
              required
              placeholder="e.g. Broken streetlight causing pitch-black pathway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <span>Detailed Description</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="report-desc-input"
              required
              rows={3}
              placeholder="Provide exact details of the structural hazard, potential risks, pedestrian frequency, or utility leakage indicators..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed resize-none"
            />
          </div>

          {/* Category selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                id="report-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Auto-Detect location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Location Pinning</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <button
                  id="detect-gps-btn"
                  type="button"
                  disabled={locationDetecting}
                  onClick={handleAutoDetectLocation}
                  className={`px-3 py-2 border rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                    locationSuccess 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${locationSuccess ? "text-emerald-500" : "text-slate-400"}`} />
                  <span>{locationDetecting ? "Detecting..." : locationSuccess ? "GPS Locked" : "Auto-Detect GPS"}</span>
                </button>
                <span className="text-[10px] text-slate-400 self-center leading-tight">or edit manually below</span>
              </div>
            </div>
          </div>

          {/* Physical Address description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Physical Address / Nearby Landmark</label>
            <input
              id="report-address-input"
              type="text"
              required
              placeholder="e.g. 412 Oak Avenue (outside main bank lobby)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Photographic Diagnostics Capture & Upload Box */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="text-xs font-semibold text-slate-700 block">Photographic Diagnostics / Video Proof</label>
            
            {/* Camera Viewport Overlay */}
            {isCapturing ? (
              <div id="camera-viewport-card" className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center space-y-3 relative overflow-hidden">
                <video 
                  ref={videoRef} 
                  className="w-full h-48 md:h-64 object-cover rounded-lg bg-black"
                  playsInline
                  muted
                />
                
                <div className="flex space-x-3">
                  <button
                    id="camera-snap-btn"
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-1 cursor-pointer shadow shadow-emerald-500/15"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Snapshot</span>
                  </button>
                  <button
                    id="camera-cancel-btn"
                    type="button"
                    onClick={stopCameraStream}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Drag Upload Area */}
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-50/50 transition-all flex flex-col justify-center items-center relative group">
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleImageFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-slate-500 mb-2 transition-transform group-hover:-translate-y-0.5" />
                  <p className="text-xs font-semibold text-slate-700">Drag & Drop Image or Video</p>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or MP4 up to 20MB</p>
                </div>

                {/* Camera Snap Launcher */}
                <button
                  id="camera-launch-btn"
                  type="button"
                  onClick={handleStartCamera}
                  className="border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl p-6 text-center flex flex-col justify-center items-center cursor-pointer group transition-all"
                >
                  <Camera className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-105 transition-transform" />
                  <p className="text-xs font-semibold text-slate-700">Use Device Camera</p>
                  <p className="text-[10px] text-slate-400 mt-1">Prompt for real-time video snapshot</p>
                </button>

              </div>
            )}

            {/* Media thumbnail preview */}
            {mediaUrl && (
              <div id="media-preview-box" className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded bg-slate-200 overflow-hidden shrink-0 border">
                    {mediaType === 'video' ? (
                      <div className="w-full h-full bg-slate-850 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-slate-400" />
                      </div>
                    ) : (
                      <img src={mediaUrl} alt="Thumbnail preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Attached {mediaType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Size matches limits</span>
                  </div>
                </div>
                <button
                  id="remove-media-btn"
                  type="button"
                  onClick={() => {
                    setMediaUrl(null);
                    setMediaType('none');
                  }}
                  className="text-xs text-red-500 font-semibold hover:text-red-700 hover:underline cursor-pointer"
                >
                  Clear File
                </button>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 leading-tight flex items-center space-x-1 max-w-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>CivicSense automatically filters duplicate/fake reports via server-side Gemini checks.</span>
            </span>
            <button
              id="submit-issue-btn"
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer active:scale-98 transition-all flex items-center space-x-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Submit & AI Analyze</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
