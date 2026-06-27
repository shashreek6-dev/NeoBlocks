import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playVictorySound } from "../utils/audio";

interface CelebrationOverlayProps {
  levelNumber: number;
  levelName: string;
  onNextLevel: () => void;
  soundOn: boolean;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  angle: number;
  spin: number;
}

const STAR_COLORS = [
  "#ff007f", // Neon pink
  "#00f0ff", // Neon cyan
  "#00ff88", // Neon green
  "#ffeb3b", // Yellow
  "#a020f0", // Purple
  "#ff6b00", // Orange
];

export default function CelebrationOverlay({
  levelNumber,
  levelName,
  onNextLevel,
  soundOn,
}: CelebrationOverlayProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [flashActive, setFlashActive] = useState(true);

  // Initialize particles and trigger victory audio
  useEffect(() => {
    // Play synthesizer victory chord
    if (soundOn) {
      playVictorySound();
    }

    // Trigger full screen visual flash decay
    const flashTimer = setTimeout(() => {
      setFlashActive(false);
    }, 400);

    // Generate drift stars (vibrant neon particles)
    const newStars: Star[] = Array.from({ length: 40 }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 100, // percentage width
      y: 110 + Math.random() * 20, // start below viewport
      size: Math.random() * 24 + 14, // size in pixels
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      delay: Math.random() * 1.5,
      duration: Math.random() * 3 + 2.5,
      angle: Math.random() * 360,
      spin: (Math.random() * 4 - 2) * 360,
    }));

    setStars(newStars);

    return () => clearTimeout(flashTimer);
  }, [levelNumber, soundOn]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black/85 select-none pointer-events-auto">
      {/* ⚡ Camera Flash Effect Overlay */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 bg-white z-55 pointer-events-none mix-blend-screen"
          />
        )}
      </AnimatePresence>

      {/* 🌌 Animated Drift Neon Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map((star) => (
          <motion.svg
            key={star.id}
            initial={{ y: "110vh", x: `${star.x}vw`, rotate: star.angle, opacity: 0, scale: 0.5 }}
            animate={{
              y: "-15vh",
              x: `${star.x + (Math.random() * 10 - 5)}vw`,
              rotate: star.angle + star.spin,
              opacity: [0, 1, 1, 0.7, 0],
              scale: [0.5, 1.2, 1, 1, 0.8],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              ease: "easeOut",
              repeat: Infinity,
              repeatType: "loop",
            }}
            style={{
              position: "absolute",
              width: star.size,
              height: star.size,
              color: star.color,
              filter: `drop-shadow(0 0 8px ${star.color})`,
            }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192L12 .587z" />
          </motion.svg>
        ))}
      </div>

      {/* 🏆 Central Interactive Win Card */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.1 }}
        className="relative px-8 py-10 rounded-3xl border-[4px] border-[#00ff88] bg-[#070a13] text-center max-w-sm mx-4 shadow-[0_0_50px_rgba(0,255,136,0.5)] z-20"
      >
        {/* Glow halo */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#00f0ff] to-[#00ff88] opacity-20 blur-xl pointer-events-none" />

        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-7xl mb-4"
        >
          🌟
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-[#00f0ff] to-[#ff007f] uppercase animate-pulse">
          Perfect Clear!
        </h2>

        <p className="text-gray-400 text-xs uppercase tracking-wider font-mono mt-2">
          Level {levelNumber} Complete
        </p>

        <p className="text-[#00f0ff] font-sans font-medium text-sm mt-1 mb-8">
          "{levelName}"
        </p>

        {/* Next Level Button */}
        <motion.button
          whileHover={{ scale: 1.08, boxShadow: "0 0 25px rgba(0, 255, 136, 0.9)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onNextLevel}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#00ff88] to-[#00b35f] text-black font-extrabold rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.5)] transition-all cursor-pointer font-sans tracking-wide uppercase text-sm border-t-[3px] border-white/40 active:border-t-0"
        >
          Next Level →
        </motion.button>
      </motion.div>
    </div>
  );
}
