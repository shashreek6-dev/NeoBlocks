import { BlockShape } from "./types";

export const BLOCK_SHAPES: BlockShape[] = [
  // 1x1 Dot
  {
    id: "dot_1x1",
    name: "Dot",
    matrix: [[1]],
    color: "from-neon-pink-from to-neon-pink-to",
    accentColor: "shadow-neon-pink-from/20 border-neon-pink-from",
  },
  // 1x2 Horizontal Line
  {
    id: "line_1x2",
    name: "H-Line 2",
    matrix: [[1, 1]],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // 2x1 Vertical Line
  {
    id: "line_2x1",
    name: "V-Line 2",
    matrix: [[1], [1]],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // 1x3 Horizontal Line
  {
    id: "line_1x3",
    name: "H-Line 3",
    matrix: [[1, 1, 1]],
    color: "from-neon-purple-from to-neon-purple-to",
    accentColor: "shadow-neon-purple-from/20 border-neon-purple-from",
  },
  // 3x1 Vertical Line
  {
    id: "line_3x1",
    name: "V-Line 3",
    matrix: [[1], [1], [1]],
    color: "from-neon-purple-from to-neon-purple-to",
    accentColor: "shadow-neon-purple-from/20 border-neon-purple-from",
  },
  // 1x4 Horizontal Line
  {
    id: "line_1x4",
    name: "H-Line 4",
    matrix: [[1, 1, 1, 1]],
    color: "from-neon-orange-from to-neon-orange-to",
    accentColor: "shadow-neon-orange-from/20 border-neon-orange-from",
  },
  // 4x1 Vertical Line
  {
    id: "line_4x1",
    name: "V-Line 4",
    matrix: [[1], [1], [1], [1]],
    color: "from-neon-orange-from to-neon-orange-to",
    accentColor: "shadow-neon-orange-from/20 border-neon-orange-from",
  },
  // 2x2 Square
  {
    id: "square_2x2",
    name: "Square 2x2",
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: "from-neon-green-from to-neon-green-to",
    accentColor: "shadow-neon-green-from/20 border-neon-green-from",
  },
  // Bottom-Left corner (standard L-corner)
  {
    id: "corner_2x2_bl_standard",
    name: "Corner Triomino Bottom-Left",
    matrix: [
      [1, 0],
      [1, 1],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Bottom-Right corner (reversed L-corner)
  {
    id: "corner_2x2_br_reversed",
    name: "Corner Triomino Bottom-Right",
    matrix: [
      [0, 1],
      [1, 1],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Top-Left corner (like a standard Greek letter Γ)
  {
    id: "corner_2x2_tl_gamma",
    name: "Corner Triomino Top-Left",
    matrix: [
      [1, 1],
      [1, 0],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Top-Right corner (the inverted shape shown in image_8a5cc6.png)
  {
    id: "corner_2x2_tr_inverted",
    name: "Corner Triomino Top-Right",
    matrix: [
      [1, 1],
      [0, 1],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Medium L-shape
  {
    id: "l_shape_right",
    name: "L-Shape 4",
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: "from-neon-pink-from to-neon-pink-to",
    accentColor: "shadow-neon-pink-from/20 border-neon-pink-from",
  },
  // Medium L-shape left
  {
    id: "l_shape_left",
    name: "L-Shape 4 Left",
    matrix: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
    color: "from-neon-pink-from to-neon-pink-to",
    accentColor: "shadow-neon-pink-from/20 border-neon-pink-from",
  },
  // T-shape
  {
    id: "t_shape_3x2",
    name: "T-Block",
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "from-neon-purple-from to-neon-purple-to",
    accentColor: "shadow-neon-purple-from/20 border-neon-purple-from",
  },
  // Z-shape
  {
    id: "z_shape_3x2",
    name: "Z-Block",
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "from-neon-green-from to-neon-green-to",
    accentColor: "shadow-neon-green-from/20 border-neon-green-from",
  },
  // S-shape
  {
    id: "s_shape_3x2",
    name: "S-Block",
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "from-neon-green-from to-neon-green-to",
    accentColor: "shadow-neon-green-from/20 border-neon-green-from",
  },
  // Giant L 3x3
  {
    id: "l_shape_3x3",
    name: "Giant L 3x3",
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "from-neon-orange-from to-neon-orange-to",
    accentColor: "shadow-neon-orange-from/20 border-neon-orange-from",
  },
  // Giant Corner 3x3
  {
    id: "corner_3x3",
    name: "Giant Corner",
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ],
    color: "from-neon-orange-from to-neon-orange-to",
    accentColor: "shadow-neon-orange-from/20 border-neon-orange-from",
  },
  // Strategic 3x3 Big Square
  {
    id: "square_3x3",
    name: "Square 3x3",
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    color: "from-neon-green-from to-neon-green-to",
    accentColor: "shadow-neon-green-from/20 border-neon-green-from",
  },
  // Strategic Giant Line 5 Vertical
  {
    id: "line_5x1",
    name: "V-Line 5",
    matrix: [[1], [1], [1], [1], [1]],
    color: "from-neon-purple-from to-neon-purple-to",
    accentColor: "shadow-neon-purple-from/20 border-neon-purple-from",
  },
  // Strategic Giant Line 5 Horizontal
  {
    id: "line_1x5",
    name: "H-Line 5",
    matrix: [[1, 1, 1, 1, 1]],
    color: "from-neon-purple-from to-neon-purple-to",
    accentColor: "shadow-neon-purple-from/20 border-neon-purple-from",
  },
];

export function getRandomBlocks(count: number = 3, board?: (string | null)[][]): BlockShape[] {
  const selected: BlockShape[] = [];
  
  // Count current filled cells (tiles remaining on the board)
  let filledTilesCount = 0;
  if (board) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r] && board[r][c] !== null) {
          filledTilesCount++;
        }
      }
    }
  }

  // Helper pieces: 1x1 single tile, 1x2 mini-lines, 2x1 mini-lines
  const helperShapes = BLOCK_SHAPES.filter(
    (b) => b.id === "dot_1x1" || b.id === "line_1x2" || b.id === "line_2x1"
  );

  for (let i = 0; i < count; i++) {
    let block: BlockShape;

    // "if the grid has fewer than 15 total tiles remaining, aggressively increase the spawn rate of tiny 'helper' pieces"
    if (board && filledTilesCount > 0 && filledTilesCount < 15 && Math.random() < 0.80) {
      const randomIndex = Math.floor(Math.random() * helperShapes.length);
      block = helperShapes[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * BLOCK_SHAPES.length);
      block = BLOCK_SHAPES[randomIndex];
    }

    selected.push({
      ...block,
      id: `${block.id}_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
    });
  }
  return selected;
}
