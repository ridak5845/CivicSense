import React from "react";
import { Issue } from "../types";
import { 
  Building2, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  ThumbsUp, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  FileSpreadsheet,
  FileText
} from "lucide-react";

interface GovernmentPortalProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, status: string, note: string, officer: string) => Promise<void>;
}

export default function GovernmentPortal({ issues, onUpdateStatus }: GovernmentPortalProps) {
  const [selectedIssueId, setSelectedIssueId] = React.useState<string | null>(null);
  
  // Official form fields
  const [newStatus, setNewStatus] = React.useState("In Progress");
  const [officialNote, setOfficialNote] = React.useState("");
  const [officerName, setOfficerName] = React.useState("Director Raymond (District 3)");
  
  const [submitting, setSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Initialize form fields when issue selection changes
  React.useEffect(() => {
    if (selectedIssue) {
      setNewStatus(selectedIssue.status);
      setOfficialNote(selectedIssue.governmentNotes || "");
    }
    setSuccessMsg("");
    setErrorMsg("");
  }, [selectedIssueId]);

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !officialNote.trim()) {
      setErrorMsg("Please write an administrative note or dispatch order description before publishing.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await onUpdateStatus(selectedIssueId, newStatus, officialNote, officerName);
      setSuccessMsg(`Status updated to '${newStatus}' with administrative log logged successfully!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize official action with server. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Pending": return "bg-slate-100 text-slate-800 border-slate-200";
      case "Verifying": return "bg-amber-100 text-amber-850 border-amber-200";
      case "In Progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Resolved": return "bg-emerald-100 text-emerald-850 border-emerald-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div id="government-portal-layout" className="space-y-6">
      
      {/* Top Professional Crest Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-800 rounded-xl text-emerald-400 border border-slate-700 shrink-0">
            <Building2 className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-sans font-bold tracking-tight">Municipal Engineering & Public Works Portal</h2>
            <p className="text-xs text-slate-400 mt-0.5">District Triage Console - Citizen reported hazards and infrastructure diagnostics inbox.</p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-ping"></span>
          <span>Official Session Authenticated</span>
        </div>
      </div>

      {/* Main Splits: left complaints list, right official actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Complaints Triage Table (takes 2 columns) */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-base">District Complaints Inbox</h3>
              <p className="text-xs text-slate-500">Select any record to issue dispatch work-orders or log completions</p>
            </div>
            <FileSpreadsheet className="w-5 h-5 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-2 pb-2">Status</th>
                  <th className="py-2 pb-2">Complaint / Title</th>
                  <th className="py-2 pb-2 text-center">AI Credibility</th>
                  <th className="py-2 pb-2 text-center">Upvotes</th>
                  <th className="py-2 pb-2 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700 text-xs">
                {issues.map((issue) => {
                  const isSelected = issue.id === selectedIssueId;
                  return (
                    <tr 
                      key={issue.id} 
                      id={`gov-inbox-row-${issue.id}`}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-50 border-l-2 border-l-slate-900" : ""
                      }`}
                    >
                      {/* Status */}
                      <td className="py-3 pr-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeStyle(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      {/* Title & Street */}
                      <td className="py-3">
                        <p className="text-slate-900 font-bold max-w-xs truncate">{issue.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{issue.address}</span>
                      </td>
                      {/* AI Score */}
                      <td className="py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                          issue.credibilityScore >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                        }`}>
                          {issue.credibilityScore}%
                        </span>
                      </td>
                      {/* Upvotes */}
                      <td className="py-3 text-center font-mono font-bold text-slate-500">{issue.upvotes}</td>
                      {/* Action trigger */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5 text-slate-400">
                          <span className="text-[10px] text-slate-400 hidden sm:inline">Inspect</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Administrative Action Desk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[620px] overflow-y-auto">
          {selectedIssue ? (
            <div id="gov-actions-panel" className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-base">Administrative Action</h3>
                  <span className="text-[10px] text-slate-400 font-mono">FILE REF: {selectedIssue.id}</span>
                </div>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Snapshot preview of problem */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1 text-xs">
                <span className="text-slate-400 text-[10px]">INSPECTING COMPLAINT:</span>
                <h4 className="font-bold text-slate-900 leading-snug line-clamp-1">{selectedIssue.title}</h4>
                <p className="text-slate-500 line-clamp-2 mt-1 leading-normal">{selectedIssue.description}</p>
                <div className="text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-150 flex justify-between items-center mt-2">
                  <span>Category: {selectedIssue.category}</span>
                  <span className="font-bold">By: {selectedIssue.reporterName}</span>
                </div>
              </div>

              {/* Action Form */}
              <form onSubmit={handleSubmitAction} className="space-y-3.5">
                
                {/* Official signature */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Official Signature / Department</label>
                  <input
                    id="gov-officer-signature"
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                {/* Transition state selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Transition Status State</label>
                  <select
                    id="gov-status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="Pending">Pending (Unverified)</option>
                    <option value="Verifying">Verifying (Triage under municipal office)</option>
                    <option value="In Progress">In Progress (Dispatching engineering crew)</option>
                    <option value="Resolved">Resolved (Resolution verified on-site)</option>
                  </select>
                </div>

                {/* Status action log notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Official Note / Dispatch log</label>
                  <textarea
                    id="gov-note-textarea"
                    required
                    rows={4}
                    placeholder="Describe engineering dispatch orders, estimated repair schedules, water utility valve cutoffs, or final resolutions on-site..."
                    value={officialNote}
                    onChange={(e) => setOfficialNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white leading-relaxed resize-none"
                  />
                </div>

                <button
                  id="gov-submit-action-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer shadow flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{submitting ? "Publishing Note..." : "Publish Official Repair Note"}</span>
                </button>
              </form>

              <span className="text-[10px] text-slate-400 text-center block leading-normal pt-1.5 font-sans border-t border-slate-100/60">
                Updating status automatically triggers alerts in the citizen's Repairs Timeline and increments points upon completion!
              </span>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <Eye className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Triage Action Board</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Select any citizen complaint from the left table inbox to log official department responses or change repair states.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
