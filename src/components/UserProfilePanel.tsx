import { useState, useEffect, FormEvent } from "react";
import { UserProfile, ScoreRecord } from "../types";
import { User, Trophy, Award, Trash, ChevronRight, Sparkles, Sliders, Info, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface UserProfilePanelProps {
  currentProfile: UserProfile;
  allProfiles: UserProfile[];
  highScoresList: ScoreRecord[];
  globalScoresList: ScoreRecord[];
  onUpdateProfile: (username: string, bio: string, avatar: string) => void;
  onSelectProfile: (username: string) => void;
  onClearScores: () => void;
  onCreateProfile: (username: string) => void;
  onClearGlobalScores?: () => void;
  initialTab?: "edit" | "leaderboard" | "accounts";
  hideTabs?: boolean;
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

// Helper to provide a country/region tag based on username for global leaderboard
const getRegionTag = (username: string): string => {
  const regions: Record<string, string> = {
    PixelQueen: "🇺🇸 US-EAST",
    Elena_K: "🇩🇪 EU-WEST",
    BoardMaster_X: "🇯🇵 JP-APAC",
    Marcus_V: "🇨🇦 CA-NORTH",
    Cap_JSTL: "🇬🇧 UK-WEST",
    TomcatWrangler: "🇫🇷 EU-WEST",
    EclipseGuru: "🇮🇳 IN-ASIA",
    Koji_S: "🇯🇵 JP-APAC",
  };
  return regions[username] || "🌐 GLOB-NET";
};

export default function UserProfilePanel({
  currentProfile,
  allProfiles,
  highScoresList,
  globalScoresList,
  onUpdateProfile,
  onSelectProfile,
  onClearScores,
  onCreateProfile,
  onClearGlobalScores,
  initialTab,
  hideTabs,
  onBack,
}: UserProfilePanelProps) {
  const [username, setUsername] = useState(currentProfile.username);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatar, setAvatar] = useState(currentProfile.avatar);
  const [newProfileName, setNewProfileName] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "leaderboard" | "accounts">(initialTab || "edit");
  const [leaderboardMode, setLeaderboardMode] = useState<"local" | "global">("global");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setUsername(currentProfile.username);
    setBio(currentProfile.bio || "");
    setAvatar(currentProfile.avatar);
  }, [currentProfile]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorText("Profile name cannot be blank.");
      return;
    }
    setErrorText("");
    onUpdateProfile(username.trim(), bio.trim(), avatar);
  };

  const handleCreateNew = (e: FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    if (allProfiles.some((p) => p.username.toLowerCase() === newProfileName.trim().toLowerCase())) {
      setErrorText("Profile name already exists.");
      return;
    }
    setErrorText("");
    onCreateProfile(newProfileName.trim());
    setNewProfileName("");
    setActiveTab("accounts");
  };

  const currentAvatarInfo = AVATARS.find((a) => a.id === currentProfile.avatar) || AVATARS[0];

  return (
    <div className="bg-[#0c0d14] border-[6px] border-[#00f0ff]/50 rounded-[36px] overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.2)] flex flex-col h-full h-max-[560px] text-white relative select-none">
      {/* Decorative gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:16px_16px] opacity-70 pointer-events-none" />
      
      {/* Header Profile Summary */}
      <div className="bg-[#12131a] p-4 border-b-2 border-[#00f0ff]/30 flex items-center gap-4 z-10 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-[#080a0f] text-white border-2 border-[#00f0ff]/40 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
            title="Back to Arcade"
          >
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={3} />
          </button>
        )}
        <div className="w-14 h-14 rounded-full border-2 border-[#ff007f] bg-[#12131a] flex items-center justify-center text-3xl shadow-[0_0_12px_rgba(255,0,127,0.3)]">
          {currentAvatarInfo.emoji}
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h4 className="font-sans font-black text-sm text-white tracking-tight">{currentProfile.username}</h4>
            <span className="text-[8px] font-mono tracking-wider text-[#ea00d9] bg-[#ea00d9]/10 px-2 py-0.5 rounded-full border border-[#ea00d9]/30 uppercase font-black">
              LVL {Math.floor(currentProfile.gamesPlayed / 5) + 1}
            </span>
          </div>
          <p className="text-[10px] text-white/60 font-medium italic mt-0.5 truncate max-w-[180px]">
             "{currentProfile.bio || "No profile bio set yet."}"
          </p>
        </div>
      </div>

      {/* Tabs navigation panel */}
      {!hideTabs && (
        <div className="flex border-b border-[#00f0ff]/20 bg-[#12131a] p-1.5 gap-1.5 z-10 relative">
          <button
            onClick={() => { setActiveTab("edit"); setErrorText(""); }}
            className={`flex-1 py-1.5 rounded-xl text-[9px] font-sans font-bold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
              activeTab === "edit"
                ? "bg-[#0b0c13] border border-[#00f0ff]/50 text-[#00f0ff] font-black shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            EDIT
          </button>
          <button
            onClick={() => { setActiveTab("leaderboard"); setErrorText(""); }}
            className={`flex-1 py-1.5 rounded-xl text-[9px] font-sans font-bold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-[#0b0c13] border border-[#00f0ff]/50 text-[#00f0ff] font-black shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            RANKS
          </button>
          <button
            onClick={() => { setActiveTab("accounts"); setErrorText(""); }}
            className={`flex-1 py-1.5 rounded-xl text-[9px] font-sans font-bold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
              activeTab === "accounts"
                ? "bg-[#0b0c13] border border-[#00f0ff]/50 text-[#00f0ff] font-black shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            PLAYERS ({allProfiles.length})
          </button>
        </div>
      )}

      {/* Inner Panels content area */}
      <div className="flex-grow p-4 overflow-y-auto max-h-[380px] text-white bg-[#0c0d14] z-10 relative">
        {errorText && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-2 rounded-xl text-xs leading-relaxed font-mono">
            {errorText}
          </div>
        )}

        {activeTab === "edit" ? (
          <div className="space-y-4">
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[8px] uppercase tracking-widest text-[#00f0ff]/60 mb-1 font-mono font-black">
                  Account Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#00f0ff]/25 rounded-xl py-1.5 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/30 transition font-sans"
                  placeholder="Enter custom username"
                />
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-widest text-[#00f0ff]/60 mb-1 font-mono font-black">
                  Personal Motto
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#00f0ff]/25 rounded-xl py-1.5 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/30 transition font-sans"
                  placeholder="Tell people about yourself..."
                />
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-widest text-[#00f0ff]/60 mb-1.5 font-mono font-black">
                  Choose Game Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatar(av.id)}
                      className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition border cursor-pointer ${
                        avatar === av.id
                          ? "bg-[#ea00d9]/10 border-[#ea00d9] scale-105 shadow-md ring-2 ring-[#ea00d9]/30"
                          : "bg-[#12131a] hover:bg-white/5 border-white/10"
                      }`}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00ff88] hover:brightness-105 text-[#0c0d14] font-sans text-[10px] py-1.8 h-9 rounded-xl active:scale-[0.98] transition duration-150 cursor-pointer shadow-md font-extrabold uppercase tracking-wider border-0"
              >
                Update Profile Context
              </button>
            </form>

            {/* Offline Cumulative Statistics Card */}
            <div className="bg-[#12131a] border border-[#00f0ff]/15 rounded-2xl p-3 mt-4 space-y-2.5">
              <h5 className="text-[9px] uppercase tracking-[0.12em] text-[#00f0ff] flex items-center gap-1.5 font-bold font-mono">
                <Award className="w-4 h-4 text-[#00f0ff]" /> CORE STATS DECK
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[#080a0f] border border-[#00f0ff]/10 rounded-xl text-center shadow-xs">
                  <span className="block text-white/50 text-[8px] uppercase tracking-wider font-mono mb-0.5">Battles</span>
                  <strong className="text-[#00f0ff] text-base font-sans font-extrabold">{currentProfile.gamesPlayed}</strong>
                </div>
                <div className="p-2 bg-[#080a0f] border border-[#00f0ff]/10 rounded-xl text-center shadow-xs">
                  <span className="block text-white/50 text-[8px] uppercase tracking-wider font-mono mb-0.5">Record</span>
                  <strong className="text-[#ff6b00] text-base font-sans font-extrabold">{currentProfile.highScore}</strong>
                </div>
                <div className="p-2 bg-[#080a0f] border border-[#00f0ff]/10 rounded-xl text-center shadow-xs">
                  <span className="block text-white/50 text-[8px] uppercase tracking-wider font-mono mb-0.5">Blocks</span>
                  <strong className="text-white text-base font-sans font-extrabold">{currentProfile.totalBlocksPlaced}</strong>
                </div>
                <div className="p-2 bg-[#080a0f] border border-[#00f0ff]/10 rounded-xl text-center shadow-xs">
                  <span className="block text-white/50 text-[8px] uppercase tracking-wider font-mono mb-0.5">Clears</span>
                  <strong className="text-white text-base font-sans font-extrabold">{currentProfile.totalLinesCleared}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "leaderboard" ? (
          <div className="space-y-3">
            {/* Local vs Global Standings Sub-Tabs */}
            <div className="flex bg-[#12131a] p-1 rounded-xl border border-[#00f0ff]/15">
              <button
                type="button"
                onClick={() => setLeaderboardMode("global")}
                className={`flex-1 py-1 rounded-lg text-[8.5px] uppercase font-sans tracking-tight transition duration-150 flex items-center justify-center gap-1 cursor-pointer font-bold ${
                  leaderboardMode === "global"
                    ? "bg-[#0c0d14] border border-[#00f0ff]/30 text-[#00f0ff] font-extrabold shadow-sm"
                    : "text-white/50 hover:text-white"
                }`}
              >
                🌐 GLOBAL HIGH
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardMode("local")}
                className={`flex-1 py-1 rounded-lg text-[8.5px] uppercase font-sans tracking-tight transition duration-150 flex items-center justify-center gap-1 cursor-pointer font-bold ${
                  leaderboardMode === "local"
                    ? "bg-[#0c0d14] border border-[#00f0ff]/30 text-[#00f0ff] font-extrabold shadow-sm"
                    : "text-white/50 hover:text-white"
                }`}
              >
                💾 LOCAL HISTORY
              </button>
            </div>

            {leaderboardMode === "local" ? (
              <>
                <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                  <span className="text-[8px] uppercase tracking-widest text-[#00f0ff]/60 font-mono font-black">Offline Sessions</span>
                  <button
                    onClick={onClearScores}
                    className="text-[8px] font-sans text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/30 cursor-pointer font-bold uppercase tracking-wide"
                  >
                    <Trash className="w-3 h-3" /> FLUSH LOG
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {highScoresList.length === 0 ? (
                    <div className="text-center py-8 text-white/40 italic text-xs font-mono">
                      No local records recorded yet.
                    </div>
                  ) : (
                    highScoresList.map((entry, idx) => {
                      const entryAvatar = allProfiles.find((p) => p.username === entry.username)?.avatar || "avatar1";
                      const avatarIcon = AVATARS.find((a) => a.id === entryAvatar)?.emoji || "👾";

                      return (
                        <div
                          key={entry.id}
                          className="flex justify-between items-center bg-[#12131a] p-2.5 rounded-xl border border-white/10 hover:border-[#00f0ff]/20 transition duration-200 shadow-xs text-white"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 font-mono text-[10px] text-center ${idx < 3 ? 'text-amber-500 font-bold' : 'text-white/30'}`}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#080a0f] border border-white/10 flex items-center justify-center text-md shadow-xs">
                              {avatarIcon}
                            </div>
                            <div>
                              <p className="text-xs font-sans text-white flex items-center gap-1.5 font-bold">
                                {entry.username}
                                {entry.username === currentProfile.username && (
                                  <span className="text-[7px] bg-[#ea00d9] text-white px-1.5 py-0.5 rounded font-mono font-black leading-none">YOU</span>
                                )}
                              </p>
                              <p className="text-[9px] font-mono text-[#00f0ff]/40 leading-none mt-0.5">{entry.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono text-[#00f0ff] block font-black leading-tight">{entry.score}</span>
                            <span className="text-[8px] font-mono text-white/40 font-bold">Clears: {entry.linesCleared}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                  <span className="text-[8px] uppercase tracking-widest text-[#00f0ff]/60 font-mono font-black">Global World Standings</span>
                  <div className="flex items-center gap-1 text-[8px] text-emerald-500 font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    LIVE NET
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {globalScoresList.length === 0 ? (
                    <div className="text-center py-8 text-white/50 italic text-xs font-mono">
                      No global scores compiled.
                    </div>
                  ) : (
                    globalScoresList.map((entry, idx) => {
                      const isCurrentUser = entry.username === currentProfile.username;
                      const entryAvatar = allProfiles.find((p) => p.username === entry.username)?.avatar || "avatar2";
                      const avatarIcon = AVATARS.find((a) => a.id === entryAvatar)?.emoji || (idx === 0 ? "👑" : "👾");

                      return (
                        <div
                          key={entry.id}
                          className={`flex justify-between items-center p-2.5 rounded-xl border transition duration-200 shadow-xs ${
                            isCurrentUser
                              ? "bg-[#ea00d9]/10 border-[#ea00d9] text-white ring-2 ring-[#ea00d9]/30"
                              : "bg-[#12131a] border-white/10 hover:border-[#00f0ff]/30 text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 font-mono text-[10px] text-center ${idx < 3 ? 'text-amber-500 font-bold text-xs' : 'text-white/30'}`}>
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx + 1).toString().padStart(2, '0')}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#080a0f] border border-white/10 flex items-center justify-center text-md shadow-xs">
                              {isCurrentUser ? "⭐" : avatarIcon}
                            </div>
                            <div>
                              <p className="text-xs font-sans text-white flex items-center gap-1.5 font-bold">
                                {entry.username}
                                {isCurrentUser && (
                                  <span className="text-[7px] bg-[#00f0ff] text-[#080a0f] px-1.5 py-0.5 rounded font-mono font-black leading-none">YOU</span>
                                )}
                                {entry.isAi && (
                                  <span className="text-[7px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-mono font-bold leading-none">AI BOT</span>
                                )}
                              </p>
                              <p className="text-[9px] font-mono text-[#00f0ff]/40 flex items-center gap-1.5 mt-0.5 leading-none">
                                <span>{getRegionTag(entry.username)}</span>
                                <span className="opacity-40">•</span>
                                <span>{entry.date}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono text-[#00f0ff] block font-black leading-tight">{entry.score}</span>
                            <span className="text-[8px] font-mono text-white/40 font-bold">Clears: {entry.linesCleared}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Multi-User dynamic profile picker */
          <div className="space-y-4">
            {/* Create user form */}
            <form onSubmit={handleCreateNew} className="flex gap-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                maxLength={15}
                className="flex-grow bg-[#12131a] border border-[#00f0ff]/25 rounded-xl py-1.5 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/30 focus:border-[#00f0ff] transition font-sans"
                placeholder="New profile name..."
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#00f0ff] to-[#00ff88] hover:brightness-105 border-0 px-4 rounded-xl text-[9px] font-sans text-[#0c0d14] font-extrabold active:scale-95 transition shrink-0 cursor-pointer uppercase tracking-wider h-8"
              >
                CREATE
              </button>
            </form>

            {/* List all registered accounts */}
            <div className="space-y-2">
              <span className="text-[8px] font-mono uppercase tracking-wider text-[#00f0ff]/60 block font-bold">Available Profiles</span>
              {allProfiles.map((p) => {
                const av = AVATARS.find((a) => a.id === p.avatar) || AVATARS[0];
                const isActive = p.username === currentProfile.username;

                return (
                  <button
                    key={p.username}
                    onClick={() => onSelectProfile(p.username)}
                    className={`w-full text-left p-3 rounded-2xl border transition duration-200 flex items-center justify-between group cursor-pointer shadow-xs ${
                      isActive
                        ? "bg-[#ea00d9]/10 border-[#ea00d9] text-white ring-2 ring-[#ea00d9]/30"
                        : "bg-[#12131a] border-white/10 hover:border-[#00f0ff]/20 hover:bg-[#00f0ff]/5 text-white/90"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{av.emoji}</span>
                      <div>
                        <h5 className="text-[12px] font-sans font-bold flex items-center gap-1.5 text-white">
                          {p.username} {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_#00f0ff]" />}
                        </h5>
                        <p className="text-[10px] font-mono text-[#00f0ff]/40">
                          PB: {p.highScore} | {p.gamesPlayed} games
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#00f0ff] group-hover:translate-x-1 transition" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
