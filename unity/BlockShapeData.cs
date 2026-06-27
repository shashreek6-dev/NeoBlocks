using UnityEngine;

namespace NeoBlocks.Puzzle
{
    /// <summary>
    /// ScriptableObject defining layout configurations of custom block shapes.
    /// Uses a 2D integer matrix array representation (1 is solid block segment, 0 is empty space).
    /// </summary>
    [CreateAssetMenu(fileName = "NewBlockShapeData", menuName = "NeoBlocks/Block Shape Data", order = 1)]
    public class BlockShapeData : ScriptableObject
    {
        [Header("Block Visual Identity")]
        [Tooltip("Unique ID characterizing this block configuration.")]
        [SerializeField] private string shapeId = "Basic_Square";

        [Tooltip("The neon display color code identifier mapping (e.g. 'cyan', 'magenta', 'emerald').")]
        [SerializeField] private string colorKey = "cyan";

        [Header("Shape Matrix Dimension Setup")]
        [Tooltip("Width of the shape configuration matrix.")]
        [Range(1, 5)]
        [SerializeField] private int width = 2;

        [Tooltip("Height of the shape configuration matrix.")]
        [Range(1, 5)]
        [SerializeField] private int height = 2;

        [Tooltip("Flat 1D array serializing the 2D layout (row-by-row, left-to-right). Length MUST equal (width * height).")]
        [SerializeField] private int[] flatMatrix = new int[] { 1, 1, 1, 1 }; // Default to 2x2 Square

        public string ShapeId => shapeId;
        public string ColorKey => colorKey;
        public int Width => width;
        public int Height => height;

        /// <summary>
        /// Converts the serializable flat 1D matrix list into a 2D integer array suitable for gameplay calculations.
        /// </summary>
        /// <returns>A 2D integer matrix array representing the block structure.</returns>
        public int[,] GetShapeMatrix()
        {
            int[,] matrix = new int[height, width];

            if (flatMatrix == null || flatMatrix.Length != width * height)
            {
                Debug.LogWarning($"[BlockShapeData] Shape matrix flat serialization on '{name}' is corrupt or uninitialized. Defaulting to empty block.");
                return matrix;
            }

            for (int r = 0; r < height; r++)
            {
                for (int c = 0; c < width; c++)
                {
                    matrix[r, c] = flatMatrix[r * width + c];
                }
            }

            return matrix;
        }

        #if UNITY_EDITOR
        /// <summary>
        /// Editor-only validation check to safeguard data initialization accuracy.
        /// </summary>
        private void OnValidate()
        {
            int requiredLength = width * height;
            if (flatMatrix == null || flatMatrix.Length != requiredLength)
            {
                System.Array.Resize(ref flatMatrix, requiredLength);
            }
        }
        #endif
    }
}
