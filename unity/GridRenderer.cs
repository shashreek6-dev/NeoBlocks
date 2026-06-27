using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace NeoBlocks.Unity
{
    /// <summary>
    /// Renders the 8x8 block puzzle grid visually in Unity using UI Image components.
    /// Manages cell instantiations, visual grid styling, and redraws based on GridManager states.
    /// </summary>
    [RequireComponent(typeof(GridLayoutGroup))]
    public class GridRenderer : MonoBehaviour
    {
        [Header("Cell Customization")]
        [Tooltip("Prefab containing a UI Image component representing a single grid cell.")]
        [SerializeField] private GameObject cellPrefab;

        [Tooltip("The transparent/blank color of an empty cell on the board.")]
        [SerializeField] private Color emptyCellColor = new Color(0.12f, 0.13f, 0.18f, 0.6f);

        [Tooltip("Slight outer neon border/glow color of unoccupied slots.")]
        [SerializeField] private Color cellBorderColor = new Color(0.0f, 0.94f, 1.0f, 0.15f);

        [Header("Block Color Map")]
        [Tooltip("Map matching the string identifiers representing block types to actual Unity Colors/Materials.")]
        [SerializeField] private List<BlockColorMapping> colorMapping = new List<BlockColorMapping>();

        // Internal reference structures
        private Image[,] cellImageGrid = new Image[8, 8];
        private Outline[,] cellOutlineGrid = new Outline[8, 8];
        private Dictionary<string, Color> colorMapCache = new Dictionary<string, Color>();

        [System.Serializable]
        public struct BlockColorMapping
        {
            public string colorKey; // Matches "red", "cyan", "royal", etc.
            public Color actualColor;
        }

        private void Awake()
        {
            InitializeColorCache();
            SetupGridLayout();
            GenerateVisualGrid();
        }

        /// <summary>
        /// Populates the fast-lookup dictionary container for string-to-Color keys
        /// </summary>
        private void InitializeColorCache()
        {
            colorMapCache.Clear();
            foreach (var mapping in colorMapping)
            {
                if (!colorMapCache.ContainsKey(mapping.colorKey))
                {
                    colorMapCache.Add(mapping.colorKey, mapping.actualColor);
                }
            }
        }

        /// <summary>
        /// Ensures the target GridLayoutGroup has precise settings to force an 8x8 pattern evenly.
        /// </summary>
        private void SetupGridLayout()
        {
            GridLayoutGroup grid = GetComponent<GridLayoutGroup>();
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 8;
            grid.childAlignment = TextAnchor.MiddleCenter;
        }

        /// <summary>
        /// Spawns 64 cell prefabs into the GridLayout container and caches their references.
        /// </summary>
        private void GenerateVisualGrid()
        {
            // Clear existing children in editor safety mode
            foreach (Transform child in transform)
            {
                Destroy(child.gameObject);
            }

            for (int r = 0; r < 8; r++)
            {
                for (int c = 0; c < 8; c++)
                {
                    GameObject cellObj = Instantiate(cellPrefab, transform);
                    cellObj.name = $"Cell_{r}_{c}";

                    Image cellImage = cellObj.GetComponent<Image>();
                    if (cellImage == null)
                    {
                        cellImage = cellObj.AddComponent<Image>();
                    }

                    // Optional Outline component for high-quality retro arcade border borders
                    Outline outline = cellObj.GetComponent<Outline>();
                    if (outline == null)
                    {
                        outline = cellObj.AddComponent<Outline>();
                    }
                    outline.effectColor = cellBorderColor;
                    outline.effectDistance = new Vector2(1, -1);

                    cellImageGrid[r, c] = cellImage;
                    cellOutlineGrid[r, c] = outline;

                    // Set initial unoccupied grid visual style
                    cellImage.color = emptyCellColor;
                }
            }
        }

        /// <summary>
        /// Primary Redraw listener called by GridManager / GameController when the core grid state shifts.
        /// </summary>
        /// <param name="boardState">8x8 matrix representing string IDs of blocks (null = empty)</param>
        public void RedrawGrid(string[,] boardState)
        {
            if (boardState == null || boardState.GetLength(0) != 8 || boardState.GetLength(1) != 8)
            {
                Debug.LogError("GridRenderer Error: Invalid board state dimensions passed!");
                return;
            }

            for (int r = 0; r < 8; r++)
            {
                for (int c = 0; c < 8; c++)
                {
                    string occupancyKey = boardState[r, c];
                    Image image = cellImageGrid[r, c];

                    if (image == null) continue;

                    if (string.IsNullOrEmpty(occupancyKey))
                    {
                        // Clean empty slot aesthetic
                        image.color = emptyCellColor;
                    }
                    else if (colorMapCache.TryGetValue(occupancyKey, out Color cachedColor))
                    {
                        // Pop matching neon color
                        image.color = cachedColor;
                    }
                    else
                    {
                        // Fallback fallback if color mapping is missing
                        image.color = Color.white;
                    }
                }
            }
        }

        /// <summary>
        /// Highlights specific cells temporarily on drag-hover to preview an oncoming block placement.
        /// </summary>
        public void DrawPlacementPreview(List<Vector2Int> targetCells, string shapeColor, bool isValid)
        {
            // Reset basic color first
            // (Standard approach: GridManager fires RedrawGrid first, then Preview is layered on top)
            Color previewCol = isValid 
                ? new Color(0.0f, 1.0f, 0.4f, 0.45f) // Success validation: Green shadow
                : new Color(1.0f, 0.0f, 0.3f, 0.45f); // Invalid error validation: Red shadow

            foreach (var cell in targetCells)
            {
                if (cell.x >= 0 && cell.x < 8 && cell.y >= 0 && cell.y < 8)
                {
                    cellImageGrid[cell.x, cell.y].color = previewCol;
                }
            }
        }
    }
}
