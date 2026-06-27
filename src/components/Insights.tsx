import React from "react";
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  RefreshCw, 
  Lightbulb, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { SystemInsight } from "../types";

interface InsightsProps {
  onFetchInsights: () => Promise<SystemInsight[]>;
}

export default function Insights({ onFetchInsights }: InsightsProps) {
  const [insights, setInsights] = React.useState<SystemInsight[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");

  const loadInsights = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await onFetchInsights();
      setInsights(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to synchronize with Gemini Predictive Server. Displaying simulated backup records.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadInsights();
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "danger":
        return {
          icon: ShieldAlert,
          bg: "bg-red-50 border-red-100",
          text: "text-red-700",
          iconColor: "text-red-500",
          tag: "bg-red-600 text-white"
        };
      case "warning":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-50 border-amber-100",
          text: "text-amber-700",
          iconColor: "text-amber-500",
          tag: "bg-amber-500 text-slate-900 font-bold"
        };
      case "success":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-50 border-emerald-100",
          text: "text-emerald-700",
          iconColor: "text-emerald-500",
          tag: "bg-emerald-500 text-white"
        };
      case "info":
      default:
        return {
          icon: Info,
          bg: "bg-blue-50 border-blue-100",
          text: "text-blue-700",
          iconColor: "text-blue-500",
          tag: "bg-blue-600 text-white"
        };
    }
  };

  return (
    <div id="insights-layout" className="space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 rounded-2xl border border-slate-800 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
              AI-Powered Predictive Analysis
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-extrabold tracking-tight text-white leading-tight">
            Gemini Municipal Trends & Recommendations
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            By continuously scanning community photographic reports, GPS hotspots, and repair frequencies, Gemini generates proactive, smart-city recommendations to solve issues before they compound.
          </p>
        </div>
        
        <button
          id="reload-insights-btn"
          disabled={loading}
          onClick={loadInsights}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center space-x-2 shrink-0 transition-all cursor-pointer active:scale-98"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Re-Analyzing..." : "Re-Scan Records"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-xl flex items-center space-x-1.5">
          <Info className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Pane */}
      {loading ? (
        <div id="insights-skeleton-loader" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-1/3 h-4 bg-slate-200 rounded"></div>
                <div className="w-12 h-6 bg-slate-200 rounded-full"></div>
              </div>
              <div className="w-full h-12 bg-slate-100 rounded-xl"></div>
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="w-1/4 h-3 bg-slate-100 rounded"></div>
                <div className="w-5/6 h-8 bg-slate-50 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div id="insights-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => {
            const styles = getSeverityStyles(insight.severity);
            const SeverityIcon = styles.icon;

            return (
              <div 
                key={index} 
                id={`insight-card-${index}`}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Visual Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${insight.severity === 'danger' ? 'bg-red-500' : insight.severity === 'warning' ? 'bg-amber-500' : insight.severity === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                      Category Affected: {insight.categoryAffected}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase tracking-widest ${styles.tag}`}>
                      {insight.severity} alert
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-slate-900 text-base flex items-start gap-2">
                    <SeverityIcon className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />
                    <span>{insight.title}</span>
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans pl-7">
                    {insight.description}
                  </p>
                </div>

                {/* City Proactive recommendation */}
                <div className="pl-7 pt-3 border-t border-slate-50 space-y-2">
                  <span className="text-[9px] text-emerald-600 font-mono font-bold flex items-center space-x-1 uppercase tracking-wide">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>AI Proactive Smart-City Action</span>
                  </span>
                  
                  <div className="bg-emerald-50/20 border border-emerald-100/50 p-3 rounded-xl text-xs text-slate-700 leading-normal font-sans italic">
                    "{insight.recommendation}"
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Predictive Hotspot explanation card */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Preventative Road Maintenance Pipeline Active</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">
            AI has localized paving deterioration indexes within Ward 3. Municipal works department has scheduled proactive crack sealing for July 12 to bypass expensive pothole breakouts.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-xs shrink-0 font-mono">
          <span>Cost Saving index: +22%</span>
        </div>
      </div>

    </div>
  );
}
