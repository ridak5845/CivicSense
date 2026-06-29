import React from "react";
import { Issue, UserProfile } from "../types";
import { Bell, CheckCheck, Clock, ExternalLink } from "lucide-react";

interface NotificationBellProps {
  issues: Issue[];
  currentUser: UserProfile;
  onSelectIssue: (issueId: string) => void;
  onViewChange: (view: string) => void;
  theme?: "light" | "dark";
}

export default function NotificationBell({
  issues,
  currentUser,
  onSelectIssue,
  onViewChange,
  theme = "light"
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [readNotifications, setReadNotifications] = React.useState<string[]>([]);

  // Load read notifications from localStorage whenever the current user changes
  React.useEffect(() => {
    if (currentUser?.email) {
      try {
        const saved = localStorage.getItem(`civicsense-read-notifications-${currentUser.email}`);
        setReadNotifications(saved ? JSON.parse(saved) : []);
      } catch (err) {
        console.error("Failed to load read notifications", err);
        setReadNotifications([]);
      }
    } else {
      setReadNotifications([]);
    }
  }, [currentUser?.email]);

  // Sync to localStorage
  const saveReadNotifications = (updated: string[]) => {
    setReadNotifications(updated);
    if (currentUser?.email) {
      try {
        localStorage.setItem(
          `civicsense-read-notifications-${currentUser.email}`,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error("Failed to save read notifications", err);
      }
    }
  };

  // Compile notifications from issues reported by the user
  const notifications = React.useMemo(() => {
    if (!currentUser?.email) return [];

    const list: Array<{
      id: string;
      issueId: string;
      issueTitle: string;
      status: 'Pending' | 'Verifying' | 'In Progress' | 'Resolved';
      note: string;
      updatedAt: string;
      author: string;
    }> = [];

    issues.forEach((issue) => {
      // Only include updates on issues reported by the logged in citizen (or if it matches their email)
      if (issue.reporterEmail === currentUser.email && issue.updates) {
        issue.updates.forEach((update) => {
          list.push({
            id: `${issue.id}-${update.status}-${update.updatedAt}`,
            issueId: issue.id,
            issueTitle: issue.title,
            status: update.status,
            note: update.note,
            updatedAt: update.updatedAt,
            author: update.author
          });
        });
      }
    });

    // Sort by most recent update first
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [issues, currentUser?.email]);

  // Calculate unread items
  const unreadCount = React.useMemo(() => {
    return notifications.filter((notif) => !readNotifications.includes(notif.id)).length;
  }, [notifications, readNotifications]);

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((notif) => notif.id);
    saveReadNotifications(allIds);
  };

  const handleNotificationClick = (notifId: string, issueId: string) => {
    // Add to read list if not already there
    if (!readNotifications.includes(notifId)) {
      saveReadNotifications([...readNotifications, notifId]);
    }
    setIsOpen(false);
    // Select issue and navigate to tracker
    onSelectIssue(issueId);
    onViewChange("tracker");
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      if (diffMs < 0) return "Just now";
      
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (err) {
      return "Recent";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-500";
      case "Verifying":
        return "bg-blue-500";
      case "In Progress":
        return "bg-indigo-500";
      case "Resolved":
        return "bg-emerald-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case "Pending":
        return "Report Filed";
      case "Verifying":
        return "Verifying Info";
      case "In Progress":
        return "Dispatch Active";
      case "Resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  return (
    <div className="relative inline-block text-left" id="notification-bell-container">
      {/* Click outside overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 cursor-default" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-800/80 dark:border-slate-700 dark:text-white"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#0F172A] dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
        }`}
        title="Recent Status Updates"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? "animate-wiggle" : ""}`} />
        
        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span 
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] bg-emerald-500 text-white rounded-full font-mono font-black border border-white dark:border-[#0F172A] shadow-xs"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div 
          id="notification-bell-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl z-40 p-0 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150"
        >
          {/* Dropdown Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-[#0B0F19]/50">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                Status Notifications
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Updates on your reported community hazards
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                id="notification-mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer py-1 px-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No recent updates
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Status changes and municipal logs for your reports will show up here.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !readNotifications.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.issueId)}
                    className={`p-3.5 text-left transition-colors cursor-pointer flex items-start space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                      isUnread 
                        ? "bg-emerald-50/20 dark:bg-emerald-500/5 font-medium border-l-2 border-emerald-500" 
                        : "border-l-2 border-transparent"
                    }`}
                  >
                    {/* Status Dot */}
                    <div className="mt-1 shrink-0">
                      <span className={`flex h-2.5 w-2.5 rounded-full ${getStatusDotColor(notif.status)}`} />
                    </div>

                    {/* Notification Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between space-x-1">
                        <span className="text-[9px] uppercase tracking-wider font-mono font-extrabold text-slate-400 dark:text-slate-500">
                          {getStatusLabelText(notif.status)}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center space-x-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatTimeAgo(notif.updatedAt)}</span>
                        </span>
                      </div>

                      <h5 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {notif.issueTitle}
                      </h5>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.note}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 dark:text-slate-500 font-sans">
                        <span>Logged by {notif.author}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                          <span>View tracker</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>

                    {/* Unread dot indicator on right */}
                    {isUnread && (
                      <div className="mt-1.5 shrink-0 self-center">
                        <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View Tracker Action */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0B0F19]/50">
              <button
                id="notification-view-tracker-footer-btn"
                onClick={() => {
                  setIsOpen(false);
                  onViewChange("tracker");
                }}
                className="w-full text-center py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Navigate to Tracker View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
