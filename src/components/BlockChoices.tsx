import { useState, useRef } from "react";
import { BlockShape } from "../types";
import { motion } from "motion/react";

interface BlockChoicesProps {
  activeBlocks: (BlockShape | null)[];
  selectedBlockIndex: number | null;
  onSelectBlock: (idx: number | null) => void;
  // Drag and drop mechanics
  previewHoverCell: { r: number; c: number } | null;
  setPreviewHoverCell: (cell: { r: number; c: number } | null) => void;
  onPlaceBlock: (r: number, c: number, forceBlockIdx?: number) => void;
  board: (string | null)[][];
  disabled?: boolean;
  setIsDraggingGlobal?: (dragging: boolean) => void;
}

export default function BlockChoices({
  activeBlocks,
  selectedBlockIndex,
  onSelectBlock,
  previewHoverCell,
  setPreviewHoverCell,
  onPlaceBlock,
  board,
  disabled = false,
  setIsDraggingGlobal,
}: BlockChoicesProps) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [boardCellSize, setBoardCellSize] = useState<number>(40);
  const [boardGap, setBoardGap] = useState<number>(0);

  const latestHoverCellRef = useRef<{ r: number; c: number } | null>(null);
  const grabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startCardWidthRef = useRef<number>(100);
  const startCardHeightRef = useRef<number>(100);

  const getBoardDimensions = () => {
    let cellSize = boardCellSize;
    let gap = boardGap;
    let scale = 1;

    const cellEl0 = document.getElementById("grid-cell-0-0");
    const cellEl1 = document.getElementById("grid-cell-0-1");

    if (cellEl0) {
      const rect0 = cellEl0.getBoundingClientRect();
      if (cellEl0.offsetWidth > 0) {
        scale = rect0.width / cellEl0.offsetWidth;
        cellSize = cellEl0.offsetWidth;
        if (cellEl1) {
          const rect1 = cellEl1.getBoundingClientRect();
          const pGap = rect1.left - rect0.right;
          if (pGap >= 0) {
            gap = pGap / scale;
          }
        }
      }
    } else {
      const boardEl = document.getElementById("game-board-grid");
      if (boardEl) {
        const bRect = boardEl.getBoundingClientRect();
        if (boardEl.offsetWidth > 0) {
          scale = bRect.width / boardEl.offsetWidth;
        }
      }
    }
    return { cellSize, gap, scale };
  };

  const updateBoardDimensions = () => {
    const { cellSize, gap } = getBoardDimensions();
    setBoardCellSize(cellSize);
    setBoardGap(gap);
  };

  const isValidPlacement = (block: BlockShape, hoverCell: { r: number; c: number } | null): boolean => {
    if (!hoverCell || !board) return false;
    const shapeRows = block.matrix.length;
    const shapeCols = block.matrix[0].length;
    const { r: startR, c: startC } = hoverCell;

    if (startR + shapeRows > 8 || startC + shapeCols > 8) return false;

    for (let r = 0; r < shapeRows; r++) {
      for (let c = 0; c < shapeCols; c++) {
        if (block.matrix[r][c] === 1) {
          const targetR = startR + r;
          const targetC = startC + c;
          if (targetR < 8 && targetC < 8 && board[targetR][targetC] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Robust viewport-relative coordinate extraction
  const getClientCoordinates = (event: any, info: any) => {
    if (info && info.point && typeof info.point.x === "number" && info.point.x !== 0) {
      return { x: info.point.x, y: info.point.y };
    }
    if (event) {
      if (typeof event.clientX === "number" && event.clientX !== 0) {
        return { x: event.clientX, y: event.clientY };
      }
      if (event.touches && event.touches[0]) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      if (event.changedTouches && event.changedTouches[0]) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
      }
    }
    return null;
  };

  // High-precision proximity touch coordinate-to-grid snapper
  const handleDrag = (event: any, info: any, idx: number) => {
    const block = activeBlocks[idx];
    if (!block) {
      setPreviewHoverCell(null);
      latestHoverCellRef.current = null;
      return;
    }

    const coords = getClientCoordinates(event, info);
    if (!coords) {
      return;
    }

    const { x: clientX, y: clientY } = coords;

    const cell00 = document.getElementById("grid-cell-0-0");
    if (!cell00) return;

    // Get grid cell 0,0 bounding client rect
    const rect00 = cell00.getBoundingClientRect();
    if (cell00.offsetWidth <= 0) return;

    // Get unscaled cell size, gap and scale from getBoardDimensions
    const { cellSize, gap, scale } = getBoardDimensions();
    const shapeRows = block.matrix.length;
    const shapeCols = block.matrix[0].length;

    // Distance between cell starts
    const stepSize = cellSize + gap;

    // Get the actual rendered visual block matrix bounding rect
    const innerBlockEl = document.getElementById(`block-inner-grid-${idx}`);
    if (!innerBlockEl) return;
    const innerRect = innerBlockEl.getBoundingClientRect();

    // Position of the top-left corner of the actual visual block matrix relative to cell00 (unscaled)
    const finalX_topLeft = (innerRect.left - rect00.left) / scale;
    const finalY_topLeft = (innerRect.top - rect00.top) / scale;

    // Minimize distance across all valid top-left board cells
    let closestR = 0;
    let closestC = 0;
    let minDistance = Infinity;

    for (let r = 0; r <= 8 - shapeRows; r++) {
      for (let c = 0; c <= 8 - shapeCols; c++) {
        const cellX = c * stepSize;
        const cellY = r * stepSize;
        const dist = Math.hypot(cellX - finalX_topLeft, cellY - finalY_topLeft);
        if (dist < minDistance) {
          minDistance = dist;
          closestR = r;
          closestC = c;
        }
      }
    }

    // Snapping search threshold in unscaled CSS pixels
    if (minDistance < stepSize * 1.5) {
      const targetPos = { r: closestR, c: closestC };
      setPreviewHoverCell(targetPos);
      latestHoverCellRef.current = targetPos;
    } else {
      setPreviewHoverCell(null);
      latestHoverCellRef.current = null;
    }
  };

  const handleDragEnd = (event: any, info: any, idx: number) => {
    setDraggingIdx(null);
    const block = activeBlocks[idx];
    const hoverCell = latestHoverCellRef.current;

    if (block && hoverCell && isValidPlacement(block, hoverCell)) {
      onPlaceBlock(hoverCell.r, hoverCell.c, idx);
    }

    // Reset tracking state
    setPreviewHoverCell(null);
    latestHoverCellRef.current = null;
    onSelectBlock(null);

    if (setIsDraggingGlobal) {
      setIsDraggingGlobal(false);
    }
  };

  return (
    <div className="w-full py-2 flex flex-col items-stretch gap-4 min-h-[140px] relative select-none">
      {/* 🧩 ACTIVE BLOCKS CHOICE SECTOR */}
      <div className="flex-grow grid grid-cols-3 gap-3 sm:gap-4">
        {activeBlocks.map((block, idx) => {
          if (!block) {
            return (
              <div
                key={`empty-${idx}`}
                className="w-full aspect-square flex items-center justify-center rounded-2xl border border-dashed border-[#ea00d9]/15 bg-[#090518]/30 text-[#ea00d9]/25 font-serif italic text-[9px] uppercase tracking-wider"
              >
                <span>EMPTY</span>
              </div>
            );
          }

          const isSelected = selectedBlockIndex === idx;
          const rows = block.matrix.length;
          const cols = block.matrix[0].length;
          const isDragging = draggingIdx === idx;
          const isSnapped = isDragging && previewHoverCell !== null && isValidPlacement(block, previewHoverCell);

          return (
            <div key={block.id} className="relative aspect-square w-full">
              {/* Invisible placeholder card to maintain grid stability */}
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center select-none pointer-events-none" />

              {/* 1. Stationary Source Slot Representation */}
              <div
                style={{
                  opacity: isDragging ? 0 : 1,
                  visibility: isDragging ? "hidden" : "visible",
                  pointerEvents: "none",
                }}
                className={`absolute inset-0 rounded-2xl bg-[#0a051d]/95 border flex flex-col items-center justify-center aspect-square transition-all duration-150 ease-out select-none ${
                  disabled ? "opacity-45" : ""
                } ${
                  isSelected
                    ? "border-[#ea00d9] shadow-[0_0_15px_rgba(234,0,217,0.85)] scale-[1.06]"
                    : "border-[#00e5ff]/25 hover:border-[#00e5ff]/60 hover:scale-[1.03] shadow-[inset_0_0_8px_rgba(0,229,255,0.05)]"
                }`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none">
                  <div
                    className="mx-auto grid"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gap: "0px",
                    }}
                  >
                    {block.matrix.map((rowVec, r) =>
                      rowVec.map((val, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-5 h-5 sm:w-7 sm:h-7 rounded-none ${
                            val === 1
                              ? `cell-filled bg-gradient-to-br ${block.color} border-[2px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                              : "invisible"
                          }`}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Draggable motion active block card */}
              <motion.div
                key={block.id}
                id={`block-choice-${idx}`}
                // Drag mechanics using Framer Motion
                drag={!disabled}
                dragSnapToOrigin
                dragElastic={0.1}
                dragMomentum={false}
                onMouseDown={(e) => {
                  if (disabled) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  startCardWidthRef.current = rect.width;
                  startCardHeightRef.current = rect.height;
                  grabOffsetRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  };
                }}
                onTouchStart={(e) => {
                  if (disabled) return;
                  if (e.touches && e.touches[0]) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    startCardWidthRef.current = rect.width;
                    startCardHeightRef.current = rect.height;
                    grabOffsetRef.current = {
                      x: e.touches[0].clientX - rect.left,
                      y: e.touches[0].clientY - rect.top,
                    };
                  }
                }}
                onDragStart={(e, info) => {
                  if (disabled) return;
                  const { cellSize, gap } = getBoardDimensions();
                  setBoardCellSize(cellSize);
                  setBoardGap(gap);
                  setDraggingIdx(idx);
                  onSelectBlock(idx);

                  if (setIsDraggingGlobal) {
                    setIsDraggingGlobal(true);
                  }

                  // Precise grab offset is pre-calculated in onMouseDown/onTouchStart.
                  // We only calculate a fallback here if it has not been set yet.
                  if (grabOffsetRef.current.x === 0 && grabOffsetRef.current.y === 0) {
                    let clientX = 0;
                    let clientY = 0;
                    const coords = getClientCoordinates(e, info);
                    if (coords) {
                      clientX = coords.x;
                      clientY = coords.y;
                    }

                    const blockChoiceEl = document.getElementById(`block-choice-${idx}`);
                    if (blockChoiceEl && clientX > 0) {
                      const rect = blockChoiceEl.getBoundingClientRect();
                      startCardWidthRef.current = rect.width;
                      startCardHeightRef.current = rect.height;
                      grabOffsetRef.current = {
                        x: clientX - rect.left,
                        y: clientY - rect.top,
                      };
                    }
                  }
                }}
                onDrag={(e, info) => {
                  if (disabled) return;
                  handleDrag(e, info, idx);
                }}
                onDragEnd={(e, info) => {
                  if (disabled) return;
                  handleDragEnd(e, info, idx);
                }}
                onTap={() => {
                  if (disabled) return;
                  onSelectBlock(idx);
                }}
                style={{
                  touchAction: "none",
                  zIndex: isDragging ? 9999 : 10,
                  opacity: isDragging ? (isSnapped ? 0.45 : 1) : 0, // Transparent representation when not dragging to prevent overlapping borders and double-rendering artifacts
                  pointerEvents: isDragging ? "none" : "auto", // Prevent cursor snapping calculations interference
                }}
                whileDrag={{
                  scale: 1.0,
                }}
                className={`select-none absolute inset-0 ${
                  disabled ? "opacity-45 cursor-not-allowed pointer-events-none" : "cursor-grab active:cursor-grabbing"
                } flex flex-col items-center justify-center aspect-square ${
                  isDragging
                    ? "bg-transparent border-none outline-none shadow-none p-0 pb-0"
                    : "transition-all duration-150 ease-out"
                }`}
              >
                {/* Embedded Block Grid */}
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div
                    id={`block-inner-grid-${idx}`}
                    style={
                      isDragging
                        ? {
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, ${boardCellSize}px)`,
                            gap: `${boardGap}px`,
                            width: `${cols * boardCellSize + (cols - 1) * boardGap}px`,
                            height: `${rows * boardCellSize + (rows - 1) * boardGap}px`,
                            pointerEvents: "none", // Prevent any interference with hover snapping calculations
                          }
                        : {
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            gap: "0px",
                          }
                    }
                    className="mx-auto"
                  >
                    {block.matrix.map((rowVec, r) =>
                       rowVec.map((val, c) => (
                        <div
                          key={`${r}-${c}`}
                          style={
                            isDragging
                              ? {
                                  width: `${boardCellSize}px`,
                                  height: `${boardCellSize}px`,
                                }
                              : {}
                          }
                          className={
                            isDragging
                              ? `transition-all duration-100 pointer-events-none ${
                                  val === 1
                                    ? `cell-filled bg-gradient-to-br ${block.color} rounded-none border-[4.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                                    : "invisible"
                                }`
                              : `w-5 h-5 sm:w-7 sm:h-7 rounded-none ${
                                  val === 1
                                    ? `cell-filled bg-gradient-to-br ${block.color} border-[2px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                                    : "invisible"
                                }`
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
