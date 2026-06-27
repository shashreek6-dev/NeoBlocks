using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace NeoBlocks.Puzzle
{
    public enum AdventureState
    {
        Setup,
        ActivePlay,
        CompletedVictory,
        OutOfMovesFailure
    }

    /// <summary>
    /// Central coordinator for the cozy adventure-clearing puzzle.
    /// Manages the remaining placement budgets, coordinates objective completions, 
    /// and exposes high-impact visual callbacks where you can attach particle triggers or UI overlays.
    /// </summary>
    public class GamePlayDirector : MonoBehaviour
    {
        public static GamePlayDirector Instance { get; private set; }

        [Header("Cozy Level Parameter Selection")]
        [Tooltip("The designated level we are currently playing on the adventure map.")]
        [SerializeField] private int levelNumber = 1;

        [Tooltip("Number of Overgrown Vine Obstacles to purify for victory.")]
        [SerializeField] private int initialVineCount = 8;

        [Tooltip("Number of solid Tactile Stones hindering placements.")]
        [SerializeField] private int initialStoneCount = 4;

        [Tooltip("Maximum piece placements allowed before level exhaustion.")]
        [SerializeField] private int maxPlacementsAllowed = 25;

        // VISUAL JUICE & TACTILE HOOKS (Attach soft sound effects & screen-pop effects here)
        // Invoked when any tile is successfully placed
        public event Action<Vector2Int, string> OnItemPlaced;

        // Invoked when an overgrown vine or botanical block is purified (Replaces raw line clear explosion)
        // PLUG-IN HERE: Emit soft blossom petals, cozy glow sparkles, or play soft harp sound effect!
        public event Action<ObstacleType, Vector2Int> OnItemPurified;

        // Invoked when the level objective is met and the player wins
        // PLUG-IN HERE: Show beautiful golden confetti, cozy adventure victory banner, and load next level!
        public event Action<int, int> OnLevelCompleted; // (levelNumber, movesRemaining)

        // Invoked when placements run out or the board jams
        // PLUG-IN HERE: Soft retry dialogue prompt, sad/cozy chime, restart level transition!
        public event Action OnLevelFailed;

        // Invoked to notify standard grid renderers to redraw elements
        public event Action<string[,]> OnGridStateChanged;

        // Dynamic status notifications for UI
        public event Action<int> OnPlacementsUpdated;         // Remaining placements
        public event Action<int> OnTargetObjectivesUpdated;    // Remaining vine count

        private GridModel gridModel;
        private AdventureState currentState = AdventureState.Setup;
        
        private int remainingPlacements = 0;
        private int targetVinesRemaining = 0;

        public int LevelNumber => levelNumber;
        public int RemainingPlacements => remainingPlacements;
        public int TargetVinesRemaining => targetVinesRemaining;
        public AdventureState CurrentState => currentState;
        public GridModel Model => gridModel;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
                return;
            }

            gridModel = new GridModel();
        }

        private void Start()
        {
            LoadAdventureLevel(levelNumber);
        }

        /// <summary>
        /// Boots up a customized levels layout. Initializes targets, obstacles, and resets placements.
        /// </summary>
        public void LoadAdventureLevel(int targetLevel)
        {
            levelNumber = targetLevel;
            remainingPlacements = maxPlacementsAllowed;
            currentState = AdventureState.ActivePlay;

            // Load board pre-fills with target botanical obstacles
            gridModel.InitializeCozyLevel(initialVineCount, initialStoneCount, 12);

            // Compute active objectives remaining
            targetVinesRemaining = gridModel.CountRemainingObstacles(ObstacleType.OvergrownVine);

            // Trigger early UI updates
            OnPlacementsUpdated?.Invoke(remainingPlacements);
            OnTargetObjectivesUpdated?.Invoke(targetVinesRemaining);
            OnGridStateChanged?.Invoke(gridModel.CellOccupancy);
        }

        /// <summary>
        /// Invoked by dragging scripts when a piece lands on the grid coordinates.
        /// </summary>
        public bool TrySubmitCozyPlacement(int[,] shapeMatrix, string itemKey, int targetRow, int targetCol)
        {
            if (currentState != AdventureState.ActivePlay) return false;

            // Check if we have placements remaining in budget
            if (remainingPlacements <= 0)
            {
                CheckLevelStatus();
                return false;
            }

            // 1. Grid Model boundary/overlap check
            if (!gridModel.CanPlaceShape(shapeMatrix, targetRow, targetCol))
            {
                return false; // Soft fail, block snaps back smoothly
            }

            // 2. Commit shape segments onto grid state
            gridModel.PlaceShape(shapeMatrix, targetRow, targetCol, itemKey);
            OnItemPlaced?.Invoke(new Vector2Int(targetRow, targetCol), itemKey);

            // 3. Deduct placements budget
            remainingPlacements--;
            OnPlacementsUpdated?.Invoke(remainingPlacements);

            // 4. Perform line clearance checks and purify targets
            ProcessCozyPurifications();

            // 5. Notify grid graphics to redraw the updated 8x8 cells
            OnGridStateChanged?.Invoke(gridModel.CellOccupancy);

            // 6. Check win/loss parameters
            CheckLevelStatus();

            return true;
        }

        /// <summary>
        /// Identifies horizontal and vertical line connections, triggering botanical purifications.
        /// </summary>
        private void ProcessCozyPurifications()
        {
            gridModel.EvaluateLineClearances(out List<int> completedRows, out List<int> completedCols);

            if (completedRows.Count > 0 || completedCols.Count > 0)
            {
                // Purify matching lines and trigger botanical particle/sound callbacks per obstacle
                gridModel.PurifyLines(completedRows, completedCols, (obstacleType, cellPosition) =>
                {
                    if (obstacleType == ObstacleType.OvergrownVine)
                    {
                        targetVinesRemaining--;
                        OnTargetObjectivesUpdated?.Invoke(targetVinesRemaining);
                    }

                    // Callback for high-juice particle burst or pop sound (e.g., grass leaves, sparkle blooms)
                    OnItemPurified?.Invoke(obstacleType, cellPosition);
                });
            }
        }

        /// <summary>
        /// Validates if current objective levels are successfully met or if a retry is required.
        /// </summary>
        private void CheckLevelStatus()
        {
            // Win condition: All overgrown vines have been purified
            if (targetVinesRemaining <= 0)
            {
                currentState = AdventureState.CompletedVictory;
                OnLevelCompleted?.Invoke(levelNumber, remainingPlacements);
                return;
            }

            // Loss condition 1: Out of moves remaining
            if (remainingPlacements <= 0)
            {
                currentState = AdventureState.OutOfMovesFailure;
                OnLevelFailed?.Invoke();
            }
        }

        /// <summary>
        /// Scans if the player is blocked from placing any available bench items.
        /// If all active shapes are locked out, evaluates for failure.
        /// </summary>
        public void VerifyBoardPlacements(List<int[,]> spawnedShapes)
        {
            if (currentState != AdventureState.ActivePlay) return;
            if (spawnedShapes == null || spawnedShapes.Count == 0) return;

            bool canMove = false;
            foreach (var shape in spawnedShapes)
            {
                if (shape != null && gridModel.HasAnyValidMove(shape))
                {
                    canMove = true;
                    break;
                }
            }

            if (!canMove)
            {
                currentState = AdventureState.OutOfMovesFailure;
                OnLevelFailed?.Invoke();
            }
        }
    }
}
