import React, { useEffect, useRef } from 'react';

interface DarkVeilProps {
  className?: string;
  style?: React.CSSProperties;
}

export const DarkVeil: React.FC<DarkVeilProps> = ({ className = '', style = {} }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const render = () => {
      time += 0.008;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#090d16');
      gradient.addColorStop(0.5, '#020617');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cols = 25;
      const rows = 15;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * cellW;
          const y = j * cellH;

          const n = Math.sin(i * 0.3 + time * 2) * Math.cos(j * 0.3 - time * 1.5) * 45;
          const alpha = (Math.sin(time + i * 0.2 + j * 0.2) + 1) * 0.03 + 0.02;

          ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x + cellW / 2 + n, y + cellH / 2, Math.max(1, cellW * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, ...style }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default DarkVeil;
