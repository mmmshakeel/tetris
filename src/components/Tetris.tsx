import React, { useEffect, useRef, useState } from 'react';
import { COLS, ROWS, COLORS, LIGHT_COLORS, DARK_COLORS } from '../game/constants';
import { TetrisEngine, GameState } from '../game/TetrisEngine';
import { SoundManager } from '../game/SoundManager';

interface TetrisProps {
  onStateChange: (state: GameState) => void;
  engineRef: React.MutableRefObject<TetrisEngine | null>;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
}

export const Tetris: React.FC<TetrisProps> = ({ onStateChange, engineRef, soundEnabled = true, musicEnabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const soundManagerRef = useRef<SoundManager | null>(null);
  const [blockSize, setBlockSize] = useState(30);

  useEffect(() => {
    if (!soundManagerRef.current) {
      soundManagerRef.current = new SoundManager();
    }
    soundManagerRef.current.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMusicEnabled(musicEnabled);
    }
  }, [musicEnabled]);

  useEffect(() => {
    const engine = new TetrisEngine(onStateChange, soundManagerRef.current || undefined);
    engineRef.current = engine;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      engine.update(deltaTime);
      draw(engine);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const recalcBlockSize = () => {
      const { clientWidth, clientHeight } = container;
      // Subtract padding (8px * 2) and border (1px * 2) = 18px to ensure
      // the canvas fits completely within the container content area.
      const paddingAndBorder = 18;
      const availableWidth = Math.max(0, clientWidth - paddingAndBorder);
      const availableHeight = Math.max(0, clientHeight - paddingAndBorder);

      // Calculate block size to fit both available width and height
      const widthBasedSize = Math.floor(availableWidth / COLS);
      const heightBasedSize = Math.floor(availableHeight / ROWS);
      const next = Math.max(0, Math.min(widthBasedSize, heightBasedSize));
      setBlockSize((prev) => (prev === next ? prev : next));
    };

    // Observe the container itself so the canvas re-fits whenever its box
    // changes size (mobile NEXT preview appearing, URL bar show/hide,
    // orientation change) — not just on window resize.
    const observer = new ResizeObserver(recalcBlockSize);
    observer.observe(container);
    recalcBlockSize();

    return () => observer.disconnect();
  }, []);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, colorIndex: number) => {
    if (colorIndex === 0) return;

    const size = blockSize;
    const px = x * size;
    const py = y * size;

    // Draw main block
    ctx.fillStyle = COLORS[colorIndex];
    ctx.fillRect(px, py, size, size);

    // Draw 3D edges
    const edgeSize = Math.max(2, Math.floor(size * 0.15));

    // Top edge (light)
    ctx.fillStyle = LIGHT_COLORS[colorIndex];
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + size, py);
    ctx.lineTo(px + size - edgeSize, py + edgeSize);
    ctx.lineTo(px + edgeSize, py + edgeSize);
    ctx.fill();

    // Left edge (light)
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + size);
    ctx.lineTo(px + edgeSize, py + size - edgeSize);
    ctx.lineTo(px + edgeSize, py + edgeSize);
    ctx.fill();

    // Bottom edge (dark)
    ctx.fillStyle = DARK_COLORS[colorIndex];
    ctx.beginPath();
    ctx.moveTo(px, py + size);
    ctx.lineTo(px + size, py + size);
    ctx.lineTo(px + size - edgeSize, py + size - edgeSize);
    ctx.lineTo(px + edgeSize, py + size - edgeSize);
    ctx.fill();

    // Right edge (dark)
    ctx.beginPath();
    ctx.moveTo(px + size, py);
    ctx.lineTo(px + size, py + size);
    ctx.lineTo(px + size - edgeSize, py + size - edgeSize);
    ctx.lineTo(px + size - edgeSize, py + edgeSize);
    ctx.fill();
  };

  const draw = (engine: TetrisEngine) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * blockSize);
      ctx.lineTo(COLS * blockSize, r * blockSize);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * blockSize, 0);
      ctx.lineTo(c * blockSize, ROWS * blockSize);
      ctx.stroke();
    }

    // Draw locked blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (engine.grid[r][c] !== 0) {
          drawBlock(ctx, c, r, engine.grid[r][c]);
        }
      }
    }

    // Draw ghost piece
    let ghostY = engine.currentY;
    while (!engine.checkCollision(engine.currentX, ghostY + 1, engine.currentPiece)) {
      ghostY++;
    }
    
    ctx.globalAlpha = 0.2;
    for (let r = 0; r < engine.currentPiece.length; r++) {
      for (let c = 0; c < engine.currentPiece[r].length; c++) {
        if (engine.currentPiece[r][c] !== 0) {
          drawBlock(ctx, engine.currentX + c, ghostY + r, engine.currentPiece[r][c]);
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // Draw current piece
    for (let r = 0; r < engine.currentPiece.length; r++) {
      for (let c = 0; c < engine.currentPiece[r].length; c++) {
        if (engine.currentPiece[r][c] !== 0) {
          drawBlock(ctx, engine.currentX + c, engine.currentY + r, engine.currentPiece[r][c]);
        }
      }
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      switch (e.key) {
        case 'ArrowLeft':
          engine.move(-1);
          break;
        case 'ArrowRight':
          engine.move(1);
          break;
        case 'ArrowDown':
          engine.drop();
          break;
        case 'ArrowUp':
          engine.rotate();
          break;
        case ' ':
          engine.hardDrop();
          break;
        case 'p':
        case 'P':
          engine.togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle touch input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    const minSwipeDistance = 30;
    const moveThreshold = 20; // Distance to trigger a horizontal move

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      lastTouchX = touchStartX;
      lastTouchY = touchStartY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!engineRef.current || engineRef.current.isPaused || engineRef.current.isGameOver) return;
      e.preventDefault();

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - lastTouchX;
      const diffY = currentY - lastTouchY;

      // Horizontal movement
      if (Math.abs(diffX) > moveThreshold) {
        if (diffX > 0) {
          engineRef.current.move(1);
        } else {
          engineRef.current.move(-1);
        }
        lastTouchX = currentX;
      }

      // Vertical movement (soft drop)
      if (diffY > moveThreshold) {
        engineRef.current.drop();
        lastTouchY = currentY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // If it was a tap (very little movement)
      if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
        engineRef.current?.rotate();
      } 
      // Swipe Up for Hard Drop
      else if (diffY < -minSwipeDistance && Math.abs(diffX) < Math.abs(diffY)) {
        engineRef.current?.hardDrop();
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-zinc-950 p-2 rounded-xl shadow-2xl overflow-hidden border border-zinc-800 touch-none">
      <canvas
        ref={canvasRef}
        width={COLS * blockSize}
        height={ROWS * blockSize}
        className="block bg-zinc-900 shadow-inner touch-none"
        style={{ width: COLS * blockSize, height: ROWS * blockSize }}
      />
    </div>
  );
};
