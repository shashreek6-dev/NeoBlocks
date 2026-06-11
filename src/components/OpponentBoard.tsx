import { CSSProperties } from "react";
import { BlockShape } from "../types";

interface OpponentBoardProps {
  board: (string | null)[][];
  score: number;
  linesCleared: number;
  blocksPlaced: number;
  isGameOver: boolean;
  choices: (BlockShape | null)[];
  opponentName: string;
  opponentRating: number;
  opponentAvatarEmoji: string;
}

export default function OpponentBoard({
  board,
  score,
  linesCleared,
  blocksPlaced,
  isGameOver,
  choices,
  opponentName,
  opponentRating,
  opponentAvatarEmoji,
}: OpponentBoardProps) {
  return (
    <div className="w-full bg-[#0d1117] border-2 border-[#a020f0]/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(160,32,240,0.15)] flex flex-col items-center relative overflow-hidden select-none">
      
      {/* Game Over Banner Overlay for Opponent */}
      {isGameOver && (
        <div className="absolute inset-0 bg-[#080a0f]/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-3xl mb-1">🏁</span>
          <h4 className="text-[#ff007f] font-serif italic text-sm font-bold uppercase tracking-wider mb-1 animate-pulse">
            Game Concluded
          </h4>
          <p className="text-[9px] font-mono text-white/50">
            No valid slots remaining on board
          </p>
          <div className="mt-3 bg-[#a020f0]/10 border border-[#a020f0]/45 px-3 py-1.5 rounded text-[11px] font-mono text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            Final: {score} pts
          </div>
        </div>
      )}

      {/* Opponent Profile stats row */}
      <div className="w-full flex justify-between items-center mb-4 pb-3 border-b border-[#a020f0]/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[#00f0ff]/30 bg-[#080a0f] flex items-center justify-center text-lg shadow-[0_0_8px_rgba(0,240,255,0.15)]">
            {opponentAvatarEmoji}
          </div>
          <div>
            <h4 className="text-xs font-serif italic text-white leading-none mb-0.5 font-bold">{opponentName}</h4>
            <span className="text-[10px] font-mono text-[#00f0ff] font-bold">Rating: {opponentRating}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block font-bold">SCORE</span>
          <span className="text-sm font-mono font-bold text-[#ff6b00]">{score}</span>
        </div>
      </div>

      {/* Compact 8x8 Grid */}
      <div className="grid grid-cols-8 gap-0.5 w-full max-w-[280px] aspect-square bg-[#080a0f] p-2 rounded-xl border border-[#a020f0]/20 shadow-[0_0_10px_rgba(0,0,0,0.55)] mb-4">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isFilled = cell !== null;
            let cellClass = "bg-[#12131a] border border-[#ea00d9]/5";

            if (isFilled) {
              cellClass = `cell-filled bg-gradient-to-br ${cell} border-t-white/20 border-l-white/10 border-r-black/35 border-b-black/45 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]`;
            }

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-full aspect-square rounded-[1px] transition-all duration-150 ${cellClass}`}
              />
            );
          })
        )}
      </div>

      {/* Opponent Mini Choices Tray */}
      <div className="w-full">
        <span className="block text-[8px] font-mono text-white/40 uppercase tracking-wider mb-2 text-center font-bold">
          Active Block Choices
        </span>
        <div className="flex justify-center gap-4 h-[44px]">
          {choices.map((block, bIdx) => {
            if (!block) {
              return (
                <div
                  key={`empty-${bIdx}`}
                  className="w-10 h-10 border border-dashed border-[#ea00d9]/15 rounded-md flex items-center justify-center text-[#ea00d9]/10 bg-[#080a0f]/50"
                >
                  <span className="text-[10px]">✨</span>
                </div>
              );
            }

            return (
              <div
                key={block.id}
                className="w-10 h-10 flex items-center justify-center bg-[#12131a] rounded-md border border-[#00f0ff]/20 shadow-inner cursor-not-allowed select-none transition-all duration-200 hover:border-[#00f0ff]/40"
                title="Symmetric Opponent Piece (Hidden)"
              >
                <span className="text-xs font-mono font-bold text-[#00f0ff] opacity-75 animate-pulse">?</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Match Mini-Stats */}
      <div className="w-full mt-3 pt-2.5 border-t border-[#a020f0]/15 flex justify-between text-[10px] text-white/50 font-mono">
        <div>Blocks Set: <span className="text-[#00ff88] font-bold">{blocksPlaced}</span></div>
        <div>Clears: <span className="text-[#00f0ff] font-bold">{linesCleared}</span></div>
      </div>

    </div>
  );
}
