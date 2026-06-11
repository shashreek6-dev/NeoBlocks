import { useState, useMemo } from "react";
import { UserProfile, ScoreRecord } from "../types";
import { 
  Trophy, 
  Search, 
  SlidersHorizontal, 
  Users, 
  UserCheck, 
  Zap, 
  Trash2, 
  Flame, 
  Globe2, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LeaderboardSectionProps {
  currentProfile: UserProfile;
  allProfiles: UserProfile[];
  highScoresList: ScoreRecord[];
  globalScoresList: ScoreRecord[];
  onClearScores: () => void;
  onClearGlobalScores?: () => void;
  onSelectProfile: (username: string) => void;
  onBack?: () => void;
}

const AVATARS = [
  { id: "avatar1", emoji: "👾", name: "Invader" },
  { id: "avatar2", emoji: "🤖", name: "Cyber" },
  { id: "avatar3", emoji: "🧙", name: "Mage" },
  { id: "avatar4", emoji: "🚀", name: "Nomad" },
  { id: "avatar5", emoji: "💎", name: "Chrono" },
  { id: "avatar6", emoji: "⚡", name: "Volt" },
];

const REGIONS: Record<string, string> = {
  PixelQueen: "🇺🇸 US-EAST",
  Elena_K: "🇩🇪 EU-WEST",
  BoardMaster_X: "🇯🇵 JP-APAC",
  Marcus_V: "🇨🇦 CA-NORTH",
  Cap_JSTL: "🇬🇧 UK-WEST",
  TomcatWrangler: "🇫🇷 EU-WEST",
  EclipseGuru: "🇮🇳 IN-ASIA",
  Koji_S: "🇯🇵 JP-APAC",
  JSTL_Ruler: "🇺🇸 US-WEST",
  ServletSpecialist: "🇮🇳 IN-ASIA",
  Tomcat_AI_Bot: "🤖 CLOUD-NODE",
};

export default function LeaderboardSection({
  currentProfile,
  allProfiles,
  highScoresList,
  globalScoresList,
  onClearScores,
  onClearGlobalScores,
  onSelectProfile,
  onBack,
}: LeaderboardSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"global" | "local" | "player_stats">("global");
  const [sortBy, setSortBy] = useState<"score" | "clears" | "games">("score");
  const [simulatedMatchToast, setSimulatedMatchToast] = useState<string | null>(null);

  // Helper to get avatar emoji
  const getAvatarEmoji = (username: string, isAi?: boolean) => {
    const profile = allProfiles.find((p) => p.username === username);
    if (profile) {
      const av = AVATARS.find((a) => a.id === profile.avatar);
      if (av) return av.emoji;
    }
    if (isAi) return "🤖";
    if (username.includes("AI_Bot")) return "🤖";
    return "👾";
  };

  // Helper to get region flag/text
  const getRegionTag = (username: string) => {
    return REGIONS[username] || "🌐 GLOB-NET";
  };

  // 🏆 Compute Podium layout (Top 3 for Global rankings)
  const podiumData = useMemo(() => {
    if (globalScoresList.length === 0) return [null, null, null];
    // Sort global scores descending
    const sorted = [...globalScoresList].sort((a, b) => b.score - a.score);
    const first = sorted[0] ? { ...sorted[0], rank: 1 } : null;
    const second = sorted[1] ? { ...sorted[1], rank: 2 } : null;
    const third = sorted[2] ? { ...sorted[2], rank: 3 } : null;

    // Fixed mapping with null safety to ensure left pedestal is second, center is first, right is third
    return [second, first, third];
  }, [globalScoresList]);

  // Combined searched and sorted statistics list
  const filteredGlobalList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = [...globalScoresList];

    if (query) {
      result = result.filter(
        (item) =>
          item.username.toLowerCase().includes(query) ||
          getRegionTag(item.username).toLowerCase().includes(query)
      );
    }

    if (sortBy === "score") {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === "clears") {
      result.sort((a, b) => b.linesCleared - a.linesCleared);
    }
    return result;
  }, [globalScoresList, searchQuery, sortBy]);

  const filteredLocalList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = [...highScoresList];

    if (query) {
      result = result.filter((item) => item.username.toLowerCase().includes(query));
    }

    if (sortBy === "score") {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === "clears") {
      result.sort((a, b) => b.linesCleared - a.linesCleared);
    }
    return result;
  }, [highScoresList, searchQuery, sortBy]);

  // Calculate cumulative profiles statistics
  const playerStatsList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = [...allProfiles];

    if (query) {
      result = result.filter((p) => p.username.toLowerCase().includes(query));
    }

    if (sortBy === "score") {
      result.sort((a, b) => b.highScore - a.highScore);
    } else if (sortBy === "clears") {
      result.sort((a, b) => b.totalLinesCleared - a.totalLinesCleared);
    } else if (sortBy === "games") {
      result.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    }
    return result;
  }, [allProfiles, searchQuery, sortBy]);

  // Statistics summaries
  const targetBeater = useMemo(() => {
    if (globalScoresList.length === 0) return null;
    const sorted = [...globalScoresList].sort((a, b) => b.score - a.score);
    
    // Find who is right above current profile's high score
    const targetPlayer = sorted.reverse().find((item) => item.score > currentProfile.highScore);
    if (targetPlayer) {
      return {
        username: targetPlayer.username,
        score: targetPlayer.score,
        diff: targetPlayer.score - currentProfile.highScore,
      };
    }
    return null;
  }, [globalScoresList, currentProfile.highScore]);

  // Trigger simulated rankings shift (arcade style simulator)
  const triggerSimShowdown = () => {
    if (!onClearGlobalScores) return;
    const competitors = ["Marcus_V", "PixelQueen", "Cap_JSTL", "Elena_K", "TomcatWrangler"];
    const luckyCompetitor = competitors[Math.floor(Math.random() * competitors.length)];
    const scoreJump = Math.floor(Math.random() * 250) + 50;

    const cachedGlobalScores = localStorage.getItem("block_game_global_scores");
    if (cachedGlobalScores) {
      try {
        const parsed: ScoreRecord[] = JSON.parse(cachedGlobalScores);
        const updated = parsed.map((item) => {
          if (item.username === luckyCompetitor) {
            return {
              ...item,
              score: item.score + scoreJump,
              linesCleared: item.linesCleared + Math.floor(scoreJump / 40),
              date: "Today",
            };
          }
          return item;
        });
        localStorage.setItem("block_game_global_scores", JSON.stringify(updated));
        setSimulatedMatchToast(`${luckyCompetitor} just achieved a big score! Standing updated by +${scoreJump} pts.`);
        setTimeout(() => setSimulatedMatchToast(null), 3500);
        // Refresh component state by reloading page state
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-4 w-full max-w-[430px] mx-auto pb-6 text-white">
      
      {/* simulated toast challenge notifier */}
      <AnimatePresence>
        {simulatedMatchToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-4 left-4 z-50 bg-indigo-955 text-white px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-[11px] font-sans border border-indigo-500/30"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Simulation Radar Complete!</p>
              <p className="text-white opacity-90 mt-0.5">{simulatedMatchToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Wrapper */}
      <div className="bg-[#0d1117] border-[6px] border-[#00f0ff] rounded-[36px] shadow-2xl p-4 sm:p-5 relative overflow-hidden select-none text-white shadow-[0_0_20px_rgba(0,240,255,0.25)]">
        
        {/* Modern decorative backgrounds */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:16px_16px] opacity-70 pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00f0ff]/10 rounded-full filter blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#ff007f]/10 rounded-full filter blur-2xl pointer-events-none" />

        {/* Top Header Row with quick summary */}
        <div className="flex flex-col gap-3.5 border-b-2 border-white/10 pb-4 z-10 relative">
          <div className="flex gap-2.5 items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-2xl bg-[#12131a] hover:bg-[#1a1c29] text-[#00f0ff] border-2 border-[#00f0ff]/30 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0"
                title="Back to Arcade"
              >
                <ArrowLeft className="w-5 h-5 text-current" strokeWidth={3} />
              </button>
            )}
            <div className="space-y-0.5 min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-sans italic text-[#00f0ff] tracking-wide flex items-center gap-1.5 shrink-0">
                <Trophy className="w-5 h-5 text-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.22)] shrink-0" strokeWidth={2.5} />
                NEO STANDINGS
              </h2>
              <p className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-white/60 mt-0.5">
                Track global rankings and offline sessions.
              </p>
            </div>
          </div>

          {/* Core Navigation Sub Tabs */}
          <div className="flex bg-[#12131a] border border-[#00f0ff]/10 p-1 rounded-2xl w-full shrink-0 gap-1.5 shadow-inner">
            <button
              onClick={() => { setActiveTab("global"); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-xl text-[9px] font-sans tracking-wide transition duration-150 flex items-center justify-center gap-1 cursor-pointer font-bold ${
                activeTab === "global"
                  ? "bg-[#00f0ff] text-[#080a0f] shadow-md shadow-[#00f0ff]/30"
                  : "text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              GLOBAL LIVE
            </button>
            <button
              onClick={() => { setActiveTab("local"); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-xl text-[9px] font-sans tracking-wide transition duration-150 flex items-center justify-center gap-1 cursor-pointer font-bold ${
                activeTab === "local"
                  ? "bg-[#00f0ff] text-[#080a0f] shadow-md shadow-[#00f0ff]/30"
                  : "text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              LOCAL HISTORY
            </button>
            <button
              onClick={() => { setActiveTab("player_stats"); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-xl text-[9px] font-sans tracking-wide transition duration-150 flex items-center justify-center gap-1 cursor-pointer font-bold ${
                activeTab === "player_stats"
                  ? "bg-[#00f0ff] text-[#080a0f] shadow-md shadow-[#00f0ff]/30"
                  : "text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              STATS DECK
            </button>
          </div>
        </div>

        {/* Motivations & Challenger Widget (2-Column Bento Grid) */}
        <div className="grid grid-cols-2 gap-2 mb-4 z-10 relative">
          {/* 🎯 Beat Target Card */}
          <div className="bg-[#12131a] border border-[#ff007f]/20 rounded-2xl p-2.5 flex items-center gap-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#a020f0] to-[#ff007b] text-white flex items-center justify-center text-sm shadow-md shrink-0 font-sans font-bold">
              ⚡
            </div>
            <div className="space-y-0.5 overflow-hidden min-w-0">
              <span className="text-[8px] uppercase tracking-wider text-[#00f0ff] font-mono block font-bold leading-none truncate">Target</span>
              {targetBeater ? (
                <>
                  <p className="text-[10px] font-sans text-white truncate font-bold leading-tight">
                    {targetBeater.username}
                  </p>
                  <p className="text-[8px] font-mono text-[#ff007b] leading-none truncate font-bold">
                    Need <strong className="text-[#ff6b00] font-bold">+{targetBeater.diff}p</strong>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-sans text-white font-bold leading-tight">Rank #1</p>
                  <p className="text-[8px] font-mono text-[#00ff88] leading-none font-bold">Leading!</p>
                </>
              )}
            </div>
          </div>

          {/* 🌟 Player Personal Standing Card */}
          <div className="bg-[#12131a] border border-[#00f0ff]/20 rounded-2xl p-2.5 flex items-center gap-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#ff6b00] to-orange-600 text-white flex items-center justify-center text-sm shadow-md shrink-0 font-sans font-bold">
              👑
            </div>
            <div className="space-y-0.5 overflow-hidden min-w-0">
              <span className="text-[8px] uppercase tracking-wider text-[#ff6b00] font-mono block font-bold leading-none truncate">Your Best</span>
              <p className="text-[10px] font-sans text-white truncate font-bold leading-tight">
                {currentProfile.username}
              </p>
              <p className="text-[8px] font-mono text-[#00f0ff] leading-none truncate font-bold">
                {currentProfile.highScore} pts
              </p>
            </div>
          </div>

          {/* 🤖 Dynamic Arcade Simulator Panel (Col Span 2) */}
          <div className="bg-[#12131a] border border-[#00ff88]/20 rounded-2xl p-2.5 col-span-2 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#00ff88] to-emerald-700 text-white flex items-center justify-center text-sm shrink-0 font-bold shadow-sm">
                👾
              </div>
              <div className="space-y-0.5 overflow-hidden min-w-0">
                <span className="text-[8px] uppercase tracking-wider text-[#00ff88] font-mono block font-bold leading-none">Simulator Core</span>
                <p className="text-[10px] font-serif text-white/80 truncate font-medium leading-tight">Arcade Net Engine</p>
              </div>
            </div>
            <button
              onClick={triggerSimShowdown}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-[9px] px-2.5 py-1.5 rounded-lg border-0 font-sans transition active:scale-95 shadow-sm font-bold cursor-pointer inline-flex items-center gap-1 shrink-0 uppercase tracking-tight"
              title="Add mock update to other players"
            >
              Simulate Match
            </button>
          </div>
        </div>

        {/* 🏆 podium section - only rendered on primary Global standings (Highly optimized and scaled down) */}
        {activeTab === "global" && (podiumData[0] || podiumData[1] || podiumData[2]) && searchQuery === "" && (
          <div className="pt-1 pb-4 flex justify-center items-end gap-2 max-w-xs mx-auto z-10 relative">
            
            {/* 🥈 Second Place (Left Pedestal) */}
            {podiumData[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex-1 flex flex-col items-center max-w-[90px] group cursor-pointer"
                onClick={() => onSelectProfile(podiumData[0].username)}
              >
                <span className="text-xl mb-0.5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-200 group-hover:scale-110 font-sans">
                  🥈
                </span>
                <div className="w-9 h-9 rounded-full bg-[#12131a] border-2 border-white/20 flex items-center justify-center text-xl shadow-md transition-transform duration-205 group-hover:scale-105">
                  {getAvatarEmoji(podiumData[0].username, podiumData[0].isAi)}
                </div>
                <p className="text-[10px] font-sans text-white/80 truncate max-w-full text-center mt-1 leading-tight font-bold">
                  {podiumData[0].username}
                </p>
                <p className="text-[9px] font-mono text-[#00f0ff] font-extrabold leading-none">{podiumData[0].score}</p>
                {/* 🥈 Silver Pedestal */}
                <div className="w-full h-10 mt-1 bg-[#12131a] border-t-2 border-[#00f0ff] rounded-t-lg shadow-xs flex items-center justify-center">
                  <span className="font-mono font-black text-[#00f0ff] text-sm">2</span>
                </div>
              </motion.div>
            )}

            {/* 🥇 First Place (Center High Pedestal) */}
            {podiumData[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="flex-1 flex flex-col items-center max-w-[100px] group cursor-pointer relative z-20"
                onClick={() => onSelectProfile(podiumData[1].username)}
              >
                {/* Tilted Floating crown over 1st place avatar */}
                <div className="absolute top-[-24px] left-[50%] -translate-x-1/2 -rotate-[15deg] pointer-events-none select-none">
                  <svg className="w-6 h-6 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.25)]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 44 L52 44" stroke="#ffb74d" strokeWidth="4" strokeLinecap="round" />
                     <path d="M12 44 L16 22 L26 32 L32 12 L38 32 L48 22 L52 44 Z" fill="#ffd54f" stroke="#f57c00" strokeWidth="2" strokeLinejoin="round" />
                     <circle cx="16" cy="22" r="3" fill="#ff1744" />
                     <circle cx="32" cy="12" r="3" fill="#f59e0b" />
                     <circle cx="48" cy="22" r="3" fill="#0284c7" />
                  </svg>
                </div>
                <span className="text-2xl mb-0.5 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 group-hover:scale-110 font-sans">
                  🥇
                </span>
                <div className="w-11 h-11 rounded-full bg-[#12131a] border-2 border-amber-400 flex items-center justify-center text-2xl shadow-lg ring-2 ring-amber-400/20 transition-transform duration-205 group-hover:scale-105">
                  {getAvatarEmoji(podiumData[1].username, podiumData[1].isAi)}
                </div>
                <p className="text-[11px] font-sans text-white truncate max-w-full text-center mt-1 leading-tight font-black">
                  {podiumData[1].username}
                </p>
                <p className="text-[10px] font-mono text-[#ff6b00] font-extrabold leading-none">{podiumData[1].score}</p>
                {/* 🥇 Gold Pedestal */}
                <div className="w-full h-14 mt-1 bg-[#12131a] border-t-[3px] border-amber-400 rounded-t-xl shadow-xs flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#ffd54f]/10 to-transparent animate-pulse" />
                  <span className="font-mono font-black text-amber-400 text-xs drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]">1</span>
                </div>
              </motion.div>
            )}

            {/* 🥉 Third Place (Right Pedestal) */}
            {podiumData[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex-1 flex flex-col items-center max-w-[90px] group cursor-pointer"
                onClick={() => onSelectProfile(podiumData[2].username)}
              >
                <span className="text-xl mb-0.5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-200 group-hover:scale-110 font-sans">
                  🥉
                </span>
                <div className="w-9 h-9 rounded-full bg-[#12131a] border-2 border-[#ff6b00]/40 flex items-center justify-center text-xl shadow-md transition-transform duration-205 group-hover:scale-105">
                  {getAvatarEmoji(podiumData[2].username, podiumData[2].isAi)}
                </div>
                <p className="text-[10px] font-sans text-white/85 truncate max-w-full text-center mt-1 leading-tight font-bold">
                  {podiumData[2].username}
                </p>
                <p className="text-[9px] font-mono text-[#ff6b00] font-extrabold leading-none">{podiumData[2].score}</p>
                {/* 🥉 Bronze Pedestal */}
                <div className="w-full h-8 mt-1 bg-[#12131a] border-t-2 border-[#ff6b00]/60 rounded-t-lg shadow-xs flex items-center justify-center">
                  <span className="font-mono font-black text-[#ff6b00] text-sm">3</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Search, Filter & sorting panel controllers row */}
        <div className="bg-[#12131a] border border-[#00f0ff]/10 p-2.5 rounded-2xl flex flex-col gap-2 mb-4 z-10 relative shadow-xs">
          
          {/* Search items bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f0ff]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080a0f] border border-[#00f0ff]/20 rounded-xl pl-9 pr-3 py-1.5 text-[11px] placeholder-white/20 text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/30 transition font-sans"
              placeholder={
                activeTab === "global" 
                  ? "Search global players..." 
                  : activeTab === "local" 
                  ? "Search offline history..." 
                  : "Search profiles..."
              }
            />
          </div>

          {/* Quick Metrics controller filters */}
          <div className="flex items-center gap-2 w-full overflow-x-auto py-1">
            <span className="text-[8px] uppercase font-mono tracking-wider text-white/50 font-bold flex items-center gap-0.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00f0ff]" />
              Criteria:
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setSortBy("score")}
                className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-mono tracking-wider transition shrink-0 cursor-pointer font-bold border ${
                  sortBy === "score"
                    ? "bg-[#00f0ff] text-[#0c0d14] border-transparent shadow-xs"
                    : "bg-[#080a0f] border-[#00f0ff]/15 text-white/80"
                }`}
              >
                Score
              </button>
              <button
                onClick={() => setSortBy("clears")}
                className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-mono tracking-wider transition shrink-0 cursor-pointer font-bold border ${
                  sortBy === "clears"
                    ? "bg-[#00f0ff] text-[#0c0d14] border-transparent shadow-xs"
                    : "bg-[#080a0f] border-[#00f0ff]/15 text-white/80"
                }`}
              >
                Clears
              </button>
              
              {activeTab === "player_stats" && (
                <button
                  onClick={() => setSortBy("games")}
                  className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-mono tracking-wider transition shrink-0 cursor-pointer font-bold border ${
                    sortBy === "games"
                      ? "bg-[#00f0ff] text-[#0c0d14] border-transparent shadow-xs"
                      : "bg-[#080a0f] border-[#00f0ff]/15 text-white/80"
                  }`}
                >
                  Games
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List Content renders (Slim design) */}
        <div className="space-y-2 z-10 relative max-h-[300px] overflow-y-auto pr-1">
          {activeTab === "global" ? (
            filteredGlobalList.length === 0 ? (
              <div className="text-center py-8 text-sky-800/40 italic text-xs font-serif">
                No matching players found holding standings.
              </div>
            ) : (
              filteredGlobalList.map((entry, idx) => {
                const isCurrentUser = entry.username === currentProfile.username;
                const avatarIcon = getAvatarEmoji(entry.username, entry.isAi);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onSelectProfile(entry.username)}
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition duration-200 shadow-xs cursor-pointer ${
                      isCurrentUser
                        ? "bg-[#ea00d9]/10 border-[#ea00d9] ring-2 ring-[#ea00d9]/30"
                        : "bg-[#080a0f] border-[#00f0ff]/10 hover:border-[#00f0ff]/40 text-white hover:bg-[#00f0ff]/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 font-mono text-[9px] text-center shrink-0 ${idx < 3 ? 'text-amber-500 font-bold text-xs' : 'text-white/30'}`}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-[#12131a] border border-[#00f0ff]/20 flex items-center justify-center text-sm shadow-xs shrink-0 font-sans">
                        {isCurrentUser ? "⭐" : avatarIcon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-sans text-white flex items-center gap-1.5 font-bold leading-tight truncate">
                          <span className="truncate max-w-[95px] sm:max-w-[130px]">
                            {entry.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[7px] bg-[#00f0ff] text-[#080a0f] px-1.5 py-0.5 rounded font-mono font-black shrink-0 leading-none">YOU</span>
                          )}
                          {entry.isAi && (
                            <span className="text-[7px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-mono shrink-0 leading-none">AI</span>
                          )}
                        </p>
                        <p className="text-[8px] font-mono text-[#00f0ff]/40 flex items-center gap-1.5 mt-0.5 truncate leading-none">
                          <span>{getRegionTag(entry.username)}</span>
                          <span className="opacity-30">•</span>
                          <span>{entry.date}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-2 shrink-0">
                      <div className="space-y-0.5">
                        <span className="text-sm font-mono text-[#00f0ff] block font-black leading-none">{entry.score}</span>
                        <span className="text-[8px] font-mono text-white/40 block leading-none font-bold">Clears: {entry.linesCleared}</span>
                      </div>
                      <ChevronRightHelper />
                    </div>
                  </motion.div>
                );
              })
            )
          ) : activeTab === "local" ? (
            filteredLocalList.length === 0 ? (
              <div className="text-center py-8 text-white/40 italic text-xs font-mono space-y-2">
                <p>No offline sessions found.</p>
                <p className="text-[10px] text-[#00f0ff]/70 leading-relaxed max-w-[240px] mx-auto font-medium">
                  Complete matches on the board to register records!
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center pb-1.5 border-b border-white/10 mb-1">
                  <span className="text-[8px] font-mono uppercase text-white/50 font-bold">Sessions: {filteredLocalList.length}</span>
                  <button
                    onClick={onClearScores}
                    className="text-[8px] font-sans text-red-500 hover:text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/30 cursor-pointer font-bold transition uppercase tracking-wide flex items-center gap-1"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Purge Local
                  </button>
                </div>

                {filteredLocalList.map((entry, idx) => {
                  const avatarIcon = getAvatarEmoji(entry.username);
                  const isCurrent = entry.username.includes(currentProfile.username);

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex justify-between items-center p-2.5 rounded-xl border transition duration-200 shadow-xs ${
                        isCurrent 
                          ? "bg-[#ea00d9]/10 border-[#ea00d9] text-white"
                          : "bg-[#080a0f] border-[#00f0ff]/10 text-white hover:border-[#00f0ff]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[10px] text-white/40 w-5 text-center shrink-0 font-bold">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[#12131a] border border-[#00f0ff]/20 flex items-center justify-center text-sm shadow-xs shrink-0 font-sans">
                          {avatarIcon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-sans text-white font-bold leading-tight truncate max-w-[100px] sm:max-w-[140px]">
                            {entry.username}
                          </p>
                          <p className="text-[8px] font-mono text-[#00f0ff]/40 leading-none mt-0.5">{entry.date}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono text-[#00f0ff] block font-black leading-none">{entry.score}</span>
                        <span className="text-[8px] font-mono text-white/40 block leading-none font-bold">Clears: {entry.linesCleared}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )
          ) : (
            /* Players Cumulative database stats tab rendering */
            playerStatsList.length === 0 ? (
              <div className="text-center py-8 text-white/40 italic text-xs font-mono">
                No matching players inside database registries.
              </div>
            ) : (
              playerStatsList.map((p, idx) => {
                const isActive = p.username === currentProfile.username;
                const av = AVATARS.find((a) => a.id === p.avatar) || AVATARS[0];

                return (
                  <motion.div
                    key={p.username}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onSelectProfile(p.username)}
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition duration-200 shadow-xs cursor-pointer ${
                      isActive 
                        ? "bg-[#ea00d9]/10 border-[#ea00d9] ring-2 ring-[#ea00d9]/30 text-white"
                        : "bg-[#080a0f] border-[#00f0ff]/10 hover:border-[#00f0ff]/40 text-white hover:bg-[#00f0ff]/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-white/40 w-5 text-center shrink-0 font-bold">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-[#12131a] border border-[#00f0ff]/20 flex items-center justify-center text-sm shadow-xs shrink-0 font-sans">
                        {isActive ? "⭐" : av.emoji}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-sans text-white font-bold flex items-center gap-1.5 leading-tight truncate">
                          <span className="truncate max-w-[100px] sm:max-w-[145px]">
                            {p.username}
                          </span>
                          {isActive && (
                            <span className="text-[7px] bg-[#00f0ff] text-[#080a0f] px-1.5 py-0.5 rounded font-mono font-black shrink-0 leading-none">YOU</span>
                          )}
                        </h5>
                        <p className="text-[8px] font-sans text-[#00f0ff]/65 mt-0.5 italic max-w-[140px] truncate leading-none">
                          "{p.bio || "No motto set."}"
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2 shrink-0">
                      <div className="flex gap-2.5 pr-1 shrink-0">
                        <div className="text-center">
                          <span className="block text-[7px] font-mono uppercase text-[#00f0ff]/60 leading-none">High</span>
                          <span className="text-[11px] font-mono font-bold text-[#ff007f] leading-normal">{p.highScore}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[7px] font-mono uppercase text-white/40 leading-none font-bold">Games</span>
                          <span className="text-[11px] font-mono text-[#00f0ff] leading-normal">{p.gamesPlayed}</span>
                        </div>
                      </div>
                      <ChevronRightHelper />
                    </div>
                  </motion.div>
                );
              })
            )
          )
        }
        </div>

        {/* Live Standings metadata indicator on bottom */}
        <div className="mt-4 pt-3 border-t border-[#00f0ff]/20 flex justify-between items-center gap-2 text-[8px] text-[#00f0ff]/40 font-mono z-10 relative">
          <div className="flex items-center gap-1 truncate font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">ECC-2026 Sandbox Verified</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-bold text-emerald-500">
            <span>CLOCK ACTIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// Minimal helpers
function ChevronRightHelper() {
  return (
    <svg className="w-3.5 h-3.5 text-[#00f0ff] opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}
