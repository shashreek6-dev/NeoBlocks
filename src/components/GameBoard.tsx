import { CSSProperties } from "react";
import { BlockShape } from "../types";

interface GameBoardProps {
  board: (string | null)[][];
  selectedBlock: BlockShape | null;
  previewHoverCell: { r: number; c: number } | null;
  setPreviewHoverCell: (cell: { r: number; c: number } | null) => void;
  onPlaceBlock: (r: number, c: number) => void;
  isDragging?: boolean;
}

export default function GameBoard({
  board,
  selectedBlock,
  previewHoverCell,
  setPreviewHoverCell,
  onPlaceBlock,
  isDragging = false,
}: GameBoardProps) {
  const BOARD_SIZE = 8;

  // Pre-calculate which cells are highlighted for preview
  const getPreviewState = (r: number, c: number) => {
    if (!selectedBlock || !previewHoverCell) return null;

    const shapeRows = selectedBlock.matrix.length;
    const shapeCols = selectedBlock.matrix[0].length;
    const { r: startR, c: startC } = previewHoverCell;

    // Check if cell (r, c) falls within the boundary of the shape's bounds relative to start node
    const relR = r - startR;
    const relC = c - startC;

    if (relR >= 0 && relR < shapeRows && relC >= 0 && relC < shapeCols) {
      if (selectedBlock.matrix[relR][relC] === 1) {
        // Checking if general placement fits on board
        const fitsOnBoard =
          startR + shapeRows <= BOARD_SIZE && startC + shapeCols <= BOARD_SIZE;

        if (!fitsOnBoard) return "invalid";

        // Check if overlaps with occupied cell
        let overlaps = false;
        for (let i = 0; i < shapeRows; i++) {
          for (let j = 0; j < shapeCols; j++) {
            if (selectedBlock.matrix[i][j] === 1) {
              const targetR = startR + i;
              const targetC = startC + j;
              if (
                targetR < BOARD_SIZE &&
                targetC < BOARD_SIZE &&
                board[targetR][targetC] !== null
              ) {
                overlaps = true;
              }
            }
          }
        }

        return overlaps ? "invalid" : "valid";
      }
    }

    return null;
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isDragging) return;
    if (!selectedBlock) return;
    const shapeRows = selectedBlock.matrix.length;
    const shapeCols = selectedBlock.matrix[0].length;
    const targetR = Math.max(0, Math.min(8 - shapeRows, r - Math.floor(shapeRows / 2)));
    const targetC = Math.max(0, Math.min(8 - shapeCols, c - Math.floor(shapeCols / 2)));
    setPreviewHoverCell({ r: targetR, c: targetC });
  };

  return (
    <div
      id="game-board-grid"
      className="bg-[#0c0d14] p-4 border-[5px] border-[#ea00d9] shadow-[0_0_20px_rgba(234,0,217,0.8),0_0_40px_rgba(0,240,255,0.4)] relative w-full aspect-square max-w-[340px] md:max-w-[400px] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Laser horizontal/vertical lines scanline motif */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(234,0,217,0.06)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

      {/* 8x8 grid items */}
      <div className="grid grid-cols-8 gap-0.5 p-0.5 bg-[#080a0f] rounded-none overflow-hidden w-full h-full z-10 relative">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const preview = getPreviewState(rIdx, cIdx);
            const isFilled = cell !== null;

            let cellClass = "";
            let customStyle: CSSProperties = {};

            if (isFilled) {
              // High-fidelity 3D Bevel, with diagonal miter corners and glowing drop shadows!
              cellClass = `cell-filled bg-gradient-to-br ${cell} border-[4px] border-t-white/40 border-l-white/20 border-r-black/35 border-b-black/50 shadow-[0_0_8px_rgba(0,240,255,0.5)]`;
            } else if (preview === "valid" && selectedBlock) {
              // Predictive placement preview utilizing translucent 3D border
              cellClass = `bg-gradient-to-br ${selectedBlock.color} opacity-60 border-[4px] border-t-white/30 border-l-white/10 border-r-black/20 border-b-black/35 z-20 animate-pulse pointer-events-none`;
            } else if (preview === "invalid") {
              // Hazard tone
              cellClass = "bg-rose-950/60 border border-rose-500/80 animate-pulse shadow-[inset_0_0_8px_rgba(244,63,94,0.6)] pointer-events-none z-20";
            } else {
              // Flat sunken empty neon-border dark obsidian violet tile
              cellClass = "bg-[#12131a] border border-[#ea00d9]/10 transition-colors duration-150 hover:bg-[#1a1b24] shadow-[inset_y_0_0_5px_rgba(0,0,0,0.95)] hover:border-[#00f0ff]/30 hover:shadow-[0_0_8px_rgba(0,240,255,0.45)]";
            }

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                id={`grid-cell-${rIdx}-${cIdx}`}
                data-row={rIdx}
                data-col={cIdx}
                onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                onClick={() => {
                  if (isDragging) return;
                  if (selectedBlock) {
                    const shapeRows = selectedBlock.matrix.length;
                    const shapeCols = selectedBlock.matrix[0].length;
                    const targetR = Math.max(0, Math.min(8 - shapeRows, rIdx - Math.floor(shapeRows / 2)));
                    const targetC = Math.max(0, Math.min(8 - shapeCols, cIdx - Math.floor(shapeCols / 2)));
                    onPlaceBlock(targetR, targetC);
                  }
                }}
                style={customStyle}
                className={`w-full aspect-square rounded-none transition-all duration-100 ease-out cursor-pointer relative overflow-hidden ${cellClass}`}
                role="button"
                aria-label={`Cell at row ${rIdx + 1}, column ${cIdx + 1}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
