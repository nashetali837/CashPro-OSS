import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export const SwarmVisualizer: React.FC<{ data: any[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Boids Parameters
    const numParticles = 120;
    const visualRange = 50;
    const minDistance = 15;
    const cohesionFactor = 0.005;
    const separationFactor = 0.05;
    const alignmentFactor = 0.05;
    const targetFactor = 0.01;
    const speedLimit = 4;

    // Initialize particles (Fish)
    particles.current = Array.from({ length: numParticles }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: `rgba(242, 125, 38, ${0.4 + Math.random() * 0.4})`,
      size: 2 + Math.random() * 2
    }));

    let animationFrame: number;
    const render = () => {
      ctx.fillStyle = 'rgba(10, 11, 13, 0.15)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the "Forecast Path" line (The Stream)
      if (data && data.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(242, 125, 38, 0.05)';
        ctx.lineWidth = 2;
        data.forEach((point, i) => {
          const x = (i / data.length) * canvas.width;
          const y = canvas.height - (point.value / 30000000) * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      particles.current.forEach((p, i) => {
        let centerX = 0;
        let centerY = 0;
        let avgVX = 0;
        let avgVY = 0;
        let numNeighbors = 0;
        let closeDX = 0;
        let closeDY = 0;

        particles.current.forEach((other, j) => {
          if (i === j) return;

          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < visualRange) {
            // Cohesion & Alignment
            centerX += other.x;
            centerY += other.y;
            avgVX += other.vx;
            avgVY += other.vy;
            numNeighbors++;
          }

          if (dist < minDistance) {
            // Separation
            closeDX += p.x - other.x;
            closeDY += p.y - other.y;
          }
        });

        if (numNeighbors > 0) {
          // Apply Cohesion
          centerX /= numNeighbors;
          centerY /= numNeighbors;
          p.vx += (centerX - p.x) * cohesionFactor;
          p.vy += (centerY - p.y) * cohesionFactor;

          // Apply Alignment
          avgVX /= numNeighbors;
          avgVY /= numNeighbors;
          p.vx += (avgVX - p.vx) * alignmentFactor;
          p.vy += (avgVY - p.vy) * alignmentFactor;
        }

        // Apply Separation
        p.vx += closeDX * separationFactor;
        p.vy += closeDY * separationFactor;

        // Follow Forecast Target (Swarm "Leader" behavior)
        if (data && data.length > 0) {
          const dataIndex = Math.floor((p.x / canvas.width) * data.length);
          if (data[dataIndex]) {
            const targetY = canvas.height - (data[dataIndex].value / 30000000) * canvas.height;
            p.vy += (targetY - p.y) * targetFactor;
          }
        }

        // Speed Limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > speedLimit) {
          p.vx = (p.vx / speed) * speedLimit;
          p.vy = (p.vy / speed) * speedLimit;
        }

        // Update Position
        p.x += p.vx;
        p.y += p.vy;

        // Screen Wrap
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;

        // Draw "Fish" (Triangle pointing in velocity direction)
        const angle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.size * 2, 0);
        ctx.lineTo(-p.size, p.size);
        ctx.lineTo(-p.size, -p.size);
        ctx.closePath();
        ctx.fill();
        
        // Add a small "glow" to the head
        ctx.fillStyle = '#F27D26';
        ctx.beginPath();
        ctx.arc(p.size * 2, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [data]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#0A0B0D] rounded overflow-hidden border border-[#2A2D32] shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2">
        <div className="text-[10px] font-mono text-[#F27D26] uppercase tracking-widest bg-black/80 px-3 py-1.5 rounded border border-[#F27D26]/30 backdrop-blur-sm">
          Swarm Intelligence Simulation
        </div>
        <div className="flex gap-2">
          <div className="text-[8px] font-mono text-[#8E9299] bg-black/60 px-2 py-0.5 rounded border border-[#2A2D32]">COHESION: 0.005</div>
          <div className="text-[8px] font-mono text-[#8E9299] bg-black/60 px-2 py-0.5 rounded border border-[#2A2D32]">ALIGNMENT: 0.05</div>
          <div className="text-[8px] font-mono text-[#8E9299] bg-black/60 px-2 py-0.5 rounded border border-[#2A2D32]">SEPARATION: 0.05</div>
        </div>
      </div>
      
      {/* HUD Overlay */}
      <div className="absolute bottom-4 right-4 pointer-events-none text-right">
        <div className="text-[9px] font-mono text-[#8E9299] uppercase tracking-tighter">Scenario Convergence Depth</div>
        <div className="text-xl font-mono text-white font-bold tracking-tighter">1,024 PATHS</div>
      </div>
    </div>
  );
};
