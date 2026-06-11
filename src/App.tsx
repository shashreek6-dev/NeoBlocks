import { useState, useEffect } from "react";
import { UserProfile, ScoreRecord, BlockShape, GameMode, MatchState } from "./types";
import { getRandomBlocks } from "./blocks";
import SourceCodeHub from "./components/SourceCodeHub";
import GameBoard from "./components/GameBoard";
import BlockChoices from "./components/BlockChoices";
import UserProfilePanel from "./components/UserProfilePanel";
import LeaderboardSection from "./components/LeaderboardSection";
import OpponentBoard from "./components/OpponentBoard";
import { findBestPlacement } from "./utils/blockSolver";
import { getRandomOpponent, QUEUE_MESSAGES } from "./utils/matchmaker";
import {
  playSelectSound,
  playPlaceSound,
  playClearSound,
  playGameOverSound,
  setVolume,
} from "./utils/audio";
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  BookOpen,
  Terminal,
  Zap,
  HelpCircle,
  Info,
  Radio,
  Swords,
  Timer,
  ShieldAlert,
  RotateCw,
  Settings,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_BOARD_STATE = () =>
  Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

const canDrop = (boardState: (string | null)[][], block: BlockShape): boolean => {
  const currentMatrix = block.matrix;
  const checkRows = currentMatrix.length;
  const checkCols = currentMatrix[0].length;

  for (let r = 0; r <= 8 - checkRows; r++) {
    for (let c = 0; c <= 8 - checkCols; c++) {
      let canFit = true;
      for (let i = 0; i < checkRows; i++) {
        for (let j = 0; j < checkCols; j++) {
          if (currentMatrix[i][j] === 1) {
            if (boardState[r + i][c + j] !== null) {
              canFit = false;
              break;
            }
          }
        }
        if (!canFit) break;
      }
      if (canFit) return true;
    }
  }
  return false;
};

// Secondary helper to see if players/bots have active moves
const checkBotHasMoves = (botBoard: (string | null)[][], botChoices: (BlockShape | null)[]): boolean => {
  const liveBlocks = botChoices.filter((b) => b !== null) as BlockShape[];
  if (liveBlocks.length === 0) return true;

  for (let bIdx = 0; bIdx < liveBlocks.length; bIdx++) {
    if (canDrop(botBoard, liveBlocks[bIdx])) {
      return true;
    }
  }
  return false;
};

const SEED_PROFILES: UserProfile[] = [
  {
    username: "JSTL_Ruler",
    avatar: "avatar1",
    bio: "JSTL, JSP, and Express are standard web core staples!",
    registeredAt: "2026-06-09",
    gamesPlayed: 14,
    highScore: 840,
    totalBlocksPlaced: 420,
    totalLinesCleared: 58,
  },
  {
    username: "EclipseGuru",
    avatar: "avatar5",
    bio: "Debugging servlets in Eclipse workspace efficiently.",
    registeredAt: "2026-06-08",
    gamesPlayed: 25,
    highScore: 1250,
    totalBlocksPlaced: 940,
    totalLinesCleared: 110,
  },
  {
    username: "ServletSpecialist",
    avatar: "avatar2",
    bio: "Java DAO database connectors are highly optimized.",
    registeredAt: "2026-06-09",
    gamesPlayed: 8,
    highScore: 460,
    totalBlocksPlaced: 180,
    totalLinesCleared: 14,
  },
];

const SEED_SCORES: ScoreRecord[] = [
  {
    id: "s_1",
    username: "EclipseGuru",
    score: 1250,
    linesCleared: 22,
    date: "2026-06-08",
  },
  {
    id: "s_2",
    username: "JSTL_Ruler",
    score: 840,
    linesCleared: 15,
    date: "2026-06-09",
  },
  {
    id: "s_3",
    username: "ServletSpecialist",
    score: 460,
    linesCleared: 6,
    date: "2026-06-09",
  },
];

const SEED_GLOBAL_SCORES: ScoreRecord[] = [
  { id: "g_1", username: "PixelQueen", score: 2420, linesCleared: 48, date: "2026-06-08", isAi: true },
  { id: "g_2", username: "Elena_K", score: 1980, linesCleared: 35, date: "2026-06-07", isAi: true },
  { id: "g_3", username: "Marcus_V", score: 1450, linesCleared: 25, date: "2026-06-09", isAi: true },
  { id: "g_4", username: "EclipseGuru", score: 1250, linesCleared: 22, date: "2026-06-08" },
  { id: "g_5", username: "Cap_JSTL", score: 1110, linesCleared: 19, date: "2026-06-05", isAi: true },
  { id: "g_6", username: "Koji_S", score: 980, linesCleared: 15, date: "2026-06-04", isAi: true },
  { id: "g_7", username: "JSTL_Ruler", score: 840, linesCleared: 15, date: "2026-06-09" },
  { id: "g_8", username: "ServletSpecialist", score: 460, linesCleared: 6, date: "2026-06-09" },
];

export default function App() {
  // Navigation: "game", "exporter", "leaderboard", or "profile"
  const [activePane, setActivePane] = useState<"game" | "exporter" | "leaderboard" | "profile">("game");

  // Local Accounts Data Store
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileName, setCurrentProfileName] = useState("");
  const [highScores, setHighScores] = useState<ScoreRecord[]>([]);
  const [globalScores, setGlobalScores] = useState<ScoreRecord[]>([]);

  // 🎮 Game modes setup
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [currentGameScreen, setCurrentGameScreen] = useState<"menu" | "playing">("menu");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [volumePct, setVolumePct] = useState(25);

  // 🧩 Puzzle game state engine
  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD_STATE());
  const [score, setScore] = useState(0);
  const [linesClearedCurrent, setLinesClearedCurrent] = useState(0);
  const [blocksPlacedCurrent, setBlocksPlacedCurrent] = useState(0);
  const [activeBlocks, setActiveBlocks] = useState<(BlockShape | null)[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [previewHoverCell, setPreviewHoverCell] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scoreNotification, setScoreNotification] = useState("");
  const [scoreMultiplier, setScoreMultiplier] = useState(1);

  // ⚔️ Versus Matchmaking & Combat State
  const [matchState, setMatchState] = useState<MatchState>({
    status: "idle",
    opponentName: "",
    opponentAvatar: "",
    opponentRating: 1000,
    opponentScore: 0,
    opponentBoard: INITIAL_BOARD_STATE(),
    opponentChoices: [],
    opponentLinesCleared: 0,
    opponentBlocksPlaced: 0,
    opponentIsGameOver: false,
    winner: null,
  });

  const [currentTurn, setCurrentTurn] = useState<"player" | "opponent">("player");
  const [vsTurnTimer, setVsTurnTimer] = useState<number>(15);

  const handleSkipPlayerTurn = () => {
    setScoreNotification("⏱️ Time's up! Turn skipped!");
    if (soundOn) {
      playPlaceSound();
    }
    setTimeout(() => {
      setScoreNotification("");
    }, 2000);

    const opponentHasMoves = checkBotHasMoves(board, matchState.opponentChoices);
    if (opponentHasMoves) {
      setCurrentTurn("opponent");
    } else {
      setVsTurnTimer(15);
    }
  };

  useEffect(() => {
    if (gameMode === "solo") return;
    if (matchState.status !== "playing") return;
    if (currentTurn !== "player") {
      setVsTurnTimer(15);
      return;
    }

    const interval = setInterval(() => {
      setVsTurnTimer((prev) => {
        if (prev <= 1) {
          handleSkipPlayerTurn();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, matchState.status, currentTurn, board, activeBlocks, matchState.opponentChoices]);

  const [queueIndex, setQueueIndex] = useState(0);
  const [queueLog, setQueueLog] = useState("");
  const [countdownNum, setCountdownNum] = useState<number | string>("");

  // Audio parameters state
  const [soundOn, setSoundOn] = useState(true);

  // Initializing profile & leaderboards loading
  useEffect(() => {
    const cachedProfiles = localStorage.getItem("block_game_profiles");
    const cachedScores = localStorage.getItem("block_game_scores");
    const cachedGlobalScores = localStorage.getItem("block_game_global_scores");
    const cachedActive = localStorage.getItem("block_game_active_user");

    let loadedProfiles = SEED_PROFILES;
    let loadedScores = SEED_SCORES;
    let loadedGlobalScores = SEED_GLOBAL_SCORES;
    let activeTag = "JSTL_Ruler";

    if (cachedProfiles) {
      try {
        loadedProfiles = JSON.parse(cachedProfiles);
      } catch (e) {
        console.error(e);
      }
    }
    if (cachedScores) {
      try {
        loadedScores = JSON.parse(cachedScores);
      } catch (e) {
        console.error(e);
      }
    }
    if (cachedGlobalScores) {
      try {
        loadedGlobalScores = JSON.parse(cachedGlobalScores);
      } catch (e) {
        console.error(e);
      }
    }
    if (cachedActive && loadedProfiles.some((p) => p.username === cachedActive)) {
      activeTag = cachedActive;
    }

    setProfiles(loadedProfiles);
    setHighScores(loadedScores);
    setGlobalScores(loadedGlobalScores);
    setCurrentProfileName(activeTag);

    // Save initial seed state back to localStorage
    if (!cachedProfiles) {
      localStorage.setItem("block_game_profiles", JSON.stringify(SEED_PROFILES));
    }
    if (!cachedScores) {
      localStorage.setItem("block_game_scores", JSON.stringify(SEED_SCORES));
    }
    if (!cachedGlobalScores) {
      localStorage.setItem("block_game_global_scores", JSON.stringify(SEED_GLOBAL_SCORES));
    }
  }, []);

  // Update backend volume setting when state toggles
  useEffect(() => {
    setVolume(soundOn ? (volumePct / 100) : 0);
  }, [soundOn, volumePct]);

  // Boot standard active block sequence on start
  useEffect(() => {
    setActiveBlocks(getRandomBlocks());
  }, []);

  // Listen for Escape key to dismiss settings modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentProfile =
    profiles.find((p) => p.username === currentProfileName) || SEED_PROFILES[0];

  // 🤖 AI/Global Opponent Game Loop - drives opponent moves in real-time
  useEffect(() => {
    if (gameMode === "solo") return;
    if (matchState.status !== "playing") return;
    if (currentTurn !== "opponent") return;

    // Balanced AI placement speed for a slightly brisker pace (1.3 seconds)
    const intervalMs = 1300;

    const opponentTimer = setTimeout(() => {
      // Find valid selections on the shared board
      const availableChoices = matchState.opponentChoices;
      let bestMoveOverall: { choiceIdx: number; r: number; c: number; score: number } | null = null;

      for (let i = 0; i < availableChoices.length; i++) {
        const block = availableChoices[i];
        if (block) {
          const placement = findBestPlacement(board, block);
          if (placement) {
            if (!bestMoveOverall || placement.score > bestMoveOverall.score) {
              bestMoveOverall = {
                choiceIdx: i,
                r: placement.r,
                c: placement.c,
                score: placement.score
              };
            }
          }
        }
      }

      // If we found a valid placement, apply it to the shared board
      if (bestMoveOverall) {
        const choiceIdx = bestMoveOverall.choiceIdx;
        const placedBlock = availableChoices[choiceIdx]!;
        const rStart = bestMoveOverall.r;
        const cStart = bestMoveOverall.c;

        const updatedBoard = board.map(row => [...row]);
        const shapeRows = placedBlock.matrix.length;
        const shapeCols = placedBlock.matrix[0].length;
        let placedSquaresCount = 0;

        for (let r = 0; r < shapeRows; r++) {
          for (let c = 0; c < shapeCols; c++) {
            if (placedBlock.matrix[r][c] === 1) {
              updatedBoard[rStart + r][cStart + c] = placedBlock.color;
              placedSquaresCount++;
            }
          }
        }

        // Check columns and rows completions on shared board
        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];

        for (let r = 0; r < 8; r++) {
          if (updatedBoard[r].every(cell => cell !== null)) {
            rowsToClear.push(r);
          }
        }

        for (let c = 0; c < 8; c++) {
          let colFull = true;
          for (let r = 0; r < 8; r++) {
            if (updatedBoard[r][c] === null) {
              colFull = false;
              break;
            }
          }
          if (colFull) colsToClear.push(c);
        }

        // Clear completed parts
        rowsToClear.forEach(r => updatedBoard[r].fill(null));
        colsToClear.forEach(c => {
          for (let r = 0; r < 8; r++) {
            updatedBoard[r][c] = null;
          }
        });

        const opponentLinesClearedCount = rowsToClear.length + colsToClear.length;
        let opponentComboBonus = 0;
        if (opponentLinesClearedCount === 1) opponentComboBonus = 10;
        else if (opponentLinesClearedCount === 2) opponentComboBonus = 35;
        else if (opponentLinesClearedCount === 3) opponentComboBonus = 70;
        else if (opponentLinesClearedCount >= 4) opponentComboBonus = 130;

        const scoreDelta = placedSquaresCount + opponentComboBonus;
        const nextOpponentScore = matchState.opponentScore + scoreDelta;

        // Sound cues
        if (opponentLinesClearedCount > 0 && soundOn) {
          playClearSound();
        } else if (soundOn) {
          playPlaceSound();
        }

        // Clear chosen block
        const nextOpponentChoices = [...matchState.opponentChoices];
        nextOpponentChoices[choiceIdx] = null;

        // Replenish selection list if all choices computed
        let finalOpponentChoices = nextOpponentChoices;
        if (nextOpponentChoices.every(b => b === null)) {
          finalOpponentChoices = getRandomBlocks();
        }

        setBoard(updatedBoard);

        // Calculate actual next moves potential
        const botHasMoves = checkBotHasMoves(updatedBoard, finalOpponentChoices);
        const playerHasMoves = checkBotHasMoves(updatedBoard, activeBlocks);

        setGameOver(!playerHasMoves);
        setMatchState(prev => ({
          ...prev,
          opponentChoices: finalOpponentChoices,
          opponentScore: nextOpponentScore,
          opponentLinesCleared: prev.opponentLinesCleared + opponentLinesClearedCount,
          opponentBlocksPlaced: prev.opponentBlocksPlaced + placedSquaresCount,
          opponentIsGameOver: !botHasMoves,
        }));

        if (!botHasMoves && !playerHasMoves) {
          // Dual game over, resolve completely
          setTimeout(() => {
            resolveMatchOutcome(
              score,
              nextOpponentScore,
              matchState.opponentLinesCleared + opponentLinesClearedCount,
              matchState.opponentBlocksPlaced + placedSquaresCount,
              matchState.opponentName
            );
          }, 500);
        } else if (botHasMoves) {
          // Bot still has moves
          if (playerHasMoves && !gameOver) {
            // Player has moves too, switch turn
            setCurrentTurn("player");
          } else {
            // Keep opponent playing since player is out of moves
            setCurrentTurn("opponent");
          }
        } else {
          // Bot has no moves but player does - return to player
          setCurrentTurn("player");
        }

      } else {
        // No moves can fit! Mark bot game over temporarily
        setMatchState(prev => ({ ...prev, opponentIsGameOver: true }));

        const playerHasMoves = checkBotHasMoves(board, activeBlocks);

        if (gameOver || !playerHasMoves) {
          // Dual game over, resolve
          setTimeout(() => {
            resolveMatchOutcome(
              score,
              matchState.opponentScore,
              matchState.opponentLinesCleared,
              matchState.opponentBlocksPlaced,
              matchState.opponentName
            );
          }, 500);
        } else {
          // Player still has moves, return turn to player to let them make space
          setCurrentTurn("player");
        }
      }
    }, intervalMs);

    return () => clearTimeout(opponentTimer);
  }, [
    gameMode,
    matchState.status,
    currentTurn,
    board,
    activeBlocks,
    matchState.opponentChoices,
    gameOver,
    score,
    soundOn,
  ]);

  // Matchmaking ticker triggers simulated queue steps
  useEffect(() => {
    if (gameMode !== "vs_player" || matchState.status !== "searching") return;

    const queueTimer = setInterval(() => {
      setQueueIndex((prev) => {
        const nextIdx = prev + 1;
        if (nextIdx < QUEUE_MESSAGES.length) {
          setQueueLog(QUEUE_MESSAGES[nextIdx]);
          return nextIdx;
        } else {
          // Found Match! Setup profile
          const opponentConfig = getRandomOpponent(currentProfile.username);
          setMatchState({
            status: "countdown",
            opponentName: opponentConfig.username,
            opponentAvatar: opponentConfig.avatar,
            opponentRating: opponentConfig.rating,
            opponentScore: 0,
            opponentBoard: INITIAL_BOARD_STATE(),
            opponentChoices: getRandomBlocks(),
            opponentLinesCleared: 0,
            opponentBlocksPlaced: 0,
            opponentIsGameOver: false,
            winner: null,
          });
          setCountdownNum(3);
          clearInterval(queueTimer);
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(queueTimer);
  }, [gameMode, matchState.status, currentProfile.username]);

  // Handle countdown timing
  useEffect(() => {
    if (matchState.status !== "countdown") return;

    const countdownTimer = setInterval(() => {
      setCountdownNum((prev) => {
        if (typeof prev === "number") {
          if (prev > 1) {
            return prev - 1;
          } else {
            return "COMBAT GO!";
          }
        } else {
          // Finished countdown, start active boards play!
          setMatchState((prevMatch) => ({ ...prevMatch, status: "playing" }));
          clearInterval(countdownTimer);
          return "";
        }
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [matchState.status]);

  // Handler for starting VS AI mode immediately
  const handleStartVersusAI = () => {
    setBoard(INITIAL_BOARD_STATE());
    setScore(0);
    setLinesClearedCurrent(0);
    setBlocksPlacedCurrent(0);
    setActiveBlocks(getRandomBlocks());
    setSelectedBlockIndex(null);
    setPreviewHoverCell(null);
    setGameOver(false);
    setScoreNotification("");
    setCurrentTurn("player");

    setMatchState({
      status: "playing",
      opponentName: "Tomcat_AI_Bot",
      opponentAvatar: "avatar2",
      opponentRating: 1350,
      opponentScore: 0,
      opponentBoard: INITIAL_BOARD_STATE(),
      opponentChoices: getRandomBlocks(),
      opponentLinesCleared: 0,
      opponentBlocksPlaced: 0,
      opponentIsGameOver: false,
      winner: null,
    });
  };

  const handleSelectGameMode = (mode: GameMode) => {
    setGameMode(mode);
    setCurrentTurn("player");
    setScoreMultiplier(1);
    if (mode === "solo") {
      setBoard(INITIAL_BOARD_STATE());
      setScore(0);
      setLinesClearedCurrent(0);
      setBlocksPlacedCurrent(0);
      setActiveBlocks(getRandomBlocks());
      setSelectedBlockIndex(null);
      setPreviewHoverCell(null);
      setGameOver(false);
      setScoreNotification("");
      setMatchState((prev) => ({ ...prev, status: "idle" }));
    } else if (mode === "vs_ai") {
      handleStartVersusAI();
    } else if (mode === "vs_player") {
      // Trigger Queue searches
      setBoard(INITIAL_BOARD_STATE());
      setScore(0);
      setLinesClearedCurrent(0);
      setBlocksPlacedCurrent(0);
      setActiveBlocks(getRandomBlocks());
      setSelectedBlockIndex(null);
      setPreviewHoverCell(null);
      setGameOver(false);
      setScoreNotification("");

      setQueueIndex(0);
      setQueueLog(QUEUE_MESSAGES[0]);

      setMatchState({
        status: "searching",
        opponentName: "",
        opponentAvatar: "",
        opponentRating: 1000,
        opponentScore: 0,
        opponentBoard: INITIAL_BOARD_STATE(),
        opponentChoices: [],
        opponentLinesCleared: 0,
        opponentBlocksPlaced: 0,
        opponentIsGameOver: false,
        winner: null,
      });
    }
  };

  // Selecting block triggers select sound chime
  const handleSelectBlock = (idx: number | null) => {
    setSelectedBlockIndex(idx);
    setPreviewHoverCell(null);
    if (idx !== null && soundOn) {
      playSelectSound();
    }
  };

  const handleSelectUserProfile = (username: string) => {
    setCurrentProfileName(username);
    localStorage.setItem("block_game_active_user", username);
  };

  const handleUpdateUserProfile = (username: string, bio: string, avatar: string) => {
    const updated = profiles.map((p) => {
      if (p.username === currentProfileName) {
        return { ...p, username, bio, avatar };
      }
      return p;
    });

    // Update Scores records with user's new name as well
    const updatedScores = highScores.map((scoreObj) => {
      if (scoreObj.username === currentProfileName) {
        return { ...scoreObj, username };
      }
      return scoreObj;
    });

    setProfiles(updated);
    setHighScores(updatedScores);
    setCurrentProfileName(username);
    localStorage.setItem("block_game_profiles", JSON.stringify(updated));
    localStorage.setItem("block_game_scores", JSON.stringify(updatedScores));
    localStorage.setItem("block_game_active_user", username);
  };

  const handleCreateUserProfile = (username: string) => {
    const newProfile: UserProfile = {
      username,
      avatar: "avatar1",
      bio: "Joined the offline challenge!",
      registeredAt: new Date().toISOString().split("T")[0],
      gamesPlayed: 0,
      highScore: 0,
      totalBlocksPlaced: 0,
      totalLinesCleared: 0,
    };

    const newsList = [...profiles, newProfile];
    setProfiles(newsList);
    setCurrentProfileName(username);
    localStorage.setItem("block_game_profiles", JSON.stringify(newsList));
    localStorage.setItem("block_game_active_user", username);
  };

  const handleClearScores = () => {
    setHighScores([]);
    localStorage.setItem("block_game_scores", JSON.stringify([]));

    // Reset scores across user profiles
    const resetProfiles = profiles.map((p) => ({ ...p, highScore: 0 }));
    setProfiles(resetProfiles);
    localStorage.setItem("block_game_profiles", JSON.stringify(resetProfiles));
  };

  const handleClearGlobalScores = () => {
    setGlobalScores(SEED_GLOBAL_SCORES);
    localStorage.setItem("block_game_global_scores", JSON.stringify(SEED_GLOBAL_SCORES));
  };

  // Puzzle validation and coordinates placement
  const handlePlaceBlock = (startR: number, startC: number, forceBlockIdx?: number) => {
    // Check if player's turn in VS mode
    if (gameMode !== "solo" && currentTurn !== "player") return;

    const finalBlockIdx = forceBlockIdx !== undefined ? forceBlockIdx : selectedBlockIndex;
    if (finalBlockIdx === null) return;
    const block = activeBlocks[finalBlockIdx];
    if (!block) return;

    const rows = block.matrix.length;
    const cols = block.matrix[0].length;

    // Check boundary overflow
    if (startR + rows > 8 || startC + cols > 8) return;

    // Check cells overlap
    let overlaps = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (block.matrix[r][c] === 1) {
          if (board[startR + r][startC + c] !== null) {
            overlaps = true;
          }
        }
      }
    }

    if (overlaps) return;

    // Valid Placement! Apply cell modifications
    const updatedBoard = board.map((row) => [...row]);
    let placedSquareUnits = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (block.matrix[r][c] === 1) {
          updatedBoard[startR + r][startC + c] = block.color;
          placedSquareUnits++;
        }
      }
    }

    if (soundOn) {
      playPlaceSound();
    }

    // Update cumulative state factors during placement
    let addedScore = placedSquareUnits * scoreMultiplier;
    const nextBlocksPlacedCount = blocksPlacedCurrent + placedSquareUnits;

    // Remove active block choice
    const nextChoices = [...activeBlocks];
    nextChoices[finalBlockIdx] = null;

    // Check if any row / col filled
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Rows check
    for (let r = 0; r < 8; r++) {
      let isFull = true;
      for (let c = 0; c < 8; c++) {
        if (updatedBoard[r][c] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) rowsToClear.push(r);
    }

    // Columns check
    for (let c = 0; c < 8; c++) {
      let isFull = true;
      for (let r = 0; r < 8; r++) {
        if (updatedBoard[r][c] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) colsToClear.push(c);
    }

    // Clear full cells on updated board
    rowsToClear.forEach((r) => {
      for (let c = 0; c < 8; c++) {
        updatedBoard[r][c] = null;
      }
    });

    colsToClear.forEach((c) => {
      for (let r = 0; r < 8; r++) {
        updatedBoard[r][c] = null;
      }
    });

    const linesClearedThisTurn = rowsToClear.length + colsToClear.length;
    let nextLinesClearedCount = linesClearedCurrent;

    if (linesClearedThisTurn > 0) {
      nextLinesClearedCount += linesClearedThisTurn;

      // JSTL combo logic scale
      let baseLineBonus = 0;
      let clearName = "";
      if (linesClearedThisTurn === 1) {
        baseLineBonus = 10;
        clearName = "Single Clear!";
      } else if (linesClearedThisTurn === 2) {
        baseLineBonus = 35;
        clearName = "Double Combo!";
      } else if (linesClearedThisTurn === 3) {
        baseLineBonus = 70;
        clearName = "Triple Cascade!";
      } else {
        baseLineBonus = 130;
        clearName = "Mega Cleared Grid!";
      }

      const multipliedLineBonus = baseLineBonus * scoreMultiplier;
      addedScore += multipliedLineBonus;

      // Check for PERFECT CLEAR (grid completely empty)
      const isBoardEmptyAfterClears = updatedBoard.every(row => row.every(cell => cell === null));
      let perfectBonus = 0;
      let isPerfectClear = false;

      if (isBoardEmptyAfterClears) {
        isPerfectClear = true;
        perfectBonus = 200 * scoreMultiplier;
        addedScore += perfectBonus;
      }

      // Update multiplier
      const multiplierIncrease = linesClearedThisTurn + (isPerfectClear ? 5 : 0);
      const nextMultiplier = scoreMultiplier + multiplierIncrease;
      setScoreMultiplier(nextMultiplier);

      // Notification
      if (isPerfectClear) {
        setScoreNotification(`✨ PERFECT GRID CLEAR! Extra 5x Multiplier! (+${multipliedLineBonus + perfectBonus} pts) | Next: ${nextMultiplier}x! ✨`);
      } else {
        setScoreNotification(`🔥 ${clearName} ${scoreMultiplier}x Multiplier! (+${multipliedLineBonus} pts) | Next: ${nextMultiplier}x! 🔥`);
      }

      if (soundOn) playClearSound();

      setTimeout(() => {
        setScoreNotification("");
      }, 3500);
    } else {
      // Placing block without clearing lines resets multiplier to 1
      setScoreMultiplier(1);
    }

    const nextScore = score + addedScore;

    // Replenish choices if blocks are completely depleted
    let finalChoices = nextChoices;
    if (nextChoices.every((b) => b === null)) {
      finalChoices = getRandomBlocks();
    }

    // Apply state variables
    setBoard(updatedBoard);
    setScore(nextScore);
    setBlocksPlacedCurrent(nextBlocksPlacedCount);
    setLinesClearedCurrent(nextLinesClearedCount);
    setActiveBlocks(finalChoices);
    setSelectedBlockIndex(null);
    setPreviewHoverCell(null);

    // Final assessment check for failure bounds
    if (gameMode !== "solo") {
      setVsTurnTimer(15);
      const playerHasMoves = checkBotHasMoves(updatedBoard, finalChoices);
      const opponentHasMoves = checkBotHasMoves(updatedBoard, matchState.opponentChoices);

      setGameOver(!playerHasMoves);
      setMatchState(prev => ({ ...prev, opponentIsGameOver: !opponentHasMoves }));

      if (!playerHasMoves && !opponentHasMoves) {
        setGameOver(true);
        setMatchState(prev => ({ ...prev, opponentIsGameOver: true }));
        if (soundOn) {
          playGameOverSound();
        }
        setTimeout(() => {
          resolveMatchOutcome(
            nextScore,
            matchState.opponentScore,
            matchState.opponentLinesCleared,
            matchState.opponentBlocksPlaced,
            matchState.opponentName
          );
        }, 500);
      } else if (playerHasMoves) {
        if (opponentHasMoves) {
          setCurrentTurn("opponent");
        } else {
          // Keep turn on player since opponent is blocked
          setCurrentTurn("player");
        }
      } else {
        // Player has no moves, but opponent does - transition turn to opponent
        setCurrentTurn("opponent");
      }
    } else {
      const playerHasMoves = checkBotHasMoves(updatedBoard, finalChoices);
      if (!playerHasMoves) {
        setGameOver(true);
        if (soundOn) {
          playGameOverSound();
        }
        handleSaveFinalScore(nextScore, nextLinesClearedCount, nextBlocksPlacedCount);
      }
    }
  };

  const checkGameOverState = (
    currentBoard: (string | null)[][],
    availableBlocks: (BlockShape | null)[],
    finalScore: number,
    finalLinesCleared: number,
    finalBlocksPlaced: number
  ) => {
    const liveBlocks = availableBlocks.filter((b) => b !== null) as BlockShape[];

    if (liveBlocks.length === 0) return; // Perfect sequence run

    // Verify if at least 1 remaining block has any open slot
    let validMovesExist = false;

    for (let bIdx = 0; bIdx < liveBlocks.length; bIdx++) {
      if (canDrop(currentBoard, liveBlocks[bIdx])) {
        validMovesExist = true;
        break;
      }
    }

    if (!validMovesExist) {
      setGameOver(true);
      if (soundOn) {
        playGameOverSound();
      }

      // Check game mode context
      if (gameMode === "solo") {
        handleSaveFinalScore(finalScore, finalLinesCleared, finalBlocksPlaced);
      } else {
        // Player is out of moves! Check if active bot is ALSO out of moves
        if (matchState.opponentIsGameOver) {
          resolveMatchOutcome(
            finalScore,
            matchState.opponentScore,
            matchState.opponentLinesCleared,
            matchState.opponentBlocksPlaced,
            matchState.opponentName
          );
        } else {
          // Transfer turn to opponent in VS match context so they can continue playing
          setCurrentTurn("opponent");
        }
      }
    }
  };

  // ⚔️ Unified Match Resolution Engine
  const resolveMatchOutcome = (
    plrScore: number,
    oppScore: number,
    oppLines: number,
    oppBlocks: number,
    oppName: string
  ) => {
    let outcome: string | null = null;
    if (plrScore > oppScore) outcome = "player";
    else if (plrScore < oppScore) outcome = "opponent";
    else outcome = "draw";

    setMatchState((prev) => ({
      ...prev,
      status: "gameover",
      winner: outcome,
    }));

    handleSaveFinalMatchResult(plrScore, linesClearedCurrent, blocksPlacedCurrent, oppScore, oppLines, oppBlocks, oppName, outcome);
  };

  // 💾 Saves both player & opponent details in Global vs Local DB registries
  const handleSaveFinalMatchResult = (
    playerScoreFinish: number,
    linesCount: number,
    blocksCount: number,
    botScoreFinish: number,
    botLinesCount: number,
    botBlocksCount: number,
    oppName: string,
    outcome: string | null
  ) => {
    // 1. Log User's Score to Local Session History Score List
    const matchTypeTag = gameMode === "vs_ai" ? " (VS AI)" : " (VS Global)";
    const newRecord: ScoreRecord = {
      id: `score_${Date.now()}_player`,
      username: currentProfile.username + matchTypeTag,
      score: playerScoreFinish,
      linesCleared: linesCount,
      date: new Date().toISOString().split("T")[0],
    };

    const nextScoreList = [...highScores, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    setHighScores(nextScoreList);
    localStorage.setItem("block_game_scores", JSON.stringify(nextScoreList));

    // 2. Log both player scores to Global Standings List
    const todayStr = new Date().toISOString().split("T")[0];
    const playerGlobalRecord: ScoreRecord = {
      id: `score_${Date.now()}_g_plr`,
      username: currentProfile.username,
      score: playerScoreFinish,
      linesCleared: linesCount,
      date: todayStr,
    };

    const botGlobalRecord: ScoreRecord = {
      id: `score_${Date.now()}_opp_g`,
      username: oppName || (gameMode === "vs_ai" ? "Tomcat_AI_Bot" : "Marcus_V"),
      score: botScoreFinish,
      linesCleared: botLinesCount,
      date: todayStr,
      isAi: true,
    };

    const nextGlobalScores = [...globalScores, playerGlobalRecord, botGlobalRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    setGlobalScores(nextGlobalScores);
    localStorage.setItem("block_game_global_scores", JSON.stringify(nextGlobalScores));

    // 3. Update Profile cumulative parameters
    const updatedProfiles = profiles.map((p) => {
      if (p.username === currentProfile.username) {
        const isNewBest = playerScoreFinish > p.highScore;
        return {
          ...p,
          gamesPlayed: p.gamesPlayed + 1,
          highScore: isNewBest ? playerScoreFinish : p.highScore,
          totalBlocksPlaced: p.totalBlocksPlaced + blocksCount,
          totalLinesCleared: p.totalLinesCleared + linesCount,
        };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    localStorage.setItem("block_game_profiles", JSON.stringify(updatedProfiles));
  };

  const handleSaveFinalScore = (
    finalScore: number,
    linesCount: number,
    blocksCount: number
  ) => {
    // 1. Log Score Record to List
    const newRecord: ScoreRecord = {
      id: `score_${Date.now()}`,
      username: currentProfile.username,
      score: finalScore,
      linesCleared: linesCount,
      date: new Date().toISOString().split("T")[0],
    };

    const nextScoreList = [...highScores, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    setHighScores(nextScoreList);
    localStorage.setItem("block_game_scores", JSON.stringify(nextScoreList));

    // 2. Also record in global scores if Solo play exceeds standard ratios!
    const playerGlobalRecord: ScoreRecord = {
      id: `score_${Date.now()}_g_plr_solo`,
      username: currentProfile.username,
      score: finalScore,
      linesCleared: linesCount,
      date: new Date().toISOString().split("T")[0],
    };
    const nextGlobalScores = [...globalScores, playerGlobalRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
    setGlobalScores(nextGlobalScores);
    localStorage.setItem("block_game_global_scores", JSON.stringify(nextGlobalScores));

    // 3. Update user profile metrics persistence
    const updatedProfiles = profiles.map((p) => {
      if (p.username === currentProfile.username) {
        const isNewBest = finalScore > p.highScore;
        return {
          ...p,
          gamesPlayed: p.gamesPlayed + 1,
          highScore: isNewBest ? finalScore : p.highScore,
          totalBlocksPlaced: p.totalBlocksPlaced + blocksCount,
          totalLinesCleared: p.totalLinesCleared + linesCount,
        };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    localStorage.setItem("block_game_profiles", JSON.stringify(updatedProfiles));
  };

  const handleRestart = () => {
    setBoard(INITIAL_BOARD_STATE());
    setScore(0);
    setLinesClearedCurrent(0);
    setBlocksPlacedCurrent(0);
    setActiveBlocks(getRandomBlocks());
    setSelectedBlockIndex(null);
    setPreviewHoverCell(null);
    setGameOver(false);
    setScoreNotification("");
    setScoreMultiplier(1);
    setVsTurnTimer(15);

    if (gameMode === "solo") {
      setMatchState((prev) => ({ ...prev, status: "idle" }));
    } else {
      handleSelectGameMode(gameMode);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-sans flex flex-col justify-between selection:bg-[#00f0ff]/20 overflow-x-hidden relative">
      {/* Visual background sparkles decorations */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#00f0ff]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full bg-[#ff007f]/10 blur-3xl pointer-events-none" />

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-grow">
        <AnimatePresence mode="wait">
          {activePane === "game" ? (
            currentGameScreen === "menu" ? (
              <motion.div
                key="menu-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-8 w-full"
              >
                {/* 🌟 NeoBlocks Mobile Console Wrapper styled to match Premium Cyberpunk aesthetic */}
                <div className="w-full max-w-[420px] mx-auto min-h-[665px] md:min-h-[710px] rounded-[36px] bg-[#0d1117] relative overflow-hidden shadow-2xl p-6 flex flex-col justify-between border-[6px] border-[#ea00d9] pb-8 text-center select-none shadow-[0_0_25px_rgba(234,0,217,0.35)]">
                  
                  {/* Modern grid graphics */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:20px_20px] opacity-70 pointer-events-none" />
                  
                  {/* Glowing visual accents */}
                  <div className="absolute -top-10 -left-10 w-45 h-45 rounded-full bg-[#00f0ff]/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -right-10 w-45 h-45 rounded-full bg-[#ff007f]/15 blur-3xl pointer-events-none" />
                  
                  {/* Subtle digital sparks */}
                  <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
                    <div className="absolute top-[30%] left-[10%] w-1.5 h-1.5 bg-[#00f0ff]/35 rounded-full animate-ping" />
                    <div className="absolute top-[60%] right-[15%] w-1.5 h-1.5 bg-[#ff007f]/45 rounded-full animate-pulse" />
                  </div>

                  {/* 🎮 Top Corner Mobile-Friendly Options near the name and crown logo */}
                  <div className="w-full flex justify-between items-center z-30 relative px-1 pt-2 pb-2.5 border-b-2 border-white/10">
                    {/* Top-Left: User Profile shortcut button */}
                    <button
                      onClick={() => setActivePane("profile")}
                      className="h-10 px-3.5 rounded-2xl bg-gradient-to-r from-[#a020f0] via-[#ea00d9] to-[#ff007b] text-white border-2 border-[#ff007b]/30 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-[0_0_12px_rgba(234,0,217,0.4)] cursor-pointer flex items-center gap-1.5"
                      title="User Profile options"
                    >
                      <User className="w-4 h-4 text-white/95" strokeWidth={3} />
                      <span className="text-[10px] font-sans font-black uppercase tracking-wider truncate max-w-[80px]">
                        {currentProfile.username}
                      </span>
                    </button>

                    {/* Top-Right: Leaderboard shortcut button */}
                    <button
                      onClick={() => setActivePane("leaderboard")}
                      className="h-10 px-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-2 border-amber-300 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-[0_4px_12px_rgba(245,158,11,0.22)] cursor-pointer flex items-center gap-1.5"
                      title="Leaderboard rankings"
                    >
                      <Trophy className="w-4 h-4 text-amber-150 animate-bounce" strokeWidth={3} />
                      <span className="text-[10px] font-sans font-black uppercase tracking-wider">
                        Rankings
                      </span>
                    </button>
                  </div>

                  {/* 👑 Bouncy Logo Block */}
                  <div className="space-y-4 pt-4 z-20 flex flex-col items-center">
                    {/* Tilted Floating Crown */}
                    <div className="relative pt-6">
                      <div className="absolute top-[-24px] left-[50%] z-30 transform -translate-x-1/2 -rotate-12 pointer-events-none">
                        <svg className="w-10 h-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] animate-bounce" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 44 L52 44" stroke="#ffb74d" strokeWidth="4" strokeLinecap="round" />
                          <path d="M12 44 L16 22 L26 32 L32 12 L38 32 L48 22 L52 44 Z" fill="url(#crownGradMenuColorful)" stroke="#f57c00" strokeWidth="2" strokeLinejoin="round" />
                          <circle cx="16" cy="22" r="3" fill="#ff1744" />
                          <circle cx="32" cy="12" r="3" fill="#ea00d9" />
                          <circle cx="48" cy="22" r="3" fill="#00e5ff" />
                          <defs>
                            <linearGradient id="crownGradMenuColorful" x1="32" y1="12" x2="32" y2="44" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#ffd54f" />
                              <stop offset="100%" stopColor="#ffb74d" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      {/* Row 1: N E O in colorful neon candy beads */}
                      <div className="flex justify-center items-center gap-2">
                        <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl font-black text-2xl md:text-3xl text-white bg-gradient-to-b from-rose-400 to-pink-500 border-t-2 border-white/50 shadow-[0_5px_0_#be185d,0_7px_12px_rgba(0,0,0,0.15)]">
                          <div className="absolute top-1 left-1 px-1 w-[80%] h-3 bg-white/25 rounded-md" />
                          <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] font-sans">N</span>
                        </div>
                        <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl font-black text-2xl md:text-3xl text-white bg-gradient-to-b from-amber-400 to-orange-500 border-t-2 border-white/50 shadow-[0_5px_0_#c2410c,0_7px_12px_rgba(0,0,0,0.15)]">
                          <div className="absolute top-1 left-1 px-1 w-[80%] h-3 bg-white/25 rounded-md" />
                          <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] font-sans">E</span>
                        </div>
                        <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl font-black text-2xl md:text-3xl text-white bg-gradient-to-b from-cyan-400 to-sky-500 border-t-2 border-white/50 shadow-[0_5px_0_#0369a1,0_7px_12px_rgba(0,0,0,0.15)]">
                          <div className="absolute top-1 left-1 px-1 w-[80%] h-3 bg-white/25 rounded-md" />
                          <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] font-sans">O</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: B L O C K S in sleek cobalt labels */}
                    <div className="flex justify-center items-center gap-1.5 pb-2">
                      {["B", "L", "O", "C", "K", "S"].map((letter) => (
                        <div key={letter} className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl font-black text-sm md:text-base text-sky-800 bg-gradient-to-b from-sky-100 to-sky-200 border-t border-white shadow-[0_3.5px_0_#bae6fd,0_5px_8px_rgba(186,230,253,0.35)]">
                          <div className="absolute top-0.5 left-0.5 px-0.5 w-[80%] h-2 bg-white/25 rounded-md" />
                          <span className="font-sans">{letter}</span>
                        </div>
                      ))}
                    </div>

                    {/* Game Name Text/Subtitle */}
                    <div className="space-y-1">
                      <h2 className="text-xl md:text-2xl font-bold font-serif italic text-sky-950 tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] leading-none select-none">
                        NEOBLOCKS
                      </h2>
                      <p className="text-[10px] md:text-[11px] font-mono tracking-widest text-sky-600 font-extrabold uppercase">
                        Pristine Retro Arcade Simulation
                      </p>
                    </div>
                  </div>

                  {/* 🎮 3D-Beveled Action Button Stack styled for colorful look */}
                  <div className="w-full max-w-[340px] mx-auto flex flex-col gap-6 pt-6 pb-4 z-20">
                    
                    {/* BUTTON 1: Adventure VS AI Mode */}
                    <div 
                      onClick={() => {
                        handleSelectGameMode("vs_ai");
                        setCurrentGameScreen("playing");
                      }}
                      className="relative w-full cursor-pointer group active:scale-95 transition-transform duration-100"
                    >
                      {/* Bevel Base Shadow */}
                      <div className="absolute inset-0 bg-sky-700 rounded-2xl md:rounded-3xl" />
                      {/* Premium Front Surface */}
                      <div className="relative transform -translate-y-1.5 group-active:-translate-y-0.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 rounded-2xl md:rounded-3xl p-3.5 md:p-4 border-t-4 border-white/40 flex items-center gap-4 transition-transform duration-100 shadow-[0_8px_16px_rgba(14,165,233,0.25)]">
                        {/* Clock Icon Container */}
                        <span className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-md relative flex-shrink-0">
                          <svg className="w-6 h-6 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </span>
                        
                        {/* Text Label */}
                        <span className="text-white text-lg md:text-xl font-black tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)] font-sans italic text-left">
                          Player Vs AI
                        </span>

                        {/* Top-Left Banner Ribbon Tag */}
                        <div className="absolute top-[-10px] left-[-8px] bg-gradient-to-b from-rose-500 to-rose-650 text-white text-[9px] md:text-[10px] font-black px-3 py-1 rounded-lg border-b-4 border-rose-700 select-none shadow-md transform -rotate-12 uppercase tracking-wide">
                          VS AI
                        </div>
                      </div>
                    </div>

                    {/* BUTTON 2: Classic Solo Mode */}
                    <div 
                      onClick={() => {
                        handleSelectGameMode("solo");
                        setCurrentGameScreen("playing");
                      }}
                      className="relative w-full cursor-pointer group active:scale-95 transition-transform duration-100"
                    >
                      {/* Bevel Base Shadow */}
                      <div className="absolute inset-0 bg-pink-700 rounded-2xl md:rounded-3xl" />
                      {/* Premium Front Surface */}
                      <div className="relative transform -translate-y-1.5 group-active:-translate-y-0.5 bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl md:rounded-3xl p-3.5 md:p-4 border-t-4 border-white/40 flex items-center gap-4 transition-transform duration-100 shadow-[0_8px_16px_rgba(244,63,94,0.23)]">
                        {/* Infinity Container */}
                        <span className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-md relative flex-shrink-0">
                          <svg className="w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z" />
                          </svg>
                        </span>
                        
                        {/* Text Label */}
                        <span className="text-white text-xl md:text-2xl font-black tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)] font-sans italic text-left">
                          Classic
                        </span>
                      </div>
                    </div>

                    {/* BUTTON 3: VS Player Mode */}
                    <div 
                      onClick={() => {
                        handleSelectGameMode("vs_player");
                        setCurrentGameScreen("playing");
                      }}
                      className="relative w-full cursor-pointer group active:scale-95 transition-transform duration-100"
                    >
                      {/* Bevel Base Shadow */}
                      <div className="absolute inset-0 bg-amber-700 rounded-2xl md:rounded-3xl" />
                      {/* Premium Front Surface */}
                      <div className="relative transform -translate-y-1.5 group-active:-translate-y-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl md:rounded-3xl p-3.5 md:p-4 border-t-4 border-white/40 flex items-center gap-4 transition-transform duration-100 shadow-[0_8px_16px_rgba(245,158,11,0.23)]">
                        {/* Gamepad */}
                        <span className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-md relative flex-shrink-0">
                          <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="6" y1="12" x2="10" y2="12" strokeWidth="4" />
                            <line x1="8" y1="10" x2="8" y2="14" strokeWidth="4" />
                            <circle cx="15" cy="13" r="1.5" fill="currentColor" />
                            <circle cx="18" cy="11" r="1.5" fill="currentColor" />
                            <rect x="2" y="6" width="20" height="12" rx="3.5" />
                          </svg>
                        </span>
                        
                        {/* Text Label */}
                        <span className="text-white text-lg md:text-xl font-black tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)] font-sans italic text-left">
                          Player Vs Player
                        </span>

                        {/* Pulsing Dot */}
                        <div className="absolute top-[8px] right-[8px] w-3 h-3 bg-red-500 border border-white rounded-full animate-ping" />
                        <div className="absolute top-[8px] right-[8px] w-3 h-3 bg-red-500 border border-white rounded-full" />
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="game-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-6"
              >
              {/* Layout varies depending on Mode and Matchmaking state */}
              {gameMode !== "solo" && (matchState.status === "searching" || matchState.status === "countdown") ? (
                /* 🔍 Matchmaking Search / Countdown Interface Overlay */
                <div className="w-full max-w-2xl mx-auto rounded-2xl border border-[#1a1a20] bg-[#0c0c0f] p-8 sm:p-12 text-center shadow-2xl space-y-8 flex flex-col items-center">
                  {matchState.status === "searching" ? (
                    <>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-[#d4af37]/10 animate-ping" />
                        <div className="absolute inset-2 rounded-full border border-[#d4af37]/20 border-t-[#d4af37] animate-spin" />
                        <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
                          <Radio className="w-8 h-8 text-[#d4af37] animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif italic text-white font-bold">Matchmaking Active...</h3>
                        <p className="text-xs text-[#d4af37] font-mono tracking-widest uppercase">
                          Searching global servlet server cluster
                        </p>
                      </div>
                      <div className="w-full max-w-md bg-[#08080a] border border-[#1a1a20] p-4 rounded-lg text-left font-mono text-[10px] text-white/50 space-y-1 shadow-inner h-24 overflow-y-auto">
                        <p className="text-white/30">&gt; Initializing socket handshake... OK</p>
                        <p className="text-[#ebd06b]/70">&gt; Querying user profiles queue index: {queueIndex}</p>
                        <p className="text-emerald-400 font-bold">&gt; {queueLog}</p>
                      </div>
                      <button
                        onClick={() => {
                          setGameMode("solo");
                          setCurrentGameScreen("menu");
                        }}
                        className="py-2.5 px-6 border border-red-900/30 bg-red-950/15 hover:bg-red-900/20 text-red-400 rounded-lg text-xs font-serif italic transition duration-250 cursor-pointer"
                      >
                        Cancel Search
                      </button>
                    </>
                  ) : (
                    /* Countdown state */
                    <>
                      <div className="w-full grid grid-cols-5 items-center gap-4 max-w-md">
                        {/* Player */}
                        <div className="col-span-2 text-center space-y-1.5">
                          <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 mx-auto flex items-center justify-center text-2xl shadow-md">
                            👾
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white text-ellipsis overflow-hidden whitespace-nowrap">{currentProfile.username}</p>
                            <p className="text-[10px] font-mono text-white/30 uppercase">EVALUATING</p>
                          </div>
                        </div>

                        {/* VS Label */}
                        <div className="col-span-1 text-center font-serif text-white/20 italic font-bold text-4xl animate-pulse">
                          VS
                        </div>

                        {/* Opponent */}
                        <div className="col-span-2 text-center space-y-1.5">
                          <div className="w-14 h-14 rounded-full bg-purple-900/10 border border-purple-500/25 mx-auto flex items-center justify-center text-2xl shadow-md">
                            🤖
                          </div>
                          <div>
                            <p className="text-sm font-bold text-teal-400 text-ellipsis overflow-hidden whitespace-nowrap">{matchState.opponentName}</p>
                            <p className="text-[10px] font-mono text-white/30 uppercase font-semibold">ELO: {matchState.opponentRating}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-xs text-white/40 uppercase tracking-widest font-mono">STAND BY! MATCH COMMENCING IN:</div>
                        <h2 className="text-7xl font-mono text-[#ebd06b] font-bold tracking-tight animate-bounce">
                          {countdownNum}
                        </h2>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* 🎮 Core Interactive Grid Section (Solo or VS shared grid) */
                <div className="w-full">
                  {/* Left Column(s) - Playable Board */}
                  <div className="flex flex-col items-center gap-6 w-full">
                    
                    <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-[430px]">
                      
                      {/* Sub-device 1: LOCAL PLAYER BOARD */}
                      <div className="w-full max-w-[420px] mx-auto min-h-[660px] md:min-h-[700px] rounded-[40px] bg-[#0c0d14] relative overflow-hidden shadow-2xl p-6 flex flex-col justify-between items-center border-[6px] border-[#00f0ff] text-center select-none shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                        {/* Modern layout graphics similar to the screenshot */}
                        <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
                          <div className="absolute top-[30%] left-[10%] w-1.5 h-1.5 bg-white/10 rounded-full animate-ping" />
                          <div className="absolute top-[60%] right-[15%] w-1.5 h-1.5 bg-white/15 rounded-full animate-pulse" />
                        </div>

                        {/* Top Bar Section with Crown Highscore & Settings Button */}
                        <div className="w-full flex justify-between items-center pb-2 z-25 relative">
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                            title="Personal Highest Score"
                            onClick={() => setActivePane("leaderboard")}
                          >
                            {/* Crown SVG aligned with screenshot crown design */}
                            <svg className="w-8 h-8 filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 44 L52 44" stroke="#e040fb" strokeWidth="4" strokeLinecap="round" />
                              <path d="M12 44 L16 22 L26 32 L32 12 L38 32 L48 22 L52 44 Z" fill="url(#crownGradPlayMode)" stroke="#d500f9" strokeWidth="2" strokeLinejoin="round" />
                              <circle cx="16" cy="22" r="3" fill="#ff4081" />
                              <circle cx="32" cy="12" r="3" fill="#ffeb3b" />
                              <circle cx="48" cy="22" r="3" fill="#00e5ff" />
                              <defs>
                                <linearGradient id="crownGradPlayMode" x1="32" y1="12" x2="32" y2="44" gradientUnits="userSpaceOnUse">
                                  <stop offset="0%" stopColor="#ffea00" />
                                  <stop offset="100%" stopColor="#ff9100" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <span className="text-2xl font-black text-amber-300 font-sans tracking-tight drop-shadow-[0_2.5px_3px_rgba(0,0,0,0.25)]">
                              {currentProfile.highScore || score}
                            </span>
                          </div>

                           {/* Top-Right Settings Buttons with badges matching screenshot */}
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <button
                                onClick={() => setActivePane("profile")}
                                className="w-8 h-8 rounded-xl bg-[#12131a] hover:bg-[#1a1c29] shadow-md border border-[#00f0ff]/30 text-[#00f0ff] flex items-center justify-center hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                              >
                                <svg className="w-4.5 h-4.5 text-[#00f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                              </button>
                              <span className="absolute -top-2.5 -left-1 px-1 py-0.5 rounded bg-gradient-to-b from-[#ea00d9] to-[#ff007b] border border-[#ea00d9]/30 text-[7px] font-sans font-extrabold uppercase tracking-tight text-white leading-none scale-[0.8] origin-bottom shadow-sm">
                                Beta
                              </span>
                            </div>

                            <div className="relative">
                              <button
                                onClick={() => setSettingsOpen(true)}
                                className="w-8 h-8 rounded-xl bg-[#12131a] hover:bg-[#1a1c29] shadow-md border border-[#ea00d9]/30 text-[#ea00d9] flex items-center justify-center hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                              >
                                <Settings className="w-4.5 h-4.5 text-[#ea00d9]" strokeWidth={3} />
                              </button>
                              <span className="absolute -top-2.5 -right-1 px-1 py-0.5 rounded bg-gradient-to-b from-amber-400 to-orange-500 border border-amber-300/30 text-[7px] font-sans font-extrabold uppercase tracking-tight text-white leading-none scale-[0.8] origin-bottom shadow-sm">
                                NEW
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top Giant Scoreboard Display */}
                        <div className="w-full flex flex-col justify-center items-center py-2 z-10 relative">
                          <div className="relative">
                            <h2 className="text-6xl md:text-7xl font-sans font-black tracking-tight text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.2)] select-none">
                              {score}
                            </h2>
                            {scoreMultiplier > 1 && (
                              <div className="absolute top-[-4px] right-[-45px] bg-gradient-to-r from-orange-500 to-amber-500 text-white font-sans font-black text-[9px] px-1.5 py-0.5 rounded-lg border border-amber-300 shadow-md animate-bounce">
                                {scoreMultiplier}x
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Tactical Opponent Choice Panel for Versus Shared Game */}
                        {gameMode !== "solo" && (
                          <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-2.5 mb-2.5 flex flex-col items-center">
                            <span className="text-[8px] font-mono text-white/60 uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                              {matchState.opponentName}'s Choices
                            </span>
                            <div className="flex justify-center gap-2">
                              {matchState.opponentChoices.map((block, bIdx) => {
                                if (!block) {
                                  return (
                                    <div
                                      key={`opp-empty-${bIdx}`}
                                      className="w-10 h-10 border border-dashed border-white/20 bg-white/5 rounded-md flex items-center justify-center text-white/25"
                                    >
                                      <span className="text-[9px]">✨</span>
                                    </div>
                                  );
                                }

                                const cols = block.matrix[0].length;

                                return (
                                  <div
                                    key={`opp-${block.id}`}
                                    className="w-10 h-10 flex items-center justify-center bg-black/40 rounded border border-white/10 p-0.5"
                                    title={`${block.name}`}
                                  >
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                        gap: "1.5px",
                                      }}
                                    >
                                      {block.matrix.map((rowVec, r) =>
                                        rowVec.map((val, c) => (
                                          <div
                                            key={`${r}-${c}`}
                                            className={`w-1.5 h-1.5 rounded-[0.5px] ${
                                              val === 1
                                                ? `bg-gradient-to-br ${block.color} opacity-85`
                                                : "invisible"
                                            }`}
                                          />
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Play Board component */}
                        <div className="relative w-full max-w-[340px] md:max-w-[400px]">
                          <GameBoard
                            board={board}
                            selectedBlock={
                              selectedBlockIndex !== null ? activeBlocks[selectedBlockIndex] : null
                            }
                            previewHoverCell={previewHoverCell}
                            setPreviewHoverCell={setPreviewHoverCell}
                            onPlaceBlock={handlePlaceBlock}
                            isDragging={isDragging}
                          />

                          {/* Interactive Versus Game-Over Standing Overlay */}
                          {gameOver && gameMode !== "solo" && !matchState.opponentIsGameOver && (
                            <div className="absolute inset-0 bg-[#0e1223]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-3xl border-2 border-white/10 z-40 animate-fade-in shadow-2xl">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-black/50 border border-amber-400/25 shadow-inner">
                                {score > matchState.opponentScore ? "🏆" : "💀"}
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-white font-serif italic text-base uppercase font-bold tracking-tight">
                                  No Valid Placements!
                                </h4>
                                <div className="flex justify-center items-center gap-1.5 pt-0.5">
                                  {score > matchState.opponentScore ? (
                                    <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-mono tracking-wider px-2.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                      CURRENT STANDING: WIN (+{score - matchState.opponentScore} PTS)
                                    </span>
                                  ) : score === matchState.opponentScore ? (
                                    <span className="text-[10px] bg-yellow-500/15 border border-yellow-500/35 text-yellow-400 font-mono tracking-wider px-2.5 py-0.5 rounded-full font-bold uppercase">
                                      CURRENT STANDING: DRAW
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-red-500/15 border border-red-500/35 text-red-400 font-mono tracking-wider px-2.5 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                      CURRENT STANDING: LOSE (-{matchState.opponentScore - score} PTS)
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5 w-full max-w-xs space-y-1">
                                <div className="flex justify-between items-center text-xs font-mono">
                                  <span className="text-white/40">Your Score:</span>
                                  <span className="text-[#d4af37] font-bold">{score}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-mono">
                                  <span className="text-white/40">Opponent ({matchState.opponentName}):</span>
                                  <span className="text-white font-bold">{matchState.opponentScore}</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 w-full max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    resolveMatchOutcome(
                                      score,
                                      matchState.opponentScore,
                                      matchState.opponentLinesCleared,
                                      matchState.opponentBlocksPlaced,
                                      matchState.opponentName
                                    );
                                  }}
                                  className="w-full bg-[#d4af37] hover:bg-[#bfa032] text-slate-900 font-serif italic font-bold text-xs py-2.5 rounded-xl shadow-md transition duration-150 cursor-pointer text-center border-none"
                                >
                                  Claim Outcome & Exit
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRestart}
                                  className="w-full bg-white/10 hover:bg-white/15 border border-white/5 text-white font-serif italic text-xs py-2.5 rounded-xl transition duration-155 cursor-pointer text-center border-none"
                                >
                                  Forfeit / Restart Match
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive sound on/off controls and stats controller row mirroring screenshot layout */}
                        <div className="w-full flex justify-between items-center my-1 z-20 relative">
                          <div className="flex items-center gap-2">
                            <div 
                              onClick={() => setSoundOn((prev) => !prev)}
                              className={`h-7 w-15 rounded-full relative p-0.5 flex items-center select-none cursor-pointer shadow-md transition-colors duration-200 ${
                                soundOn ? "bg-amber-400" : "bg-gray-400"
                              }`}
                              title={soundOn ? "Mute sounds" : "Unmute sounds"}
                            >
                              <div 
                                className={`w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-transform duration-200 ${
                                  soundOn ? "translate-x-8" : "translate-x-0"
                                }`}
                              />
                              <span 
                                className={`absolute font-sans font-extrabold text-[10px] text-white pointer-events-none transition-all duration-200 ${
                                  soundOn ? "left-2.5 opacity-100" : "right-3 opacity-100"
                                }`}
                              >
                                {soundOn ? "ON" : "OFF"}
                              </span>
                            </div>
                          </div>

                          {/* Turn state helper for shared player game session */}
                          {gameMode !== "solo" && (
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-mono uppercase tracking-widest font-extrabold transition-all duration-300 ${
                              currentTurn === "player"
                                ? vsTurnTimer <= 5
                                  ? "bg-red-500/35 border-red-500 text-red-300 animate-pulse"
                                  : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-slate-950/25 border-white/10 text-white/50"
                            }`}>
                              {currentTurn === "player" ? `YOUR TURN (⏱️ ${vsTurnTimer}s)` : "AI THINKING"}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              if (score > 100 && !gameOver) {
                                if (window.confirm("Return to main menu? Your current session progress will be lost.")) {
                                  setCurrentGameScreen("menu");
                                }
                              } else {
                                setCurrentGameScreen("menu");
                              }
                            }}
                            className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 py-1.5 px-3.5 rounded-xl text-white font-serif italic text-[11px] transition-all cursor-pointer shadow-sm text-center font-bold"
                          >
                            Exit Menu
                          </button>
                        </div>

                        {/* Active blocks selector container */}
                        <div className="w-full mt-1 overflow-visible">
                          <BlockChoices
                            activeBlocks={activeBlocks}
                            selectedBlockIndex={selectedBlockIndex}
                            onSelectBlock={handleSelectBlock}
                            previewHoverCell={previewHoverCell}
                            setPreviewHoverCell={setPreviewHoverCell}
                            onPlaceBlock={handlePlaceBlock}
                            board={board}
                            disabled={gameMode !== "solo" && currentTurn !== "player"}
                            setIsDraggingGlobal={setIsDragging}
                          />
                        </div>

                        {/* Visual statistics stats line */}
                        <div className="w-full flex justify-between items-center mt-2 pt-2 border-t border-white/10 text-[10px] text-white/50 font-mono">
                          <div>CLEARS: <strong className="text-white font-extrabold">{linesClearedCurrent}</strong></div>
                          <div className="font-serif italic text-[9px] uppercase tracking-wider text-center">
                            {scoreMultiplier > 1 ? (
                              <span className="text-amber-300 font-black animate-pulse">🔥 MULTIPLIER: {scoreMultiplier}X</span>
                            ) : (
                              <span>{gameMode.toUpperCase()} STACK</span>
                            )}
                          </div>
                          <div>PLACED: <strong className="text-white font-extrabold">{blocksPlacedCurrent}</strong></div>
                        </div>

                        {/* Standard Solo Game Over overlay */}
                        {gameOver && gameMode === "solo" && (
                          <div className="absolute inset-0 bg-[#0e1223]/98 rounded-[28px] flex flex-col items-center justify-center p-6 space-y-5 animate-fade-in z-45">
                            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-3xl shadow-lg shadow-amber-400/10">
                              💀
                            </div>
                            <div className="text-center space-y-1">
                              <h4 className="text-white font-serif italic text-xl tracking-tight uppercase font-extrabold">
                                No Valid Slots!
                              </h4>
                              <p className="text-[11px] text-white/45 font-serif">
                                Available pieces do not fit anywhere on the board.
                              </p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 w-full max-w-xs text-center space-y-1">
                              <p className="text-[9px] font-mono uppercase tracking-wider text-white/40">Round Result:</p>
                              <p className="text-3xl font-mono font-black text-[#ffaa00]">{score}</p>
                              <div className="flex justify-around text-[11px] text-white/40 pt-2 border-t border-white/10">
                                <div className="font-serif italic">
                                  Clears: <strong className="text-white font-mono font-bold">{linesClearedCurrent}</strong>
                                </div>
                                <div className="font-serif italic">
                                  Placed: <strong className="text-white font-mono font-bold">{blocksPlacedCurrent}</strong>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2.5 w-full max-w-xs">
                              <button
                                onClick={handleRestart}
                                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-serif italic font-extrabold text-xs py-2.5 rounded-xl shadow-lg transition duration-150 cursor-pointer text-center border-none"
                              >
                                Try Again
                              </button>
                              <button
                                onClick={() => {
                                  setGameMode("solo");
                                  setCurrentGameScreen("menu");
                                }}
                                className="flex-1 bg-white/10 hover:bg-white/15 border border-white/5 text-white font-serif italic text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center border-none"
                              >
                                Return
                              </button>
                            </div>
                          </div>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
              )}

              {/* Tournament Matchmaking GameOver Modal Container Overlay */}
              {gameMode !== "solo" && matchState.status === "gameover" && (
                <div className="fixed inset-0 bg-sky-950/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
                  <div className="w-full max-w-lg rounded-2xl border-2 border-sky-300 bg-white p-8 text-center space-y-6 shadow-2xl relative">
                    
                    {/* Glowing effect background logo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-sky-400/[0.04] blur-3xl pointer-events-none" />

                    <div className="space-y-2">
                      <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg border ${
                        matchState.winner === "player"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-650 animate-bounce"
                          : matchState.winner === "opponent"
                          ? "bg-rose-50 border-rose-205 text-rose-650"
                          : "bg-sky-50 border-sky-205 text-sky-655"
                      }`}>
                        {matchState.winner === "player" ? "👑" : matchState.winner === "opponent" ? "🦾" : "🤝"}
                      </div>
                      
                      <h3 className="text-2xl font-serif italic font-extrabold text-sky-950 tracking-tight leading-tight">
                        {matchState.winner === "player"
                          ? "VICTORY ATTAINED!"
                          : matchState.winner === "opponent"
                          ? "MATCH ENDED!"
                          : "ROUND DRAW!"}
                      </h3>
                      
                      <p className="text-[10px] font-mono tracking-widest text-sky-700 font-extrabold uppercase">
                        {matchState.winner === "player"
                          ? "You outlasted your challenger"
                          : matchState.winner === "opponent"
                          ? "The bot achieved optimal grids placement"
                          : "Identical performance scores"}
                      </p>
                    </div>

                    {/* Comparative Score Card */}
                    <div className="grid grid-cols-2 gap-4 bg-sky-50/70 border border-sky-100 p-5 rounded-xl">
                      {/* Local player */}
                      <div className="border-r border-sky-200/60 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-sky-800/60 block font-bold">Your Score</span>
                        <h4 className="text-3xl font-mono text-sky-900 font-black">{score}</h4>
                        <div className="text-[10px] font-serif text-sky-800/50 italic">
                          Clears: <strong className="text-sky-950 font-mono font-bold">{linesClearedCurrent}</strong>
                        </div>
                      </div>

                      {/* Match opponent */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-cyan-600 block font-bold">{matchState.opponentName}</span>
                        <h4 className="text-3xl font-mono text-sky-600 font-black">{matchState.opponentScore}</h4>
                        <div className="text-[10px] font-serif text-sky-800/50 italic">
                          Clears: <strong className="text-sky-950 font-mono font-bold">{matchState.opponentLinesCleared}</strong>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-sky-800/70 font-serif leading-relaxed italic px-6">
                      Results have been posted to <code className="text-sky-700 bg-sky-100 font-bold px-1.5 py-0.5 rounded font-mono">GameServlet.java</code> and synched to the global leaderboards registries.
                    </p>

                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setGameMode("solo");
                          setCurrentGameScreen("menu");
                        }}
                        className="py-2.5 px-6 border border-sky-200 hover:border-sky-400 text-sky-800 hover:text-sky-950 rounded-lg text-xs font-serif italic transition duration-200 cursor-pointer bg-white shadow-sm"
                      >
                        Return to Menu
                      </button>
                      <button
                        onClick={handleRestart}
                        className="bg-sky-500 hover:bg-sky-650 text-white font-serif italic font-bold text-xs py-2.5 px-8 rounded-lg shadow-md shadow-sky-500/15 transition duration-200 cursor-pointer"
                      >
                        Rematch Opponent
                      </button>
                    </div>

                  </div>
                </div>
              )}

              </motion.div>
            )
          ) : activePane === "profile" ? (
            <motion.div
              key="profile-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-[420px] mx-auto"
            >
              <UserProfilePanel
                currentProfile={currentProfile}
                allProfiles={profiles}
                highScoresList={highScores}
                globalScoresList={globalScores}
                onUpdateProfile={handleUpdateUserProfile}
                onSelectProfile={handleSelectUserProfile}
                onClearScores={handleClearScores}
                onCreateProfile={handleCreateUserProfile}
                onClearGlobalScores={handleClearGlobalScores}
                initialTab="edit"
                onBack={() => setActivePane("game")}
              />
            </motion.div>
          ) : activePane === "leaderboard" ? (
            <motion.div
              key="leaderboard-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-[430px] mx-auto"
            >
              <LeaderboardSection
                currentProfile={currentProfile}
                allProfiles={profiles}
                highScoresList={highScores}
                globalScoresList={globalScores}
                onClearScores={handleClearScores}
                onClearGlobalScores={handleClearGlobalScores}
                onSelectProfile={handleSelectUserProfile}
                onBack={() => setActivePane("game")}
              />
            </motion.div>
          ) : (
            /* Eclipse workspace view toggles list */
            <motion.div
              key="exporter-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <SourceCodeHub />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Main Bottom Footer Section */}
      <footer className="bg-sky-50 py-6 border-t border-sky-100 text-center text-xs text-sky-850/60 font-serif italic">
        <p>© 2026 NeoBlocks Mobile DAO Exporter. Styled and coded for standard JSTL + Servlets JEE specifications.</p>
      </footer>

      {/* Settings Overlay Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            id="settings-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              id="settings-modal-content"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-md rounded-2xl border-2 border-sky-300 bg-white p-6 shadow-2xl relative space-y-6 text-left"
            >
              {/* Header block */}
              <div className="flex justify-between items-center pb-3 border-b border-sky-100">
                <h3 className="text-lg font-serif italic text-sky-950 flex items-center gap-2 font-bold select-none">
                  <svg
                    className="w-5 h-5 text-sky-550"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  System Control Deck
                </h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-sky-700/60 hover:text-sky-950 transition duration-150 p-1 rounded hover:bg-sky-50 cursor-pointer text-xs font-mono font-bold"
                >
                  CLOSE [ESC]
                </button>
              </div>

              {/* Volume measurements */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-sky-700 tracking-widest uppercase font-extrabold">
                    Audio Configuration
                  </span>
                  <span className="text-[10px] text-sky-850/50 font-mono font-bold">
                    SYNTH OUTPUT: {soundOn ? "ACTIVE" : "MUTED"}
                  </span>
                </div>

                <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-sky-900 font-semibold font-sans">
                      Master Volume:
                    </span>
                    <span className="text-xs font-mono text-sky-600 font-black">
                      {volumePct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const nextSoundOn = !soundOn;
                        setSoundOn(nextSoundOn);
                        if (nextSoundOn && volumePct === 0) {
                          setVolumePct(25);
                        }
                      }}
                      className="text-sky-700 hover:text-sky-950 transition duration-150 p-1.5 bg-white border border-sky-200 hover:border-sky-400 rounded-lg cursor-pointer flex items-center justify-center shadow-sm"
                      title={soundOn ? "Mute Game Sounds" : "Unmute Game Sounds"}
                    >
                      {soundOn && volumePct > 0 ? (
                        <Volume2 className="w-4 h-4 text-sky-500" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-rose-500" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volumePct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setVolumePct(val);
                        if (val > 0) {
                          setSoundOn(true);
                        } else {
                          setSoundOn(false);
                        }
                      }}
                      className="flex-grow accent-sky-500 bg-sky-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Actions section */}
              {currentGameScreen === "playing" && (
                <div className="space-y-4 pt-4 border-t border-sky-100">
                  <span className="text-xs font-mono text-sky-700/60 tracking-widest uppercase block font-extrabold">
                    Active Arena Actions
                  </span>

                  <div className="flex flex-col gap-2.5">
                    {/* Restart match option: Solo & Vs AI modes only */}
                    {(gameMode === "solo" || gameMode === "vs_ai") && (
                      <button
                        onClick={() => {
                          handleRestart();
                          setSettingsOpen(false);
                        }}
                        className="w-full bg-white hover:bg-sky-50 border border-sky-200 text-sky-850 font-serif italic text-xs py-2.5 rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-500" />
                        Restart Arena Match
                      </button>
                    )}

                    {/* Return to Home Page / Menu option */}
                    <button
                      onClick={() => {
                        setBoard(INITIAL_BOARD_STATE());
                        setScore(0);
                        setLinesClearedCurrent(0);
                        setBlocksPlacedCurrent(0);
                        setSelectedBlockIndex(null);
                        setPreviewHoverCell(null);
                        setGameOver(false);
                        setScoreNotification("");
                        setMatchState((prev) => ({ ...prev, status: "idle" }));
                        setCurrentGameScreen("menu");
                        setSettingsOpen(false);
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-650 border border-sky-400 text-white font-serif italic text-xs py-2.5 rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-white animate-pulse" />
                      Return to Home Page
                    </button>
                  </div>

                  {/* VS Player Game Mode Quit Game Section */}
                  {gameMode === "vs_player" && (
                    <div className="mt-4 p-4 border border-rose-200 bg-rose-50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-650">
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                        <span className="text-[11px] font-mono tracking-wider uppercase font-bold">
                          Quit Active Arena Game
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-800/70 font-serif italic">
                        Forfeiting will save your current score stats of {score} points and resolve matchmaking with a defeat outcome.
                      </p>
                      <button
                        onClick={() => {
                          resolveMatchOutcome(
                            score,
                            matchState.opponentScore,
                            matchState.opponentLinesCleared,
                            matchState.opponentBlocksPlaced,
                            matchState.opponentName
                          );
                          // Set active screen back to menu/home and close settings modal
                          setCurrentGameScreen("menu");
                          setSettingsOpen(false);
                        }}
                        className="w-full bg-rose-500 hover:bg-rose-650 text-white font-serif italic font-bold text-xs py-2 rounded-lg transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-200"
                      >
                        Quit active VS Player Match
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

}
