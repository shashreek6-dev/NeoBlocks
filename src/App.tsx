import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  HelpCircle,
  Lock,
  Play,
  CheckCircle,
  Compass,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { BlockShape } from "./types";
import { getRandomBlocks } from "./blocks";
import GameBoard from "./components/GameBoard";
import BlockChoices from "./components/BlockChoices";
import CelebrationOverlay from "./components/CelebrationOverlay";
import ConfettiEffect from "./components/ConfettiEffect";
import { LEVELS_DATA, WORLDS, LevelData } from "./levelsData";
import {
  playSelectSound,
  playPlaceSound,
  playClearSound,
  playGameOverSound,
  setVolume
} from "./utils/audio";

// Check if a block shape can fit anywhere on the current grid
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

// Initial empty board grid matrix
const createEmptyBoard = () =>
  Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

export default function App() {
  // Game Audio State
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("neoblocks_sound_on");
    return saved !== "false";
  });

  // Level & World Progression State
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem("neoblocks_unlocked_level");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [currentLevelId, setCurrentLevelId] = useState<number>(() => {
    const saved = localStorage.getItem("neoblocks_current_level");
    const parsed = saved ? parseInt(saved, 10) : 1;
    // Cap at unlocked level
    const maxUnlocked = saved ? parseInt(saved, 10) : 1;
    return Math.min(parsed, maxUnlocked);
  });

  const [currentWorldId, setCurrentWorldId] = useState<number>(1);
  const [currentView, setCurrentView] = useState<"dashboard" | "gameplay">("dashboard");

  // Core Puzzle Engine State
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [activeBlocks, setActiveBlocks] = useState<(BlockShape | null)[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | "hold" | null>(null);
  const [previewHoverCell, setPreviewHoverCell] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [initialBlockCount, setInitialBlockCount] = useState<number>(0);

  // Zen Mode state
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [zenNotification, setZenNotification] = useState<string | null>(null);
  const [zenClearing, setZenClearing] = useState<boolean>(false);

  // Held block state
  const [heldBlock, setHeldBlock] = useState<BlockShape | null>(null);

  // Combo burst confetti triggers
  const [comboActive, setComboActive] = useState<boolean>(false);
  const [comboType, setComboType] = useState<"cascade" | "perfect">("cascade");

  // Scores
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("neoblocks_high_score_global");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [levelClearedCount, setLevelClearedCount] = useState<number>(0);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);

  // Visual juice overlays
  const [celebrationActive, setCelebrationActive] = useState<boolean>(false);
  const [isStuck, setIsStuck] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // Get current level data specification
  const currentLevel: LevelData =
    LEVELS_DATA.find((l) => l.id === currentLevelId) || LEVELS_DATA[0];

  // Keep world ID updated with level
  useEffect(() => {
    if (currentLevel) {
      setCurrentWorldId(currentLevel.world);
    }
  }, [currentLevelId]);

  // Sync sound setting
  useEffect(() => {
    localStorage.setItem("neoblocks_sound_on", String(soundOn));
    setVolume(soundOn ? 0.25 : 0);
  }, [soundOn]);

  // Calculate Grid Cleared %
  const getGridClearedPercentage = () => {
    let filledCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r] && board[r][c] !== null) {
          filledCount++;
        }
      }
    }
    if (initialBlockCount === 0) return 100;
    return Math.max(0, Math.min(100, Math.round(((initialBlockCount - filledCount) / initialBlockCount) * 100)));
  };

  // Initialize a level and prefill the bioluminescent block cells
  const initializeLevel = useCallback((levelId: number) => {
    // 1. Create a clean 8x8 grid
    const newBoard = createEmptyBoard();

    // 2. Spawn procedurally randomized grid field based on levelId
    const minTiles = Math.min(22, 8 + Math.floor((levelId - 1) * 1.5));
    const maxTiles = Math.min(28, 12 + Math.floor((levelId - 1) * 1.5));
    const targetCount = Math.floor(Math.random() * (maxTiles - minTiles + 1)) + minTiles;

    const SPAWNABLE_SHAPES = [
      { matrix: [[1]], name: "Dot" },
      { matrix: [[1, 1]], name: "H-Line 2" },
      { matrix: [[1], [1]], name: "V-Line 2" },
      { matrix: [[1, 1, 1]], name: "H-Line 3" },
      { matrix: [[1], [1], [1]], name: "V-Line 3" },
      { matrix: [[1, 1], [1, 1]], name: "Square 2x2" },
      { matrix: [[1, 0], [1, 1]], name: "Corner Triomino Bottom-Left" },
      { matrix: [[0, 1], [1, 1]], name: "Corner Triomino Bottom-Right" },
      { matrix: [[1, 1], [1, 0]], name: "Corner Triomino Top-Left" },
      { matrix: [[1, 1], [0, 1]], name: "Corner Triomino Top-Right" },
    ];

    const NEON_COLORS = [
      "from-neon-pink-from to-neon-pink-to",
      "from-neon-cyan-from to-neon-cyan-to",
      "from-neon-purple-from to-neon-purple-to",
      "from-neon-orange-from to-neon-orange-to",
      "from-neon-green-from to-neon-green-to"
    ];

    let currentFilledCount = 0;
    let attempts = 0;

    while (currentFilledCount < targetCount && attempts < 200) {
      attempts++;
      const shape = SPAWNABLE_SHAPES[Math.floor(Math.random() * SPAWNABLE_SHAPES.length)];
      const shapeRows = shape.matrix.length;
      const shapeCols = shape.matrix[0].length;

      let shapeCellsCount = 0;
      for (let r = 0; r < shapeRows; r++) {
        for (let c = 0; c < shapeCols; c++) {
          if (shape.matrix[r][c] === 1) {
            shapeCellsCount++;
          }
        }
      }

      if (currentFilledCount + shapeCellsCount > targetCount && shapeCellsCount > 1 && attempts < 100) {
        continue;
      }

      const maxR = 8 - shapeRows;
      const maxC = 8 - shapeCols;
      if (maxR < 0 || maxC < 0) continue;

      const startR = Math.floor(Math.random() * (maxR + 1));
      const startC = Math.floor(Math.random() * (maxC + 1));

      let canPlace = true;
      for (let r = 0; r < shapeRows; r++) {
        for (let c = 0; c < shapeCols; c++) {
          if (shape.matrix[r][c] === 1) {
            if (newBoard[startR + r][startC + c] !== null) {
              canPlace = false;
              break;
            }
          }
        }
        if (!canPlace) break;
      }

      if (canPlace) {
        const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
        for (let r = 0; r < shapeRows; r++) {
          for (let c = 0; c < shapeCols; c++) {
            if (shape.matrix[r][c] === 1) {
              newBoard[startR + r][startC + c] = color;
            }
          }
        }
        currentFilledCount += shapeCellsCount;
      }
    }

    // 3. Set states
    setBoard(newBoard);
    setInitialBlockCount(currentFilledCount);
    setActiveBlocks(getRandomBlocks(3, newBoard));
    setSelectedBlockIndex(null);
    setPreviewHoverCell(null);
    setHeldBlock(null);
    setIsZenMode(false);
    setScore(0);
    setScoreMultiplier(1);
    setIsStuck(false);
    setCelebrationActive(false);

    // Persist active level selection
    localStorage.setItem("neoblocks_current_level", String(levelId));

    if (soundOn) {
      playSelectSound();
    }
  }, [soundOn]);

  // Handle starting/loading game initially
  useEffect(() => {
    initializeLevel(currentLevelId);
  }, [currentLevelId, initializeLevel]);

  // Reset current level manually
  const handleResetLevel = () => {
    initializeLevel(currentLevelId);
  };

  // Storing/swapping a block in the Shard Storage Dock (Hold Mechanic)
  const handleHoldBlock = (idx: number) => {
    const blockToHold = activeBlocks[idx];
    if (!blockToHold) return;

    if (soundOn) {
      playSelectSound();
    }

    if (heldBlock === null) {
      setHeldBlock(blockToHold);
      const updated = [...activeBlocks];
      updated[idx] = null;
      setActiveBlocks(updated);
      setSelectedBlockIndex(null);

      if (updated.every((b) => b === null)) {
        const generated = getRandomBlocks(3, board);
        setActiveBlocks(generated);
      }
    } else {
      const previousHeld = heldBlock;
      setHeldBlock(blockToHold);
      const updated = [...activeBlocks];
      updated[idx] = previousHeld;
      setActiveBlocks(updated);
      setSelectedBlockIndex(null);
    }
  };

  // Switch between worlds
  const handleSelectWorld = (worldId: number) => {
    // World lock checks
    const firstLevelOfWorld = LEVELS_DATA.find((l) => l.world === worldId);
    if (!firstLevelOfWorld) return;

    if (unlockedLevel < firstLevelOfWorld.id) {
      // World is locked
      if (soundOn) {
        playGameOverSound();
      }
      return;
    }

    setCurrentWorldId(worldId);
    // Auto load first level of that world
    setCurrentLevelId(firstLevelOfWorld.id);
  };

  // Drag and drop block placement handler
  const handlePlaceBlock = (r: number, c: number, forceBlockIdx?: number | "hold") => {
    const blockIdx = forceBlockIdx !== undefined ? forceBlockIdx : selectedBlockIndex;
    if (blockIdx === null) return;

    const block = blockIdx === "hold" ? heldBlock : activeBlocks[blockIdx as number];
    if (!block) return;

    const shapeRows = block.matrix.length;
    const shapeCols = block.matrix[0].length;

    // Double check placing coordinates safety boundaries
    if (r + shapeRows > 8 || c + shapeCols > 8) {
      if (soundOn) playGameOverSound();
      return;
    }

    // Verify cell collisions
    const newBoard = board.map((rowVec) => [...rowVec]);
    let collision = false;

    for (let i = 0; i < shapeRows; i++) {
      for (let j = 0; j < shapeCols; j++) {
        if (block.matrix[i][j] === 1) {
          const targetR = r + i;
          const targetC = c + j;
          if (newBoard[targetR][targetC] !== null) {
            collision = true;
          } else {
            newBoard[targetR][targetC] = block.color;
          }
        }
      }
    }

    if (collision) {
      if (soundOn) playGameOverSound();
      return;
    }

    // Sound effect
    if (soundOn) {
      playPlaceSound();
    }

    // Calculate score points for cells placed
    const cellsPlacedCount = block.matrix.flat().filter(v => v === 1).length;
    let turnScore = cellsPlacedCount * 10;

    // Check for row/column clearances
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Find full rows
    for (let row = 0; row < 8; row++) {
      if (newBoard[row].every((cell) => cell !== null)) {
        rowsToClear.push(row);
      }
    }

    // Find full columns
    for (let col = 0; col < 8; col++) {
      let colFull = true;
      for (let row = 0; row < 8; row++) {
        if (newBoard[row][col] === null) {
          colFull = false;
          break;
        }
      }
      if (colFull) {
        colsToClear.push(col);
      }
    }

    // Clear rows and columns
    rowsToClear.forEach((row) => {
      newBoard[row].fill(null);
    });
    colsToClear.forEach((col) => {
      for (let row = 0; row < 8; row++) {
        newBoard[row][col] = null;
      }
    });

    const linesClearedCount = rowsToClear.length + colsToClear.length;
    if (linesClearedCount > 0) {
      if (soundOn) {
        playClearSound(linesClearedCount);
      }

      // Combo scale multipliers
      const baseLinePoints = linesClearedCount * 120;
      const multiplierAwarded = linesClearedCount;
      const currentComboMultiplier = scoreMultiplier;

      turnScore += baseLinePoints * currentComboMultiplier;
      setScoreMultiplier((prev) => prev + multiplierAwarded);

      // Trigger high-satisfaction musical and particle blast sequential scaling for multi-clears
      if (linesClearedCount >= 2) {
        setComboType(linesClearedCount >= 3 ? "perfect" : "cascade");
        setComboActive(true);
        setTimeout(() => {
          setComboActive(false);
        }, 1500);
      }
    } else {
      // Placing blocks without clearing resets combo multiplier to 1
      setScoreMultiplier(1);
    }

    // Update board state
    setBoard(newBoard);

    // Consume the choice slot or held slot
    const updatedActiveBlocks = [...activeBlocks];
    if (blockIdx === "hold") {
      setHeldBlock(null);
    } else {
      updatedActiveBlocks[blockIdx as number] = null;
      setActiveBlocks(updatedActiveBlocks);
    }
    setSelectedBlockIndex(null);

    // Calculate cumulative score
    const newTotalScore = score + turnScore;
    setScore(newTotalScore);

    // Check & save high scores
    if (newTotalScore > highScore) {
      setHighScore(newTotalScore);
      localStorage.setItem("neoblocks_high_score_global", String(newTotalScore));
    }

    // If all three block selections are placed, generate a fresh batch of choices
    const allPlaced = updatedActiveBlocks.every((b) => b === null);
    let nextChoices = updatedActiveBlocks;
    if (allPlaced) {
      const generated = getRandomBlocks(3, newBoard);
      setActiveBlocks(generated);
      nextChoices = generated;
      if (soundOn) playSelectSound();
    }

    // Evaluate Win Condition: board is 100% empty (Perfect Clear Victory)
    const isBoardEmpty = newBoard.every((rowVec) => rowVec.every((cell) => cell === null));
    if (isBoardEmpty) {
      if (isZenMode) {
        setZenNotification("✨ Perfect Zen Grid Cleared! 🌸");
        setTimeout(() => setZenNotification(null), 2500);
      } else {
        // TRIGGER FULL CELEBRATION!
        setCelebrationActive(true);

        // Unlock next level progression
        const nextLevelNum = currentLevelId + 1;
        if (nextLevelNum <= LEVELS_DATA.length && unlockedLevel === currentLevelId) {
          setUnlockedLevel(nextLevelNum);
          localStorage.setItem("neoblocks_unlocked_level", String(nextLevelNum));
        }
        return;
      }
    }

    // Evaluate Stuck/Lose Condition: No remaining blocks can fit on the board
    const remainingBlocks = nextChoices.filter((b) => b !== null) as BlockShape[];
    const allCandidates = [...remainingBlocks];
    if (heldBlock && blockIdx !== "hold") {
      allCandidates.push(heldBlock);
    }

    if (allCandidates.length > 0) {
      const anyCanFit = allCandidates.some((block) => canDrop(newBoard, block));
      if (!anyCanFit) {
        if (isZenMode) {
          // Zen Mode Stuck: Clear a random selection of blocks with a smooth dissolve fade effect
          setZenClearing(true);
          setZenNotification("💫 No Moves! Dissolving block shards smoothly... 💫");
          setTimeout(() => {
            const resolvedBoard = newBoard.map(row => row.map(cell => {
              if (cell !== null && Math.random() < 0.6) {
                return null;
              }
              return cell;
            }));

            // Ensure we clear at least 15 block cells
            let clearedCount = 0;
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                if (newBoard[r][c] !== null && resolvedBoard[r][c] === null) {
                  clearedCount++;
                }
              }
            }
            if (clearedCount < 15) {
              for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                  if (resolvedBoard[r][c] !== null && Math.random() < 0.5) {
                    resolvedBoard[r][c] = null;
                  }
                }
              }
            }

            setBoard(resolvedBoard);
            setZenClearing(false);
            setZenNotification(null);
          }, 1500);
        } else {
          setIsStuck(true);
          if (soundOn) {
            playGameOverSound();
          }
        }
      }
    }
  };

  // Next level transition action from the celebration overlay
  const handleNextLevel = () => {
    const nextLvlId = currentLevelId + 1;
    if (nextLvlId <= LEVELS_DATA.length) {
      setCurrentLevelId(nextLvlId);
    } else {
      // Reached final level, loop or celebrate!
      setCelebrationActive(false);
    }
  };

  return (
    <div 
      className="bg-[#030408]/95 flex items-center justify-center select-none p-0 sm:p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        touchAction: "none"
      }}
    >
      {/* Blurred ambient background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ea00d9]/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00f0ff]/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse" />

      {/* Main Mobile Shell */}
      <div 
        className="w-full max-w-[420px] border-x border-white/10 bg-[#06080e] text-white font-sans flex flex-col justify-between overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] selection:bg-[#00f0ff]/20 crt-container"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          height: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
          touchAction: "none"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#130722] via-[#080914] to-[#040508] pointer-events-none z-0" />
        <div className="grid-floor" />

        {/* 🔮 Active Celebratory Confetti & Next Level Dialog Component */}
        {celebrationActive && (
          <CelebrationOverlay
            levelNumber={currentLevelId}
            levelName={currentLevel.name}
            onNextLevel={handleNextLevel}
            soundOn={soundOn}
          />
        )}

        {/* 💫 Multi-Line Combo Particle Explosion */}
        <ConfettiEffect active={comboActive} type={comboType} />

        {/* 🚀 Header Module */}
        <header className="w-full z-20 px-3 py-2 border-b border-[#00f0ff]/10 flex items-center justify-between gap-2 bg-[#06080e]/80 backdrop-blur-sm relative flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ea00d9] to-[#00f0ff] p-[1.5px] shadow-[0_0_10px_rgba(234,0,217,0.3)]">
              <div className="w-full h-full bg-[#0d0e15] rounded-[5px] flex items-center justify-center font-bold text-xs text-[#00f0ff]">
                NB
              </div>
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight font-sans text-white leading-none">
                NEOBLOCKS
              </h1>
              <span className="text-[7px] font-mono tracking-widest text-[#00f0ff] uppercase block mt-0.5">
                Offline Zen
              </span>
            </div>
          </div>

          {/* 🔊 Audio, Instructions and Control Options */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowInstructions((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-all text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                showInstructions
                  ? "bg-[#ea00d9]/25 border-[#ea00d9] text-white"
                  : "bg-[#0b0c13] border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Rules</span>
            </button>

            <button
              onClick={() => setSoundOn((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                soundOn
                  ? "bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88]"
                  : "bg-[#0b0c13] border-white/10 text-gray-500"
              }`}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleResetLevel}
              className="p-1.5 rounded-lg border border-white/10 bg-[#0b0c13] hover:bg-white/5 text-gray-400 hover:text-[#ff007f] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 🧭 Conditional View Engine */}
        {currentView === "dashboard" ? (
          <div className="flex-grow flex flex-col justify-between overflow-y-auto no-scrollbar relative z-10 pb-2">
            {/* 🧭 Progression Journey Sector */}
            <section className="w-full px-3 py-2 flex flex-col gap-2 bg-[#080911]/60 flex-shrink-0">
              {/* World Select Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                {WORLDS.map((world) => {
                  const firstLevelOfWorld = LEVELS_DATA.find((l) => l.world === world.id);
                  const isWorldLocked = firstLevelOfWorld ? unlockedLevel < firstLevelOfWorld.id : true;

                  return (
                    <button
                      key={world.id}
                      onClick={() => handleSelectWorld(world.id)}
                      className={`relative px-2 py-1.5 rounded-lg border text-center transition-all overflow-hidden flex flex-col justify-center items-center h-[52px] cursor-pointer ${
                        currentWorldId === world.id
                          ? "bg-[#0c0d15] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)] scale-[1.01]"
                          : isWorldLocked
                          ? "bg-[#07080d]/40 border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-[#07080d]/80 border-white/10 hover:border-white/20"
                      }`}
                      disabled={isWorldLocked && currentWorldId !== world.id}
                    >
                      <span className="text-[7px] font-mono tracking-widest uppercase text-gray-400">
                        World 0{world.id}
                      </span>
                      <p className="text-[10px] font-black truncate text-white leading-tight mt-0.5">
                        {world.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Level Circle Select Map */}
              <div className="p-2 bg-[#0c0d15]/90 border border-white/10 rounded-xl flex flex-wrap gap-1.5 items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                {LEVELS_DATA.filter((l) => l.world === currentWorldId).map((lvl) => {
                  const isLvlLocked = lvl.id > unlockedLevel;
                  const isLvlActive = lvl.id === currentLevelId;

                  return (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        if (!isLvlLocked) {
                          setCurrentLevelId(lvl.id);
                        }
                      }}
                      disabled={isLvlLocked}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isLvlActive
                          ? "bg-gradient-to-br from-[#ea00d9] to-[#00f0ff] text-white shadow-[0_0_8px_rgba(234,0,217,0.5)] border border-white cursor-pointer scale-105"
                          : isLvlLocked
                          ? "bg-[#07080d]/60 border border-white/5 text-gray-600 cursor-not-allowed"
                          : "bg-[#0b0c13] border border-[#00f0ff]/20 text-gray-300 hover:border-[#ea00d9] cursor-pointer"
                      }`}
                    >
                      {isLvlLocked ? <Lock className="w-2.5 h-2.5 text-gray-600" /> : lvl.id}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 📖 Guidelines drawer details */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full px-3 overflow-hidden mt-1 flex-shrink-0"
                >
                  <div className="p-3 rounded-xl bg-[#0a0c16] border border-[#00f0ff]/20 text-xs text-gray-300 flex flex-col gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                    <p className="font-extrabold text-[#00f0ff] uppercase tracking-wider font-sans text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#ea00d9]" /> Rules: How to Achieve Zen
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 font-mono text-[9px] leading-tight text-gray-400">
                      <li>Every level loads pre-filled cells on the 8x8 grid.</li>
                      <li>Drag blocks from bottom and fit them on the board.</li>
                      <li>Full rows or columns cleared clears everything within them.</li>
                      <li><strong className="text-[#00ff88]">Win Condition:</strong> Clear the board 100% empty (0 filled cells).</li>
                      <li>If you run out of coordinates, you must try again!</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🎮 Core Screen Area */}
            <main className="w-full flex-grow px-3 py-2 flex flex-col gap-2 justify-center">
              {/* Level Info Header Panel */}
              <div className="p-3 bg-[#080911]/90 border border-[#00f0ff]/10 rounded-xl relative shadow-md flex flex-col items-center text-center flex-shrink-0">
                <div className="flex items-center gap-1 bg-[#ea00d9]/10 px-2 py-0.5 rounded border border-[#ea00d9]/20 font-mono text-[8px] text-[#ea00d9] uppercase font-bold animate-pulse mb-1">
                  <Zap className="w-2 h-2 text-[#ea00d9]" /> {currentLevel.worldName}
                </div>

                <span className="text-[8px] font-mono uppercase tracking-widest text-gray-400">
                  Level {currentLevelId} of 15
                </span>
                <h2 className="text-sm font-black text-white tracking-tight mt-0.5 font-sans">
                  {currentLevel.name}
                </h2>
                <p className="text-[10px] text-gray-300 mt-1 font-mono leading-relaxed max-w-[280px]">
                  {currentLevel.description}
                </p>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent my-2" />

                {/* Perfect Clear visual requirement prompt */}
                <div className="flex items-center gap-1.5 bg-[#00ff88]/5 border border-[#00ff88]/15 px-2 py-0.5 rounded-lg mb-2">
                  <CheckCircle className="w-3 h-3 text-[#00ff88] flex-shrink-0" />
                  <p className="text-[9px] font-mono uppercase tracking-wide text-gray-300">
                    Goal: <span className="text-[#00ff88] font-bold">100% EMPTY GRID</span>
                  </p>
                </div>

                {/* Mode Selector Option Panel */}
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[240px] justify-center items-center mt-1">
                  <button
                    onClick={() => {
                      if (soundOn) {
                        playSelectSound();
                      }
                      setIsZenMode(false);
                      initializeLevel(currentLevelId);
                      setCurrentView("gameplay");
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-[#ea00d9] to-[#00f0ff] hover:brightness-110 text-white font-black rounded-lg shadow-[0_0_12px_rgba(234,0,217,0.35)] transition-all cursor-pointer font-sans tracking-widest uppercase text-[9px] flex items-center justify-center gap-1 border border-white/20 hover:scale-[1.02] active:scale-[0.98] animate-pulse"
                  >
                    <Play className="w-2.5 h-2.5 fill-white" />
                    CAMPAIGN
                  </button>
                  <button
                    onClick={() => {
                      if (soundOn) {
                        playSelectSound();
                      }
                      setIsZenMode(true);
                      const cleanBoard = createEmptyBoard();
                      setBoard(cleanBoard);
                      setInitialBlockCount(0);
                      setActiveBlocks(getRandomBlocks(3, cleanBoard));
                      setSelectedBlockIndex(null);
                      setPreviewHoverCell(null);
                      setHeldBlock(null);
                      setScore(0);
                      setScoreMultiplier(1);
                      setIsStuck(false);
                      setCelebrationActive(false);
                      setCurrentView("gameplay");
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-[#00f0ff] to-[#00ff88] hover:brightness-110 text-black font-black rounded-lg shadow-[0_0_12px_rgba(0,240,255,0.35)] transition-all cursor-pointer font-sans tracking-widest uppercase text-[9px] flex items-center justify-center gap-1 border border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-black" />
                    ZEN MODE
                  </button>
                </div>
              </div>

              {/* Scores Widget */}
              <div className="grid grid-cols-2 gap-2 max-w-[280px] mx-auto w-full flex-shrink-0">
                <div className="p-1.5 bg-[#080911]/90 border border-white/5 rounded-lg text-center shadow-md relative">
                  <span className="text-[7px] font-mono text-gray-400 uppercase tracking-widest block leading-none">
                    Current
                  </span>
                  <p className="text-xs font-black text-[#00f0ff] font-sans mt-0.5">
                    {score}
                  </p>
                </div>

                <div className="p-1.5 bg-[#080911]/90 border border-white/5 rounded-lg text-center shadow-md flex flex-col justify-center items-center">
                  <div className="flex items-center gap-0.5">
                    <Trophy className="w-2 h-2 text-[#ff6b00]" />
                    <span className="text-[7px] font-mono text-gray-400 uppercase tracking-widest block leading-none">
                      Best
                    </span>
                  </div>
                  <p className="text-xs font-black text-[#ff6b00] font-sans mt-0.5">
                    {highScore}
                  </p>
                </div>
              </div>
            </main>
          </div>
        ) : (
          /* 🕹️ DEDICATED ISOLATED GAMEPLAY VIEW */
          <main className="w-full flex-grow z-10 px-3 py-2 flex flex-col items-center justify-between gap-1 relative overflow-hidden">
            
            {/* Top Bar HUD */}
            <div className="w-full flex flex-col gap-1 border-b border-white/10 pb-2 bg-[#080911]/40 px-3 pt-1 flex-shrink-0">
              <div className="flex items-center justify-between">
                {/* Back Button */}
                <button
                  onClick={() => {
                    if (soundOn) {
                      playSelectSound();
                    }
                    setCurrentView("dashboard");
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[#00f0ff]/20 bg-[#0b0c13] hover:bg-[#ea00d9]/10 hover:border-[#ea00d9]/40 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider"
                >
                  <ArrowLeft className="w-3 h-3 text-[#ea00d9]" />
                  Back
                </button>

                {/* Centered Level Name */}
                <div className="text-center">
                  <span className="text-[7px] font-mono uppercase text-[#00f0ff] tracking-widest font-bold block">
                    {isZenMode ? "ENDLESS MODE" : `World ${currentLevel.world} • Level ${currentLevelId}`}
                  </span>
                  <h3 className="text-[10px] font-black font-sans text-white leading-none">
                    {isZenMode ? "🌌 COSMIC ZEN" : currentLevel.name}
                  </h3>
                </div>

                {/* Score Display */}
                <div className="text-right font-mono">
                  <span className="text-[7px] text-gray-400 uppercase block tracking-widest leading-none">Score</span>
                  <span className="text-xs font-black text-[#00f0ff]">{score}</span>
                </div>
              </div>

              {/* Stylized Progress Bar tracking Grid Cleared % */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] font-mono uppercase tracking-wider text-gray-400 whitespace-nowrap">
                  {isZenMode ? "Zen Focus:" : "Cleared:"}
                </span>
                <div className="flex-grow h-1.5 bg-black/50 border border-white/10 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#ea00d9] to-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: isZenMode ? "100%" : `${getGridClearedPercentage()}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold text-[#00ff88] w-8 text-right">
                  {isZenMode ? "∞" : `${getGridClearedPercentage()}%`}
                </span>
              </div>
            </div>

            {/* Centered Game board wrapper container */}
            <div className="relative w-full flex justify-center items-center my-auto px-2 max-w-[365px]">
              <GameBoard
                board={board}
                selectedBlock={selectedBlockIndex !== null ? (selectedBlockIndex === "hold" ? heldBlock : activeBlocks[selectedBlockIndex]) : null}
                previewHoverCell={previewHoverCell}
                setPreviewHoverCell={setPreviewHoverCell}
                onPlaceBlock={handlePlaceBlock}
                isDragging={isDragging}
              />

              {/* Zen notification overlay */}
              <AnimatePresence>
                {zenNotification && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-x-4 bg-[#0a051d]/95 border-2 border-[#00f0ff] p-3 text-center rounded-xl z-40 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  >
                    <p className="text-[10px] font-mono font-bold text-white uppercase tracking-widest animate-pulse">
                      {zenNotification}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stuck Overlay (No Moves Possible) */}
              <AnimatePresence>
                {isStuck && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center rounded-2xl"
                  >
                    <span className="text-3xl mb-1">🛰️</span>
                    <h3 className="text-sm font-black tracking-tight text-[#ff007f] uppercase font-sans">
                      No Moves Possible!
                    </h3>
                    <p className="text-gray-400 text-[9px] font-mono mt-0.5 mb-3 max-w-[200px]">
                      None of your remaining blocks fit on the current board coordinates.
                    </p>

                    <button
                      onClick={handleResetLevel}
                      className="py-2 px-4 bg-gradient-to-r from-[#ff007f] to-[#cc005f] text-white font-extrabold rounded-lg shadow-[0_0_10px_rgba(255,0,127,0.35)] cursor-pointer hover:scale-105 transition-all text-[9px] font-mono uppercase tracking-wider"
                    >
                      Try Level Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Tray Anchor: 3-Slot Selection Slot Panel */}
            <div className="w-full px-2 pb-2">
              <BlockChoices
                activeBlocks={activeBlocks}
                selectedBlockIndex={selectedBlockIndex}
                onSelectBlock={setSelectedBlockIndex}
                previewHoverCell={previewHoverCell}
                setPreviewHoverCell={setPreviewHoverCell}
                onPlaceBlock={handlePlaceBlock}
                board={board}
                disabled={isStuck || celebrationActive || zenClearing}
                setIsDraggingGlobal={setIsDragging}
                heldBlock={heldBlock}
                onHoldBlock={handleHoldBlock}
              />
            </div>
          </main>
        )}

        {/* 🏮 Footer signature layout */}
        <footer className="w-full z-10 py-2.5 text-center border-t border-white/5 bg-[#030509] flex-shrink-0">
          <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
            NeoBlocks Casual Zen Puzzle Loop
          </p>
        </footer>
      </div>
    </div>
  );
}
