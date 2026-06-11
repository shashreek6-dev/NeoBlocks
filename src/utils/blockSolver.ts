import { BlockShape } from "../types";

/**
 * Checks if a block shape can fit at a specific starting position on the board.
 */
export function canFitBlock(
  board: (string | null)[][],
  block: BlockShape,
  startR: number,
  startC: number
): boolean {
  const rows = block.matrix.length;
  const cols = block.matrix[0].length;

  if (startR + rows > 8 || startC + cols > 8) return false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (block.matrix[r][c] === 1) {
        if (board[startR + r][startC + c] !== null) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Heuristically evaluates a potential board state after placing a block.
 * Higher scores mean a better state.
 */
export function evaluateBoardState(board: (string | null)[][]): number {
  let score = 0;

  // 1. Count cleared lines (we want to simulate that clearing lines is outstandingly good)
  // Since lines are already cleared in simulated loops, we score based on number of empty cells
  let emptyCells = 0;
  let holes = 0;
  let maxColumnHeights = Array(8).fill(0);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === null) {
        emptyCells++;
        
        // Check if there is a block above this empty cell (making it a hole)
        let hasBlockAbove = false;
        for (let rAbove = 0; rAbove < r; rAbove++) {
          if (board[rAbove][c] !== null) {
            hasBlockAbove = true;
            break;
          }
        }
        if (hasBlockAbove) {
          holes++;
        }
      } else {
        maxColumnHeights[c] = Math.max(maxColumnHeights[c], 8 - r);
      }
    }
  }

  // 2. Compute aggregate column height and bumpiness
  let aggregateHeight = 0;
  let bumpiness = 0;
  for (let c = 0; c < 8; c++) {
    aggregateHeight += maxColumnHeights[c];
    if (c < 7) {
      bumpiness += Math.abs(maxColumnHeights[c] - maxColumnHeights[c + 1]);
    }
  }

  // Linear weights
  // We want to maximize empty cells, minimize holes, minimize bumpiness, and minimize aggregate height
  score += emptyCells * 2.0;
  score -= holes * 4.0;
  score -= aggregateHeight * 0.5;
  score -= bumpiness * 0.5;

  return score;
}

/**
 * Finds the absolute best placement for a block on the active board state.
 * Returns { r: row, c: col, score: maxEval } or null if no valid moves.
 */
export function findBestPlacement(
  board: (string | null)[][],
  block: BlockShape
): { r: number; c: number; score: number } | null {
  let bestMove: { r: number; c: number; score: number } | null = null;
  let maxScore = -Infinity;

  const rows = block.matrix.length;
  const cols = block.matrix[0].length;

  for (let r = 0; r <= 8 - rows; r++) {
    for (let c = 0; c <= 8 - cols; c++) {
      if (canFitBlock(board, block, r, c)) {
        // Create simulated board state
        const simulatedBoard = board.map((row) => [...row]);

        // Place block
        for (let pR = 0; pR < rows; pR++) {
          for (let pC = 0; pC < cols; pC++) {
            if (block.matrix[pR][pC] === 1) {
              simulatedBoard[r + pR][c + pC] = block.color;
            }
          }
        }

        // Simulate row and column clearing
        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];

        for (let sR = 0; sR < 8; sR++) {
          if (simulatedBoard[sR].every((cell) => cell !== null)) {
            rowsToClear.push(sR);
          }
        }

        for (let sC = 0; sC < 8; sC++) {
          let full = true;
          for (let sR = 0; sR < 8; sR++) {
            if (simulatedBoard[sR][sC] === null) {
              full = false;
              break;
            }
          }
          if (full) colsToClear.push(sC);
        }

        // Clear cells
        rowsToClear.forEach((rowIdx) => {
          simulatedBoard[rowIdx].fill(null);
        });
        colsToClear.forEach((colIdx) => {
          for (let sR = 0; sR < 8; sR++) {
            simulatedBoard[sR][colIdx] = null;
          }
        });

        // Evaluate resulted board
        let moveScore = evaluateBoardState(simulatedBoard);

        // Add line clearing bonus to heuristics weight
        const clearedCount = rowsToClear.length + colsToClear.length;
        if (clearedCount > 0) {
          moveScore += clearedCount * 45; // Strongly encourage clearing lines
        }

        // Prefer placing on edges or corners to preserve structure
        // Center of the board in 8x8 is roughly r=3,4 c=3,4.
        // We favor positions closer to edges
        const distFromCenter = Math.abs(r - 3.5) + Math.abs(c - 3.5);
        moveScore += distFromCenter * 0.2;

        if (moveScore > maxScore) {
          maxScore = moveScore;
          bestMove = { r, c, score: moveScore };
        }
      }
    }
  }

  return bestMove;
}
