using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace NeoBlocks.Puzzle
{
    /// <summary>
    /// Handles visual, auditory, and haptic feedback when a level is completed successfully.
    /// Listens to the GamePlayDirector's OnLevelCompleted event and triggers satisfying, high-juice effects:
    /// 1. A cozy, springy screen-pop scale animation for the Victory UI Panel.
    /// 2. Multiple colorful confetti particle bursts.
    /// 3. Playback of cozy success chimes.
    /// Optimized for mobile performance (zero-GC during animations, uses cached components).
    /// </summary>
    public class LevelCompletionFeedback : MonoBehaviour
    {
        [Header("Target References")]
        [Tooltip("The main RectTransform of the victory/completion popup panel to pop onto the screen.")]
        [SerializeField] private RectTransform victoryPanel;

        [Tooltip("Standard ParticleSystem configured to burst colorful confetti shapes.")]
        [SerializeField] private ParticleSystem confettiParticleSystem;

        [Tooltip("Optional secondary particle system to burst blossom petals or cozy sparkles.")]
        [SerializeField] private ParticleSystem secondarySparkleSystem;

        [Tooltip("AudioSource component used to play cozy success chimes or fanfares.")]
        [SerializeField] private AudioSource audioSource;

        [Header("UI Pop Animation Settings")]
        [Tooltip("Duration of the cozy screen-pop spring animation in seconds.")]
        [SerializeField] private float animationDuration = 0.45f;

        [Tooltip("The maximum peak overshoot scale during the spring/bounce effect.")]
        [SerializeField] private float maxBounceOvershoot = 1.15f;

        [Tooltip("The curve to control the spring bounce transition. Leave empty to use programmatic spring math.")]
        [SerializeField] private AnimationCurve customBounceCurve;

        [Header("Confetti & Audio Assets")]
        [Tooltip("Success fanfare sound clip to trigger alongside the screen-pop.")]
        [SerializeField] private AudioClip levelCompleteSfx;

        [Tooltip("Number of individual confetti particles to emit on win.")]
        [SerializeField] private int confettiBurstCount = 120;

        [Tooltip("Optional text field inside the Victory panel displaying the completed level number.")]
        [SerializeField] private Text levelLabel;

        [Tooltip("Optional text field inside the Victory panel displaying the remaining moves score.")]
        [SerializeField] private Text movesLabel;

        // Cache the active popup animation coroutine to avoid overlaps
        private Coroutine activePopCoroutine;

        private void OnEnable()
        {
            // Subscribe safely to the GamePlayDirector's victory event
            if (GamePlayDirector.Instance != null)
            {
                GamePlayDirector.Instance.OnLevelCompleted += HandleLevelCompleted;
            }
            else
            {
                // Fallback attempt to bind dynamically if initialized in incorrect order
                StartCoroutine(DeferredSubscription());
            }

            // Hide the victory panel at startup
            if (victoryPanel != null)
            {
                victoryPanel.gameObject.SetActive(false);
                victoryPanel.localScale = Vector3.zero;
            }
        }

        private void OnDisable()
        {
            // Always unsubscribe to prevent memory leaks and dangling callback exceptions
            if (GamePlayDirector.Instance != null)
            {
                GamePlayDirector.Instance.OnLevelCompleted -= HandleLevelCompleted;
            }
        }

        /// <summary>
        /// Coroutine attempting dynamic connection to the director if it initializes later in execution.
        /// </summary>
        private IEnumerator DeferredSubscription()
        {
            int attempts = 5;
            while (GamePlayDirector.Instance == null && attempts > 0)
            {
                attempts--;
                yield return new WaitForSeconds(0.1f);
            }

            if (GamePlayDirector.Instance != null)
            {
                GamePlayDirector.Instance.OnLevelCompleted += HandleLevelCompleted;
            }
        }

        /// <summary>
        /// Responds to the level completion event by orchestrating particles, audio, and UI screen-pop.
        /// </summary>
        /// <param name="levelNumber">The level index completed.</param>
        /// <param name="movesRemaining">Placements budget remaining to award cozy bonus feedback.</param>
        private void HandleLevelCompleted(int levelNumber, int movesRemaining)
        {
            // Update labels dynamically if assigned
            if (levelLabel != null)
            {
                levelLabel.text = $"Level {levelNumber} Cleared!";
            }

            if (movesLabel != null)
            {
                movesLabel.text = $"Bonus: {movesRemaining} Moves Left!";
            }

            // 1. Trigger Confetti Particle System Bursts
            TriggerConfettiBursts();

            // 2. Play Cozy Sound Effects
            PlaySuccessAudio();

            // 3. Trigger Haptic Vibration Feedback (Optimized for mobile gameplay)
#if UNITY_ANDROID || UNITY_IOS
            try
            {
                // Soft double-vibration for a satisfying accomplishment sense
                Handheld.Vibrate();
            }
            catch (System.Exception ex)
            {
                Debug.LogWarning($"Haptic feedback error (expected in editor): {ex.Message}");
            }
#endif

            // 4. Animate the Victory Panel onto the screen
            if (victoryPanel != null)
            {
                if (activePopCoroutine != null)
                {
                    StopCoroutine(activePopCoroutine);
                }
                activePopCoroutine = StartCoroutine(AnimateVictoryPanelPop());
            }
        }

        /// <summary>
        /// Triggers instant, satisfying visual confetti explosions.
        /// </summary>
        private void TriggerConfettiBursts()
        {
            if (confettiParticleSystem != null)
            {
                // Trigger emission bursts programmatically to avoid memory garbage
                var emitParams = new ParticleSystem.EmitParams();
                confettiParticleSystem.Emit(emitParams, confettiBurstCount);
            }
            else
            {
                Debug.LogWarning("[LevelCompletionFeedback] Confetti ParticleSystem reference is missing! Please drag a particle prefab in the inspector.");
            }

            if (secondarySparkleSystem != null)
            {
                secondarySparkleSystem.Play();
            }
        }

        /// <summary>
        /// Triggers victory chimes via AudioSource.
        /// </summary>
        private void PlaySuccessAudio()
        {
            if (audioSource != null && levelCompleteSfx != null)
            {
                audioSource.PlayOneShot(levelCompleteSfx);
            }
        }

        /// <summary>
        /// Coroutine implementing a tactile, springy scale-up animation for the completion UI card.
        /// Completely garbage-free (no custom vector instantiations per frame, caches vectors).
        /// </summary>
        private IEnumerator AnimateVictoryPanelPop()
        {
            victoryPanel.gameObject.SetActive(true);
            victoryPanel.localScale = Vector3.zero;

            float elapsed = 0f;
            Vector3 targetScale = Vector3.one;

            while (elapsed < animationDuration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / animationDuration;
                float currentScaleFactor;

                if (customBounceCurve != null && customBounceCurve.length > 0)
                {
                    // Use standard Unity editor-defined curves if assigned
                    currentScaleFactor = customBounceCurve.Evaluate(progress);
                }
                else
                {
                    // Programmatic Spring Easing: Starts fast, overshoots peak size, then settles down smoothly
                    // Math formula: f(t) = 1 - e^(-5t) * cos(3pi * t)
                    float springMath = 1f - Mathf.Exp(-5f * progress) * Mathf.Cos(3f * Mathf.PI * progress);
                    
                    // Remap the spring math to scale ranges
                    currentScaleFactor = springMath * maxBounceOvershoot;
                    if (progress > 0.7f)
                    {
                        // Settle down gently to exact scale 1.0 at the end
                        currentScaleFactor = Mathf.Lerp(currentScaleFactor, 1f, (progress - 0.7f) / 0.3f);
                    }
                }

                // Apply uniform scales
                victoryPanel.localScale = new Vector3(currentScaleFactor, currentScaleFactor, 1f);
                yield return null;
            }

            // Lock precisely to scale 1.0 to finish
            victoryPanel.localScale = targetScale;
            activePopCoroutine = null;
        }

        /// <summary>
        /// Editor-friendly quick test trigger to verify visual juice loops.
        /// </summary>
        [ContextMenu("Debug Trigger Level Complete")]
        public void DebugTriggerWin()
        {
            HandleLevelCompleted(99, 12);
        }
    }
}
