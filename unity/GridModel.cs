using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace NeoBlocks.Puzzle
{
    /// <summary>
    /// Type of decorative or blocking obstacle present in our cozy level-clearing grid.
    /// Used for targeting specific puzzle level objective goals.
    /// </summary>
    public enum ObstacleType
    {
        None,
        OvergrownVine,    // Cozy botanical block requiring purification
        TactileStone,     // Durable, heavy stone blocking placements
        FrozenCrystal     // Shimmering obstacle cleared by adjacent line triggers
    }

    /// <summary>
    /// Model layer tracking state occupancy using cozy-themed descriptors (GridItem) instead of raw scores.
    /// Handles grid boundaries, shape fits, and multi-axis purification scans.
    /// </summary>
    public class GridModel
    {
        public const int BoardSize = 8;

        // Represents what occupies each cell. Can be a cozy color descriptor, "obstacle_vine", etc.
        private string[,] cellOccupancy;

        // Tracks level-specific obstacles placed inside the grid cells
        private ObstacleType[,] cellObstacles;

        public string[,] CellOccupancy => cellOccupancy;
        public ObstacleType[,] CellObstacles => cellObstacles;

        public GridModel()
        {
            cellOccupancy = new string[BoardSize, BoardSize];
            cellObstacles = new ObstacleType[BoardSize, BoardSize];
            ClearGrid();
        }

        /// <summary>
        /// Instantly clears the entire puzzle board of both basic items and specialized obstacles.
        /// </summary>
        public void ClearGrid()
        {
            for (int r = 0; r < BoardSize; r++)
            {
                for (int c = 0; c < BoardSize; c++)
                {
                    cellOccupancy[r, c] = null;
                    cellObstacles[r, c] = ObstacleType.None;
                }
            }
        }

        /// <summary>
        /// Generates a cozy, tactile level layout with initial grid items and objective obstacles.
        /// </summary>
        /// <param name="vineCount">Number of Overgrown Vine blocks to scatter.</param>
        /// <param name="stoneCount">Number of Tactile Stone blockers to scatter.</param>
        /// <param name="decorativeFillCount">Number of simple colorful pre-filled items to scatter.</param>
        public void InitializeCozyLevel(int vineCount, int stoneCount, int decorativeFillCount)
        {
            ClearGrid();

            string[] cozyItems = new string[] { "rose_petal", "lavender_bud", "mint_leaf", "buttercup_bloom" };

            // 1. Distribute Botanical Overgrown Vine Obstacles
            PlaceRandomObstacles(ObstacleType.OvergrownVine, "obstacle_vine", vineCount);

            // 2. Distribute Heavy Tactile Stone Obstacles
            PlaceRandomObstacles(ObstacleType.TactileStone, "obstacle_stone", stoneCount);

            // 3. Fill with simple decorative items
            int attempts = 0;
            int filled = 0;
            while (filled < decorativeFillCount && attempts < 200)
            {
                attempts++;
                int r = Random.Range(0, BoardSize);
                int c = Random.Range(0, BoardSize);

                if (cellOccupancy[r, c] == null)
                {
                    cellOccupancy[r, c] = cozyItems[Random.Range(0, cozyItems.Length)];
                    
                    // Verify we didn't accidentally autocomplete a full line during generation
                    if (IsLineComplete(r, true) || IsLineComplete(c, false))
                    {
                        cellOccupancy[r, c] = null;
                    }
                    else
                    {
                        filled++;
                    }
                }
            }
        }

        private void PlaceRandomObstacles(ObstacleType obstacle, string occupancyKey, int count)
        {
            int placed = 0;
            int attempts = 0;

            while (placed < count && attempts < 150)
            {
                attempts++;
                int r = Random.Range(0, BoardSize);
                int c = Random.Range(0, BoardSize);

                if (cellOccupancy[r, c] == null)
                {
                    cellOccupancy[r, c] = occupancyKey;
                    cellObstacles[r, c] = obstacle;

                    // Ensure this addition did not complete a horizontal or vertical line
                    if (IsLineComplete(r, true) || IsLineComplete(c, false))
                    {
                        cellOccupancy[r, c] = null;
                        cellObstacles[r, c] = ObstacleType.None;
                    }
                    else
                    {
                        placed++;
                    }
                }
            }
        }

        /// <summary>
        /// Helper to determine if a specific row or column is fully occupied.
        /// </summary>
        private bool IsLineComplete(int index, bool isRow)
        {
            int cellCount = 0;
            for (int i = 0; i < BoardSize; i++)
            {
                string cellValue = isRow ? cellOccupancy[index, i] : cellOccupancy[i, index];
                if (cellValue != null) cellCount++;
            }
            return cellCount == BoardSize;
        }

        /// <summary>
        /// Evaluates whether a shape matrix fits onto the grid at a target coordinate anchor.
        /// </summary>
        /// <param name="shapeMatrix">2D layout array (1 = solid block segment, 0 = empty space).</param>
        /// <param name="startRow">Target anchor grid row position.</param>
        /// <param name="startCol">Target anchor grid column position.</param>
        /// <returns>True if the move is legal; false if it overlaps or exceeds boundaries.</returns>
        public bool CanPlaceShape(int[,] shapeMatrix, int startRow, int startCol)
        {
            int shapeRows = shapeMatrix.GetLength(0);
            int shapeCols = shapeMatrix.GetLength(1);

            for (int r = 0; r < shapeRows; r++)
            {
                for (int c = 0; c < shapeCols; c++)
                {
                    if (shapeMatrix[r, c] == 1)
                    {
                        int targetRow = startRow + r;
                        int targetCol = startCol + c;

                        // Check boundaries
                        if (targetRow < 0 || targetRow >= BoardSize || targetCol < 0 || targetCol >= BoardSize)
                        {
                            return false;
                        }

                        // Check overlap
                        if (cellOccupancy[targetRow, targetCol] != null)
                        {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Commits placed cozy shape items directly to the model matrix.
        /// </summary>
        public void PlaceShape(int[,] shapeMatrix, int startRow, int startCol, string colorKey)
        {
            int shapeRows = shapeMatrix.GetLength(0);
            int shapeCols = shapeMatrix.GetLength(1);

            for (int r = 0; r < shapeRows; r++)
            {
                for (int c = 0; c < shapeCols; c++)
                {
                    if (shapeMatrix[r, c] == 1)
                    {
                        cellOccupancy[startRow + r, startCol + c] = colorKey;
                        cellObstacles[startRow + r, startCol + c] = ObstacleType.None; // Placed shapes are always standard pieces
                    }
                }
            }
        }

        /// <summary>
        /// Scans the entire board to identify fully completed horizontal rows and vertical columns.
        /// </summary>
        public void EvaluateLineClearances(out List<int> completedRows, out List<int> completedCols)
        {
            completedRows = new List<int>();
            completedCols = new List<int>();

            // Check rows
            for (int r = 0; r < BoardSize; r++)
            {
                bool rowFull = true;
                for (int c = 0; c < BoardSize; c++)
                {
                    if (cellOccupancy[r, c] == null)
                    {
                        rowFull = false;
                        break;
                    }
                }
                if (rowFull) completedRows.Add(r);
            }

            // Check columns
            for (int c = 0; c < BoardSize; c++)
            {
                bool colFull = true;
                for (int r = 0; r < BoardSize; r++)
                {
                    if (cellOccupancy[r, c] == null)
                    {
                        colFull = false;
                        break;
                    }
                }
                if (colFull) completedCols.Add(c);
            }
        }

        /// <summary>
        /// Nullifies cells across completed lines and triggers botanical purification calculations.
        /// </summary>
        /// <param name="onObstaclePurified">Callback invoked for every target obstacle cleared.</param>
        public void PurifyLines(List<int> rowsToClear, List<int> colsToClear, System.Action<ObstacleType, Vector2Int> onObstaclePurified)
        {
            HashSet<Vector2Int> cellsToClear = new HashSet<Vector2Int>();

            // Collect target cells from row clears
            foreach (int r in rowsToClear)
            {
                for (int c = 0; c < BoardSize; c++)
                {
                    cellsToClear.Add(new Vector2Int(r, c));
                }
            }

            // Collect target cells from column clears
            foreach (int c in colsToClear)
            {
                for (int r = 0; r < BoardSize; r++)
                {
                    cellsToClear.Add(new Vector2Int(r, c));
                }
            }

            // Process line clear and notify director of cleared obstacles
            foreach (var cell in cellsToClear)
            {
                ObstacleType obstacle = cellObstacles[cell.x, cell.y];
                if (obstacle != ObstacleType.None)
                {
                    onObstaclePurified?.Invoke(obstacle, cell);
                }

                cellOccupancy[cell.x, cell.y] = null;
                cellObstacles[cell.x, cell.y] = ObstacleType.None;
            }
        }

        /// <summary>
        /// Computes remaining active obstacles on the level.
        /// </summary>
        public int CountRemainingObstacles(ObstacleType targetType)
        {
            int count = 0;
            for (int r = 0; r < BoardSize; r++)
            {
                for (int c = 0; c < BoardSize; c++)
                {
                    if (cellObstacles[r, c] == targetType) count++;
                }
            }
            return count;
        }

        /// <summary>
        /// Determines if the block shape matrix has any remaining legal placements.
        /// </summary>
        public bool HasAnyValidMove(int[,] shapeMatrix)
        {
            int shapeRows = shapeMatrix.GetLength(0);
            int shapeCols = shapeMatrix.GetLength(1);

            for (int r = 0; r <= BoardSize - shapeRows; r++)
            {
                for (int c = 0; c <= BoardSize - shapeCols; c++)
                {
                    if (CanPlaceShape(shapeMatrix, r, c))
                    {
                        return true;
                    }
                }
            }

            return false;
        }
    }
}
