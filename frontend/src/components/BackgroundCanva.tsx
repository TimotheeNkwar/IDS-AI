import { useEffect, useRef } from "react";

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const MAX_SPEED = 1;
    const CONNECT_DIST = 130;
    const THREAT_PROB = 0.07;
    const PARTICLE_COUNT = 110;
    const particles: any[] = [];
    const layerColors = [
      { r: 74, g: 158, b: 255 },
      { r: 100, g: 180, b: 255 },
      { r: 0, g: 212, b: 170 },
      { r: 130, g: 100, b: 255 },
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isThreat = Math.random() < THREAT_PROB;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: isThreat ? 3.5 : 2,
        threat: isThreat,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.04 + Math.random() * 0.03,
        layer: Math.floor(Math.random() * 4),
      });
    }

    const mouse = { x: -9999, y: -9999 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    let rafId: number;
    function draw() {
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.x = clamp(p.x, 0, W);
        p.y = clamp(p.y, 0, H);

        const mdx = p.x - mouse.x,
          mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 100 && mdist > 0) {
          const force = ((100 - mdist) / 100) * 0.003;
          p.vx += (mdx / mdist) * force * 60;
          p.vy += (mdy / mdist) * force * 60;
        }
        p.vx = clamp(p.vx, -MAX_SPEED, MAX_SPEED);
        p.vy = clamp(p.vy, -MAX_SPEED, MAX_SPEED);
        p.pulse += p.pulseSpeed;
        const glow = (Math.sin(p.pulse) + 1) / 2;

        if (p.threat) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 4 + glow * 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239,68,68,${0.15 + glow * 0.45})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239,68,68,${0.6 + glow * 0.4})`;
          ctx.fill();
        } else {
          const c = layerColors[p.layer];
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + glow, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.5 + glow * 0.4})`;
          ctx.fill();
        }
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i],
            b = particles[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= CONNECT_DIST) continue;
          const t = 1 - dist / CONNECT_DIST;
          const isThreatLink = a.threat || b.threat;
          if (isThreatLink) {
            ctx.strokeStyle = `rgba(239,68,68,${t * 0.5})`;
          } else {
            const ca = layerColors[a.layer];
            ctx.strokeStyle = `rgba(${ca.r},${ca.g},${ca.b},${t * 0.45})`;
          }
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    // cleanup quand le composant est démonté
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <>
      {/* BACKGROUND IMAGE LAYER */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('../../src/assets/images/background/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(18px) brightness(0.5) saturate(1.2)",
          transform: "scale(1.4)",
          zIndex: -3,
        }}
      />

      {/* VIGNETTE LAYER (IMPORTANT pour look premium) */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.2), rgba(0,0,0,0.85))",
          zIndex: -2,
        }}
      />

      {/* CANVAS LAYER */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
          opacity: 0.85,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
