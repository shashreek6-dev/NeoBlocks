import { useEffect, useRef } from "react";

interface ConfettiEffectProps {
  active: boolean;
  type?: "victory" | "cascade" | "perfect";
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

const COLORS = [
  "#FFC107", // Amber
  "#FF5722", // Orange
  "#E91E63", // Rose
  "#00BCD4", // Cyan
  "#4CAF50", // Emerald
  "#9C27B0", // Purple
  "#3F51B5", // Indigo
  "#FFEB3B", // Yellow
];

export default function ConfettiEffect({ active, type = "victory" }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Resize canvas
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create particles based on type
    const createParticle = (x: number, y: number, isBurst: boolean): Particle => {
      const angle = isBurst ? Math.random() * Math.PI * 2 : Math.PI / 2 + (Math.random() * 0.5 - 0.25);
      const speed = isBurst ? Math.random() * 8 + 4 : Math.random() * 4 + 2;

      return {
        x,
        y,
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speedX: Math.cos(angle) * speed,
        speedY: isBurst ? Math.sin(angle) * speed : speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() * 4 - 2) * 2,
        opacity: 1,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
      };
    };

    // Initialize particles
    if (type === "victory") {
      // Bottom left and right bursts
      const count = 100;
      for (let i = 0; i < count; i++) {
        // Left corner burst shooting up-right
        particles.push({
          ...createParticle(0, canvas.height, true),
          speedX: Math.random() * 12 + 5,
          speedY: -(Math.random() * 18 + 10),
        });
        // Right corner burst shooting up-left
        particles.push({
          ...createParticle(canvas.width, canvas.height, true),
          speedX: -(Math.random() * 12 + 5),
          speedY: -(Math.random() * 18 + 10),
        });
      }
    } else {
      // Direct center bursts for cascade or perfect clears
      const count = 80;
      const startX = canvas.width / 2;
      const startY = canvas.height / 2;
      for (let i = 0; i < count; i++) {
        particles.push({
          ...createParticle(startX, startY, true),
          speedY: (Math.random() * 14 - 7),
        });
      }
    }

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Move particles
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Add gravity/drag
        p.speedY += 0.2; // gravity
        p.speedX *= 0.98; // horizontal drag
        
        // Rotate and wobble
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.5;

        // Fade out as they fall near the bottom
        if (p.y > canvas.height * 0.7) {
          p.opacity -= 0.015;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        
        // Draw standard rectangular confetti shape
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();

        // Remove dead particles
        if (p.y > canvas.height || p.opacity <= 0) {
          particles.splice(index, 1);
        }
      });

      // Keep spawning minor ambient items if victory mode is active to extend duration
      if (type === "victory" && particles.length < 40 && Math.random() < 0.1) {
        particles.push({
          ...createParticle(Math.random() * canvas.width, -20, false),
          speedY: Math.random() * 3 + 2,
        });
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, type]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-55 w-full h-full"
      style={{ zIndex: 100 }}
    />
  );
}
