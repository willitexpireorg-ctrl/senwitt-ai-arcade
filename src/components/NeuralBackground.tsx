import React, { useEffect, useRef } from 'react';

export const NeuralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // High-DPI / Retina Screen Scaling Handling
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    setupCanvasSize();
    window.addEventListener('resize', setupCanvasSize);

    // Neural nodes calculation based on viewport width
    const nodeCount = Math.floor(Math.min(width, height) / 16);
    let time = 0;
    const nodes = Array.from({ length: nodeCount }).map((_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.2 + 1.2,
      alpha: Math.random() * 0.4 + 0.3,
      color: idx % 3 === 0 ? '#06b6d4' : idx % 3 === 1 ? '#8b5cf6' : '#6366f1',
    }));

    // Mouse interop
    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render connecting synapses
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Render & update nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Subtle mouse pull
        const mdx = mouseX - node.x;
        const mdy = mouseY - node.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 180) {
          node.x += (mdx / mdist) * 0.25;
          node.y += (mdy / mdist) * 0.25;
        }

        const pulseRadius = node.radius + Math.sin(time + node.x) * 0.5;

        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(0.5, pulseRadius), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setupCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
    />
  );
};
