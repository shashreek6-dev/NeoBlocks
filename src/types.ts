export interface UserProfile {
  username: string;
  avatar: string;
  bio: string;
  registeredAt: string;
  gamesPlayed: number;
  highScore: number;
  totalBlocksPlaced: number;
  totalLinesCleared: number;
}

export interface ScoreRecord {
  id: string;
  username: string;
  score: number;
  linesCleared: number;
  date: string;
  isAi?: boolean; // Label simulated versus entities
}

export interface BlockShape {
  id: string;
  name: string;
  matrix: number[][]; // 0/1 representation of blocks
  color: string; // Tailwind-compatible or HEX color
  accentColor: string; // Glowing or border color
}

export interface GameStats {
  score: number;
  linesClearedCount: number;
  blocksPlacedCount: number;
  comboCount: number;
}

export type GameMode = "solo" | "vs_ai" | "vs_player";

export interface MatchState {
  status: "idle" | "searching" | "countdown" | "playing" | "gameover";
  opponentName: string;
  opponentAvatar: string;
  opponentRating: number;
  opponentScore: number;
  opponentBoard: (string | null)[][];
  opponentChoices: (BlockShape | null)[];
  opponentLinesCleared: number;
  opponentBlocksPlaced: number;
  opponentIsGameOver: boolean;
  winner: string | null; // "player" | "opponent" | "draw" | null
}
