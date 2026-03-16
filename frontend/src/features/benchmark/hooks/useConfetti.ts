import { useCallback, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  life: number;
}

export default function useConfetti(colors: string[]) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);

  const ensureCanvas = useCallback(() => {
    if (canvasRef.current) return canvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    return canvas;
  }, []);

  const burst = useCallback(
    (count: number = 40, originY: number = 0.5) => {
      const canvas = ensureCanvas();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: Particle[] = [];
      const cx = canvas.width / 2;
      const cy = canvas.height * originY;

      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 4 + Math.random() * 8;
        particles.push({
          x: cx + (Math.random() - 0.5) * 100,
          y: cy + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          color: colors[Math.floor(Math.random() * colors.length)] || "#FFD700",
          size: 4 + Math.random() * 6,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          life: 1,
        });
      }

      cancelAnimationFrame(animRef.current);

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        for (const p of particles) {
          if (p.life <= 0) continue;
          alive = true;

          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          p.vx *= 0.99;
          p.rotation += p.rotSpeed;
          p.life -= 0.012;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }

        if (alive) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (canvasRef.current) {
            canvasRef.current.remove();
            canvasRef.current = null;
          }
        }
      };

      animRef.current = requestAnimationFrame(animate);
    },
    [colors, ensureCanvas],
  );

  const smallBurst = useCallback(() => burst(30, 0.4), [burst]);
  const doubleBurst = useCallback(() => {
    burst(50, 0.35);
    setTimeout(() => burst(50, 0.45), 200);
  }, [burst]);
  const tripleBurst = useCallback(() => {
    burst(60, 0.25);
    setTimeout(() => burst(60, 0.4), 200);
    setTimeout(() => burst(60, 0.55), 400);
  }, [burst]);
  const screenWideBurst = useCallback(() => {
    burst(100, 0.2);
    burst(100, 0.5);
    burst(100, 0.8);
    setTimeout(() => { burst(80, 0.3); burst(80, 0.7); }, 300);
    setTimeout(() => { burst(60, 0.1); burst(60, 0.5); burst(60, 0.9); }, 600);
  }, [burst]);
  const milestoneBurst = useCallback(() => burst(80, 0.3), [burst]);
  const celebrationBurst = useCallback(() => {
    burst(120, 0.3);
    setTimeout(() => burst(80, 0.5), 300);
    setTimeout(() => burst(60, 0.2), 600);
  }, [burst]);

  return { smallBurst, doubleBurst, tripleBurst, screenWideBurst, milestoneBurst, celebrationBurst };
}
