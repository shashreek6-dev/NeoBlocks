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
  // Corner Small Right
  {
    id: "corner_2x2_br",
    name: "L-Corner 3",
    matrix: [
      [1, 0],
      [1, 1],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Corner Small Left
  {
    id: "corner_2x2_bl",
    name: "L-Corner 3 Inv",
    matrix: [
      [0, 1],
      [1, 1],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Corner Top right
  {
    id: "corner_2x2_tr",
    name: "L-Corner 3 Top R",
    matrix: [
      [1, 1],
      [1, 0],
    ],
    color: "from-neon-cyan-from to-neon-cyan-to",
    accentColor: "shadow-neon-cyan-from/20 border-neon-cyan-from",
  },
  // Corner Top Left
  {
    id: "corner_2x2_tl",
    name: "L-Corner 3 Top L",
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

export function getRandomBlocks(count: number = 3): BlockShape[] {
  const selected: BlockShape[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * BLOCK_SHAPES.length);
    const block = BLOCK_SHAPES[randomIndex];
    selected.push({
      ...block,
      id: `${block.id}_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
    });
  }
  return selected;
}
