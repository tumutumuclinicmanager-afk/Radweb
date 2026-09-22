import React, { useEffect, useRef } from 'react';

interface PlasmaProps {
  color?: string;
  speed?: number;
  direction?: 'forward' | 'backward';
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Plasma: React.FC<PlasmaProps> = ({
  color = '#ff6b35',
  speed = 0.6,
  direction = 'forward',
  scale = 1.1,
  opacity = 0.8,
  mouseInteractive = true,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const handleResize = () => {
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || 600;
      canvas.width = width;
      canvas.height = height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteractive) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    if (mouseInteractive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const hexToRgb = (hex: string) => {
      const cleanHex = hex.replace('#', '');
      const bigint = parseInt(cleanHex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    };

    const rgb = hexToRgb(color);
    const dirMultiplier = direction === 'forward' ? 1 : -1;

    const render = () => {
      time += 0.016 * speed * dirMultiplier;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = opacity;

      const width = canvas.width;
      const height = canvas.height;
      const cols = 35;
      const rows = 25;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * cellW;
          const y = j * cellH;

          const cx = width * 0.5 + Math.sin(time * 0.8 + i * 0.3) * (width * 0.3 * scale);
          const cy = height * 0.5 + Math.cos(time * 0.6 + j * 0.3) * (height * 0.3 * scale);

          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const mx = mouseRef.current.x * width;
          const my = mouseRef.current.y * height;
          const mDist = Math.sqrt((x - mx) * (x - mx) + (y - my) * (y - my));
          const mouseFactor = mouseInteractive ? Math.max(0, 1 - mDist / 250) * 40 : 0;

          const wave = Math.sin(dist * 0.015 - time * 3) + Math.cos(i * 0.4 + time) + Math.sin(j * 0.4 - time * 1.5);
          const intensity = (wave + 3) / 6;

          const radius = Math.max(2, (cellW * 1.5) * intensity * scale + mouseFactor * 0.2);

          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, intensity * 0.7 + 0.1)})`;
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mouseInteractive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive]);

  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, ...style }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default Plasma;
