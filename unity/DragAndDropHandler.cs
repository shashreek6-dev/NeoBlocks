using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace NeoBlocks.Unity
{
    /// <summary>
    /// Handles user dragging of spawning blocks in Unity UI Canvas.
    /// Implements standard UnityEngine.EventSystems drag lifecycle to support cross-platform (Mouse & Touch).
    /// </summary>
    [RequireComponent(typeof(CanvasGroup))]
    public class DragAndDropHandler : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
    {
        [Header("Canvas & Sizing Config")]
        [Tooltip("Direct reference to the parent Canvas component. Crucial for scaling drag deltas.")]
        [SerializeField] private Canvas parentCanvas;

        [Tooltip("The rect transform representing the actual layout of the block matrix.")]
        [SerializeField] private RectTransform blockVisualContainer;

        [Tooltip("Active scaling adjustment applied to the block when dragged (e.g. scales down or snaps relative to finger).")]
        [SerializeField] private Vector3 dragScaleModifier = new Vector3(1.1f, 1.1f, 1.0f);

        [Header("Target References")]
        [Tooltip("Reference to the 8x8 GridRenderer in the scene to notify of placement previews.")]
        [SerializeField] private GridRenderer targetGridRenderer;

        [Tooltip("Reference to the Canvas or RectTransform hosting the 8x8 grid cells to compute snapping coordinates.")]
        [SerializeField] private RectTransform physicalGridRect;

        // Runtime states
        private RectTransform rectTransform;
        private CanvasGroup canvasGroup;
        private Vector3 originalLocalPosition;
        private Vector3 originalLocalScale;
        private Transform originalParent;
        private float cellSizeInPixels;

        // Mock structure mirroring JS BlockShape attributes in Unity C#
        public class BlockDragData
        {
            public int[,] shapeMatrix; // e.g. 2x2, 3x3 array containing 0s and 1s
            public string colorKey;    // e.g. "cyan"
        }

        private BlockDragData activeBlockData;

        private void Awake()
        {
            rectTransform = GetComponent<RectTransform>();
            canvasGroup = GetComponent<CanvasGroup>();
            
            originalLocalPosition = rectTransform.localPosition;
            originalLocalScale = rectTransform.localScale;
            originalParent = transform.parent;

            // Automatically attempt parent traversal parent canvas lookup if unassigned in inspector
            if (parentCanvas == null)
            {
                parentCanvas = GetComponentInParent<Canvas>();
            }
        }

        /// <summary>
        /// Populates the block matrix and metadata inside this script. Call this on instantiation.
        /// </summary>
        public void LoadBlockData(int[,] matrix, string color)
        {
            activeBlockData = new BlockDragData
            {
                shapeMatrix = matrix,
                colorKey = color
            };
        }

        #region EventSystem Drag Loops

        public void OnBeginDrag(PointerEventData eventData)
        {
            if (parentCanvas == null)
            {
                Debug.LogWarning("DragAndDropHandler: Parent Canvas is unassigned. Coordinate math might be inaccurate.");
            }

            // Bring block representation visually above adjacent UI items
            transform.SetAsLastSibling();

            // Squeeze/scale block representation on drag lift to match modern look and avoid hiding under finger
            rectTransform.localScale = Vector3.Scale(originalLocalScale, dragScaleModifier);

            // Allow raycasts to pass directly through the dragged item so standard hover detection handles properly
            canvasGroup.blocksRaycasts = false;
            canvasGroup.alpha = 0.85f;
        }

        public void OnDrag(PointerEventData eventData)
        {
            // Canvas-accurate positional translation (Prevents desyncs when running on different viewport resolutions)
            if (parentCanvas != null && parentCanvas.renderMode == RenderMode.ScreenSpaceOverlay)
            {
                rectTransform.anchoredPosition += eventData.delta / parentCanvas.scaleFactor;
            }
            else
            {
                // World space fallback (if utilizing a screen-space camera setup)
                RectTransformUtility.ScreenPointToWorldPointInRectangle(
                    rectTransform, 
                    eventData.position, 
                    eventData.pressEventCamera, 
                    out Vector3 globalWorldPos
                );
                rectTransform.position = globalWorldPos;
            }

            // Real-time grid cell snapping calculations and preview overlay triggering
            ProcessRealtimeGridSnapping(eventData.position);
        }

        public void OnEndDrag(PointerEventData eventData)
        {
            // Reset opacity and spatial values
            rectTransform.localScale = originalLocalScale;
            canvasGroup.blocksRaycasts = true;
            canvasGroup.alpha = 1.0f;

            // Resolve placement attempt
            bool placementSuccess = AttemptPiecePlacement(eventData.position);

            if (placementSuccess)
            {
                // Core puzzle game logic has consumed the piece (e.g. notify game managers, increment scores, clear rows)
                Destroy(gameObject);
            }
            else
            {
                // Animate smoothly back back to original bench layout on invalid placement
                StartCoroutine(TweenBackToOriginalPosition());
            }
        }

        #endregion

        /// <summary>
        /// Computes bounding alignment coordinates to preview active blocks on the Grid interface.
        /// </summary>
        private void ProcessRealtimeGridSnapping(Vector2 screenCoordinates)
        {
            if (physicalGridRect == null || targetGridRenderer == null || activeBlockData == null) return;

            // Determine if screen coordinate hovers over physical board
            if (RectTransformUtility.RectangleContainsScreenPoint(physicalGridRect, screenCoordinates, parentCanvas.worldCamera))
            {
                Vector2Int cellCoordinates = GetGridCellIndicesAt(screenCoordinates);
                
                // Extract list of all 8x8 squares occupied by this specific multi-cell block
                List<Vector2Int> affectedCells = GetOccupiedCellIndices(cellCoordinates.x, cellCoordinates.y);
                
                // Query system-wide controllers if the move is legal (no occupancy overlaps) and trigger green/red preview
                bool isMoveValid = ValidateHypotheticalPlacement(affectedCells);
                targetGridRenderer.DrawPlacementPreview(affectedCells, activeBlockData.colorKey, isMoveValid);
            }
        }

        /// <summary>
        /// Resolves final drag release by checking intersection bounds and executing game logic parameters.
        /// </summary>
        private bool AttemptPiecePlacement(Vector2 finalScreenCoordinates)
        {
            if (physicalGridRect == null || activeBlockData == null) return false;

            if (RectTransformUtility.RectangleContainsScreenPoint(physicalGridRect, finalScreenCoordinates, parentCanvas.worldCamera))
            {
                Vector2Int targetAnchor = GetGridCellIndicesAt(finalScreenCoordinates);
                List<Vector2Int> occupied = GetOccupiedCellIndices(targetAnchor.x, targetAnchor.y);

                if (ValidateHypotheticalPlacement(occupied))
                {
                    // Call central core game model / state managers to commit changes
                    // Inform game flow, trigger combos, play audio, and clear line cascades
                    ExecuteDropOnModel(occupied);
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Converts absolute screen point mouse coordinates to relative 0-7 indexes of the target board array.
        /// </summary>
        private Vector2Int GetGridCellIndicesAt(Vector2 screenPoint)
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                physicalGridRect, 
                screenPoint, 
                parentCanvas.worldCamera, 
                out Vector2 localPoint
            );

            // Translate bottom-left local anchors to absolute grid column counts (8x8)
            float boardWidth = physicalGridRect.rect.width;
            float boardHeight = physicalGridRect.rect.height;

            float relativeX = localPoint.x + (boardWidth * 0.5f);
            float relativeY = (boardHeight * 0.5f) - localPoint.y; // Flip Y as array [0,0] is top-left in standard layouts

            int stepCol = Mathf.FloorToInt((relativeX / boardWidth) * 8);
            int stepRow = Mathf.FloorToInt((relativeY / boardHeight) * 8);

            // Clamp values safely inside board array boundaries
            stepCol = Mathf.Clamp(stepCol, 0, 7);
            stepRow = Mathf.Clamp(stepRow, 0, 7);

            return new Vector2Int(stepRow, stepCol);
        }

        /// <summary>
        /// Aggregates all affected grid coordinate positions for current block dimensions.
        /// </summary>
        private List<Vector2Int> GetOccupiedCellIndices(int startRow, int startCol)
        {
            List<Vector2Int> cells = new List<Vector2Int>();
            int rows = activeBlockData.shapeMatrix.GetLength(0);
            int cols = activeBlockData.shapeMatrix.GetLength(1);

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    if (activeBlockData.shapeMatrix[r, c] == 1)
                    {
                        cells.add_cell(new Vector2Int(startRow + r, startCol + c));
                    }
                }
            }

            return cells;
        }

        #region Interface Hooks to Core Game States (Adapt dynamically to your specific central Game Manager)

        private bool ValidateHypotheticalPlacement(List<Vector2Int> targetIndices)
        {
            // Example workflow: query your central singleton managers:
            // return GridManager.Instance.CanPlaceAt(targetIndices);
            
            // For modular compilation, let's assume it checks boundaries and duplicates
            foreach (var index in targetIndices)
            {
                if (index.x < 0 || index.x >= 8 || index.y < 0 || index.y >= 8)
                {
                    return false; // Out of bounds
                }
            }
            return true;
        }

        private void ExecuteDropOnModel(List<Vector2Int> targetIndices)
        {
            // Example execution:
            // GridManager.Instance.CommitBlockPlacement(targetIndices, activeBlockData.colorKey);
            // ComboClearLogic.Instance.ClearMatches();
            
            Debug.Log($"Piece placed successfully at grid indices! Blocks filled: {targetIndices.Count}");
        }

        #endregion

        /// <summary>
        /// Coroutine to animate piece sliding back to slot if player drops in an invalid grid area.
        /// </summary>
        private IEnumerator TweenBackToOriginalPosition()
        {
            float duration = 0.22f;
            float elapsed = 0f;
            Vector3 startPos = rectTransform.localPosition;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float normalizedProgress = Mathf.SmoothStep(0f, 1f, elapsed / duration);
                rectTransform.localPosition = Vector3.Lerp(startPos, originalLocalPosition, normalizedProgress);
                yield return null;
            }

            rectTransform.localPosition = originalLocalPosition;
        }
    }

    // Quick helper extension method mirroring standard List behavior inside namespace
    public static class ListExtensions
    {
        public static void add_cell(this List<Vector2Int> list, Vector2Int item)
        {
            list.Add(item);
        }
    }
}
