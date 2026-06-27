import React from "react";
import { 
  Trophy, 
  Award, 
  Compass, 
  Shield, 
  CheckCircle, 
  Flag, 
  Sparkles, 
  Info, 
  TrendingUp, 
  Medal,
  Lock,
  Check
} from "lucide-react";
import { UserProfile, Badge } from "../types";
import { motion } from "motion/react";

interface LeaderboardProps {
  currentUserEmail: string;
  onFetchLeaderboard: () => Promise<{ leaderboard: UserProfile[]; badgesList: Badge[] }>;
}

export default function Leaderboard({ currentUserEmail, onFetchLeaderboard }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = React.useState<UserProfile[]>([]);
  const [badgesList, setBadgesList] = React.useState<Badge[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadLeaderboardData = async () => {
      try {
        const data = await onFetchLeaderboard();
        setLeaderboard(data.leaderboard);
        setBadgesList(data.badgesList);
      } catch (err) {
        console.error("Failed to load leaderboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboardData();
  }, []);

  const currentUser = leaderboard.find(u => u.email === currentUserEmail.toLowerCase());

  // Match icon string to Lucide component
  const getBadgeIcon = (iconStr: string) => {
    switch (iconStr) {
      case "Compass": return Compass;
      case "Shield": return Shield;
      case "CheckCircle": return CheckCircle;
      case "Award": return Award;
      case "Flag": return Flag;
      case "Sparkles": return Sparkles;
      case "Info": return Info;
      case "TrendingUp": return TrendingUp;
      default: return Medal;
    }
  };

  return (
    <div id="leaderboard-layout" className="space-y-6">
      
      {/* Overview stats for logged-in citizen */}
      {currentUser && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl border border-emerald-400/20 shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 shrink-0">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-100">Your Citizen Reputation</span>
              <h3 className="text-xl font-bold font-sans tracking-tight">{currentUser.name}</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Status: <strong className="font-semibold text-white">{currentUser.isGovernment ? "Official Administrator" : "Active Citizen"}</strong>
              </p>
            </div>
          </div>

          <div className="flex space-x-6">
            <div className="text-center sm:text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-100 block">Total Points</span>
              <span className="text-2xl font-mono font-black text-white">{currentUser.points} pts</span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-100 block">Unlocked Badges</span>
              <span className="text-2xl font-mono font-black text-white">{currentUser.badges.length}/{badgesList.length || 8}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Splits: Left Leaderboard table, Right Badge specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Leaderboard Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-lg">District Leaderboard</h3>
              <p className="text-xs text-slate-500">Top reporters and safety validators of the neighborhood</p>
            </div>
            <Medal className="w-5 h-5 text-slate-400" />
          </div>

          {loading ? (
            <div className="space-y-3 py-6 animate-pulse">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="w-full h-12 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-2.5 pb-2">Rank</th>
                    <th className="py-2.5 pb-2">Citizen Reporter</th>
                    <th className="py-2.5 pb-2 text-center">Fyled Logs</th>
                    <th className="py-2.5 pb-2 text-center">Upvotes Given</th>
                    <th className="py-2.5 pb-2 text-right">Rep Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {leaderboard.map((user, idx) => {
                    const isSelf = user.email === currentUserEmail.toLowerCase();
                    return (
                      <tr 
                        key={user.email} 
                        id={`leaderboard-row-${user.email}`}
                        className={`hover:bg-slate-50 transition-colors ${isSelf ? "bg-emerald-50/20 font-semibold" : ""}`}
                      >
                        {/* Position */}
                        <td className="py-3 font-mono text-slate-400 font-bold">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </td>
                        {/* Name/Email */}
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <p className="text-slate-900 font-semibold">{user.name}</p>
                                <div className="flex items-center -space-x-0.5 bg-slate-50 border border-slate-100 rounded-md px-1 py-0.5">
                                  {user.badges.map(bId => {
                                    const matchedBadge = badgesList.find(b => b.id === bId);
                                    if (!matchedBadge) return null;
                                    const emoji = matchedBadge.name.split(" ")[0];
                                    return (
                                      <span key={bId} title={matchedBadge.name} className="text-xs select-none cursor-help hover:scale-130 transition-transform duration-100">
                                        {emoji}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            {isSelf && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono text-[9px] shrink-0">You</span>}
                          </div>
                        </td>
                        {/* Filed */}
                        <td className="py-3 text-center font-mono text-slate-600">{user.reportedCount}</td>
                        {/* Verified */}
                        <td className="py-3 text-center font-mono text-slate-600">{user.verifiedCount}</td>
                        {/* Score */}
                        <td className="py-3 text-right font-mono font-bold text-slate-900">{user.points} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Badges Showcase & Rules */}
        <div className="space-y-6">
          
          {/* Badge Grid card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-slate-900 text-lg">Civic Sense Badges</h3>
            <p className="text-xs text-slate-500">Earn reputation badges as you actively clean and safeguard your town.</p>

            <div className="space-y-3.5">
              {badgesList.map((badge, index) => {
                const IconComponent = getBadgeIcon(badge.icon);
                const isUnlocked = currentUser?.badges.includes(badge.id) || false;

                return (
                  <motion.div 
                    key={badge.id} 
                    id={`badge-spec-${badge.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 100, 
                      damping: 15,
                      delay: Math.min(index * 0.05, 0.4)
                    }}
                    whileHover={isUnlocked ? { scale: 1.03, y: -2 } : { scale: 1.01 }}
                    className={`p-3 border rounded-xl flex items-start space-x-3 transition-all ${
                      isUnlocked 
                        ? `${badge.color} shadow-sm ring-1 ring-emerald-500/10` 
                        : "bg-slate-50 border-slate-200/80 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                    }`}
                  >
                    {/* Badge Icon circle */}
                    <motion.div 
                      className="p-2.5 rounded-lg bg-white border shrink-0 relative"
                      animate={isUnlocked ? {
                        scale: [1, 1.06, 1],
                      } : {}}
                      transition={isUnlocked ? {
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 3 + (index % 3), // varied staggered pulse
                        ease: "easeInOut"
                      } : {}}
                    >
                      <IconComponent className="w-5 h-5" />
                      {/* Miniature Locked/Unlocked Indicator */}
                      <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white ${
                        isUnlocked ? "bg-emerald-500" : "bg-slate-400"
                      }`}>
                        {isUnlocked ? <Check className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5 text-[8px]" />}
                      </span>
                    </motion.div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold font-sans text-slate-950 flex items-center space-x-1">
                        <span>{badge.name}</span>
                        {isUnlocked && (
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                            className="text-[10px]"
                          >
                            ✨
                          </motion.span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-600 leading-normal">{badge.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Gamification Points Rules */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase font-sans flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Gamified Reputation Math</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Earn citizen rewards automatically based on the quality and impact of your submissions:
            </p>

            <ul className="space-y-2 text-[11px] font-mono list-none pt-1">
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>Filing photographic complaint:</span>
                <span className="text-emerald-400 font-bold">+100 pts</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>AI credibility score &gt;90%:</span>
                <span className="text-emerald-400 font-bold">+50 pts</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>Upvoting/Verifying other logs:</span>
                <span className="text-emerald-400 font-bold">+15 pts</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1">
                <span>Original complaint gets Resolved:</span>
                <span className="text-emerald-400 font-bold">+200 pts</span>
              </li>
            </ul>

            <div className="border-t border-slate-800/80 pt-3 mt-3 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-sans">Achievement Badges Checklist</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-300 font-sans pt-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">📣</span>
                  <span className="text-slate-400">1st Complaint</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🗳️</span>
                  <span className="text-slate-400">3+ Upvotes Given</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🔍</span>
                  <span className="text-slate-400">AI Cred &ge; 90%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🏆</span>
                  <span className="text-slate-400">&ge; 400 XP Score</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🛠️</span>
                  <span className="text-slate-400">Issue Resolved</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🌱</span>
                  <span className="text-slate-400">Eco/Green Log</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">💬</span>
                  <span className="text-slate-400">AI Bot Chat</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs">🐕</span>
                  <span className="text-slate-400">3+ Filed Reports</span>
                </div>
              </div>
            </div>

            <span className="text-[9px] text-slate-500 block leading-tight font-sans">
              * Note: Filing duplicate, blurred, or fraudulent complaints flags your account and locks leaderboard rankings.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
