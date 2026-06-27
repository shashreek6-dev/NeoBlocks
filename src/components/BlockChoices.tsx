import { useState, useRef } from "react";
import { BlockShape } from "../types";
import { motion } from "motion/react";

interface BlockChoicesProps {
  activeBlocks: (BlockShape | null)[];
  selectedBlockIndex: number | "hold" | null;
  onSelectBlock: (idx: number | "hold" | null) => void;
  // Drag and drop mechanics
  previewHoverCell: { r: number; c: number } | null;
  setPreviewHoverCell: (cell: { r: number; c: number } | null) => void;
  onPlaceBlock: (r: number, c: number, forceBlockIdx?: number | "hold") => void;
  board: (string | null)[][];
  disabled?: boolean;
  setIsDraggingGlobal?: (dragging: boolean) => void;
  // Hold specific mechanics
  heldBlock: BlockShape | null;
  onHoldBlock: (idx: number) => void;
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
  heldBlock,
  onHoldBlock,
}: BlockChoicesProps) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null); // -1 is held block
  const [boardCellSize, setBoardCellSize] = useState<number>(40);
  const [boardGap, setBoardGap] = useState<number>(0);

  const latestHoverCellRef = useRef<{ r: number; c: number } | null>(null);
  const grabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startCardWidthRef = useRef<number>(100);
  const startCardHeightRef = useRef<number>(100);

  const getBoardDimensions = () => {
    let cellSize = boardCellSize;
    let gap = boardGap;

    const cellEl0 = document.getElementById("grid-cell-0-0");
    const cellEl1 = document.getElementById("grid-cell-0-1");

    if (cellEl0) {
      const rect0 = cellEl0.getBoundingClientRect();
      if (rect0.width > 0) {
        cellSize = rect0.width;
        if (cellEl1) {
          const rect1 = cellEl1.getBoundingClientRect();
          const pGap = rect1.left - rect0.right;
          if (pGap >= 0) {
            gap = pGap;
          }
        }
      }
    }
    return { cellSize, gap, scale: 1 };
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
    const block = idx === -1 ? heldBlock : activeBlocks[idx];
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

    // Get cell size and gap from getBoardDimensions
    const { cellSize, gap } = getBoardDimensions();
    const shapeRows = block.matrix.length;
    const shapeCols = block.matrix[0].length;

    // Distance between cell starts
    const stepSize = cellSize + gap;

    // Get the actual rendered visual block matrix bounding rect
    const innerBlockId = idx === -1 ? `block-inner-grid-held` : `block-inner-grid-${idx}`;
    const innerBlockEl = document.getElementById(innerBlockId);
    if (!innerBlockEl) return;
    const innerRect = innerBlockEl.getBoundingClientRect();

    // Position of the top-left corner of the actual visual block matrix relative to cell00
    const finalX_topLeft = innerRect.left - rect00.left;
    const finalY_topLeft = innerRect.top - rect00.top;

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

    // Check if dragging ended over the hold dock container
    const holdBoxEl = document.getElementById("hold-box-slot");
    if (holdBoxEl) {
      const holdRect = holdBoxEl.getBoundingClientRect();
      const coords = getClientCoordinates(event, info);
      if (coords) {
        const { x, y } = coords;
        if (
          x >= holdRect.left &&
          x <= holdRect.right &&
          y >= holdRect.top &&
          y <= holdRect.bottom
        ) {
          // Trigger hold slot save
          onHoldBlock(idx);
          setPreviewHoverCell(null);
          latestHoverCellRef.current = null;
          onSelectBlock(null);
          if (setIsDraggingGlobal) {
            setIsDraggingGlobal(false);
          }
          return;
        }
      }
    }

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

  const handleHeldDragEnd = (event: any, info: any) => {
    setDraggingIdx(null);
    const block = heldBlock;
    const hoverCell = latestHoverCellRef.current;

    if (block && hoverCell && isValidPlacement(block, hoverCell)) {
      onPlaceBlock(hoverCell.r, hoverCell.c, "hold");
    }

    setPreviewHoverCell(null);
    latestHoverCellRef.current = null;
    onSelectBlock(null);

    if (setIsDraggingGlobal) {
      setIsDraggingGlobal(false);
    }
  };

  const renderHeldBlock = () => {
    if (!heldBlock) {
      return (
        <div
          id="hold-box-slot"
          onClick={() => {
            if (selectedBlockIndex !== null && selectedBlockIndex !== "hold") {
              onHoldBlock(selectedBlockIndex as number);
            }
          }}
          className="w-full aspect-square rounded-2xl border-2 border-dashed border-[#ea00d9]/25 hover:border-[#ea00d9]/70 hover:bg-[#ea00d9]/5 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden bg-[#06040e]/60"
        >
          <span className="text-[8px] font-mono font-black text-gray-500 uppercase tracking-wider">
            DRAG IN
          </span>
        </div>
      );
    }

    const isSelected = selectedBlockIndex === "hold";
    const rows = heldBlock.matrix.length;
    const cols = heldBlock.matrix[0].length;
    const isDraggingHeld = draggingIdx === -1;
    const isSnapped = isDraggingHeld && previewHoverCell !== null && isValidPlacement(heldBlock, previewHoverCell);

    const hasLargeDim = rows >= 4 || cols >= 4;
    const idleScale = hasLargeDim ? 0.65 : 1.0;
    const baseScale = isSelected ? 1.06 : 1.0;
    const finalIdleScale = idleScale * baseScale;

    return (
      <div
        id="hold-box-slot"
        className="relative w-full aspect-square flex items-center justify-center overflow-visible"
        style={{ overflow: "visible" }}
      >
        {/* Stationary slot representation */}
        <div
          style={{
            opacity: isDraggingHeld ? 0 : 1,
            visibility: isDraggingHeld ? "hidden" : "visible",
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${finalIdleScale})`,
          }}
          className={`absolute inset-0 rounded-2xl bg-[#0a051d]/95 border flex flex-col items-center justify-center aspect-square transition-all duration-150 ease-out select-none cursor-pointer ${
            disabled ? "opacity-45" : ""
          } ${
            isSelected
              ? "border-[#ea00d9] shadow-[0_0_15px_rgba(234,0,217,0.85)]"
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
              {heldBlock.matrix.map((rowVec, r) =>
                rowVec.map((val, c) => (
                  <div
                    key={`held-${r}-${c}`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-none ${
                      val === 1
                        ? `cell-filled bg-gradient-to-br ${heldBlock.color} border-[1.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                        : "invisible"
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Draggable held block */}
        <motion.div
          key={heldBlock.id}
          id="block-choice-held"
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
            setDraggingIdx(-1);
            onSelectBlock("hold");

            if (setIsDraggingGlobal) {
              setIsDraggingGlobal(true);
            }
          }}
          onDrag={(e, info) => {
            if (disabled) return;
            handleDrag(e, info, -1);
          }}
          onDragEnd={(e, info) => {
            if (disabled) return;
            handleHeldDragEnd(e, info);
          }}
          onTap={() => {
            if (disabled) return;
            // Tap/Swap held block
            if (selectedBlockIndex !== null && selectedBlockIndex !== "hold") {
              onHoldBlock(selectedBlockIndex as number);
            } else {
              onSelectBlock(isSelected ? null : "hold");
            }
          }}
          style={{
            touchAction: "none",
            zIndex: isDraggingHeld ? 9999 : 10,
            opacity: isDraggingHeld ? (isSnapped ? 0.45 : 1) : 0,
            pointerEvents: isDraggingHeld ? "none" : "auto",
          }}
          whileDrag={{
            scale: 1.0,
          }}
          className={`select-none absolute inset-0 ${
            disabled ? "opacity-45 cursor-not-allowed pointer-events-none" : "cursor-grab active:cursor-grabbing"
          } flex flex-col items-center justify-center aspect-square ${
            isDraggingHeld
              ? "bg-transparent border-none outline-none shadow-none p-0 pb-0"
              : "transition-all duration-150 ease-out"
          }`}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div
              id="block-inner-grid-held"
              style={
                isDraggingHeld
                  ? {
                      display: "grid",
                      gridTemplateColumns: `repeat(${cols}, ${boardCellSize}px)`,
                      gap: `${boardGap}px`,
                      width: `${cols * boardCellSize + (cols - 1) * boardGap}px`,
                      height: `${rows * boardCellSize + (rows - 1) * boardGap}px`,
                      pointerEvents: "none",
                    }
                  : {
                      display: "grid",
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gap: "0px",
                    }
              }
              className="mx-auto"
            >
              {heldBlock.matrix.map((rowVec, r) =>
                rowVec.map((val, c) => {
                  const getHexColor = (colorStr: string) => {
                    if (colorStr.includes("pink")) return "#ff007f";
                    if (colorStr.includes("cyan")) return "#00f0ff";
                    if (colorStr.includes("purple")) return "#a020f0";
                    if (colorStr.includes("orange")) return "#ff6b00";
                    if (colorStr.includes("green")) return "#00ff88";
                    return "#00f0ff";
                  };
                  const hexColor = getHexColor(heldBlock.color);
                  return (
                    <div
                      key={`drag-held-${r}-${c}`}
                      style={
                        isDraggingHeld
                          ? {
                              width: `${boardCellSize}px`,
                              height: `${boardCellSize}px`,
                              color: hexColor,
                            }
                          : {
                              color: hexColor,
                            }
                      }
                      className={
                        isDraggingHeld
                          ? `transition-all duration-100 pointer-events-none ${
                              val === 1
                                ? `cell-filled bg-gradient-to-br ${heldBlock.color} rounded-none border-[4.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                                : "invisible"
                            }`
                          : `w-4 h-4 sm:w-5 sm:h-5 rounded-none ${
                              val === 1
                                ? `cell-filled bg-gradient-to-br ${heldBlock.color} border-[1.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                                : "invisible"
                            }`
                      }
                    />
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full py-2 flex items-stretch gap-3 sm:gap-4 min-h-[140px] relative select-none">
      {/* 📥 SHARD STORAGE DOCK (HOLD BOX) */}
      <div className="w-[25%] flex-shrink-0 flex flex-col justify-between">
        <span className="text-[7px] font-mono text-[#ea00d9] uppercase tracking-widest text-center block mb-1 font-bold">
          Hold
        </span>
        {renderHeldBlock()}
      </div>

      {/* 🧩 ACTIVE BLOCKS CHOICE SECTOR */}
      <div className="flex-grow grid grid-cols-3 gap-2 sm:gap-3">
        {activeBlocks.map((block, idx) => {
          if (!block) {
            return (
              <div
                key={`empty-${idx}`}
                className="w-full aspect-square flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#090518]/10 text-gray-600 font-serif italic text-[8px] uppercase tracking-wider"
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

          const hasLargeDim = rows >= 4 || cols >= 4;
          const idleScale = hasLargeDim ? 0.65 : 1.0;
          const baseScale = isSelected ? 1.06 : 1.0;
          const finalIdleScale = idleScale * baseScale;

          return (
            <div 
              key={block.id} 
              className="relative aspect-square w-full flex items-center justify-center overflow-visible"
              style={{ overflow: "visible" }}
            >
              {/* Invisible placeholder card to maintain grid stability */}
              <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center select-none pointer-events-none" />

              {/* 1. Stationary Source Slot Representation */}
              <div
                style={{
                  opacity: isDragging ? 0 : 1,
                  visibility: isDragging ? "hidden" : "visible",
                  pointerEvents: "none",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: `scale(${finalIdleScale})`,
                }}
                className={`absolute inset-0 rounded-2xl bg-[#0a051d]/95 border flex flex-col items-center justify-center aspect-square transition-all duration-150 ease-out select-none ${
                  disabled ? "opacity-45" : ""
                } ${
                  isSelected
                    ? "border-[#ea00d9] shadow-[0_0_15px_rgba(234,0,217,0.85)]"
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
                          className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-none ${
                            val === 1
                              ? `cell-filled bg-gradient-to-br ${block.color} border-[1.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
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
                  opacity: isDragging ? (isSnapped ? 0.45 : 1) : 0,
                  pointerEvents: isDragging ? "none" : "auto",
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
                            pointerEvents: "none",
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
                      rowVec.map((val, c) => {
                        const getHexColor = (colorStr: string) => {
                          if (colorStr.includes("pink")) return "#ff007f";
                          if (colorStr.includes("cyan")) return "#00f0ff";
                          if (colorStr.includes("purple")) return "#a020f0";
                          if (colorStr.includes("orange")) return "#ff6b00";
                          if (colorStr.includes("green")) return "#00ff88";
                          return "#00f0ff";
                        };
                        const hexColor = getHexColor(block.color);
                        return (
                          <div
                            key={`${r}-${c}`}
                            style={
                              isDragging
                                ? {
                                    width: `${boardCellSize}px`,
                                    height: `${boardCellSize}px`,
                                    color: hexColor,
                                  }
                                : {
                                    color: hexColor,
                                  }
                            }
                            className={
                              isDragging
                                ? `transition-all duration-100 pointer-events-none ${
                                    val === 1
                                      ? `cell-filled bg-gradient-to-br ${block.color} rounded-none border-[4.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                                      : "invisible"
                                  }`
                                : `w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-none ${
                                    val === 1
                                      ? `cell-filled bg-gradient-to-br ${block.color} border-[1.5px] border-t-white/35 border-l-white/15 border-r-black/25 border-b-black/40 relative overflow-hidden`
                                      : "invisible"
                                  }`
                            }
                          />
                        );
                      })
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
