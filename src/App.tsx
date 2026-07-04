import React, { useRef, useState } from 'react';
import { Tetris } from './components/Tetris';
import { GameState, TetrisEngine } from './game/TetrisEngine';
import { RotateCcw, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCw, Volume2, VolumeX, Music } from 'lucide-react';
import { COLORS, LIGHT_COLORS, DARK_COLORS } from './game/constants';

export default function App() {
  const engineRef = useRef<TetrisEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const handleStateChange = (state: GameState) => {
    setGameState({ ...state });
  };

  const handleMoveLeft = () => engineRef.current?.move(-1);
  const handleMoveRight = () => engineRef.current?.move(1);
  const handleRotate = () => engineRef.current?.rotate();
  const handleDrop = () => engineRef.current?.drop();
  const handleHardDrop = () => engineRef.current?.hardDrop();
  const handleTogglePause = () => engineRef.current?.togglePause();
  const handleRestart = () => engineRef.current?.reset();

  // Render the next piece preview
  const renderNextPiece = () => {
    if (!gameState?.nextPiece) return null;
    
    const piece = gameState.nextPiece;
    const blockSize = 20;
    const width = piece[0].length * blockSize;
    const height = piece.length * blockSize;

    return (
      <div className="flex items-center justify-center bg-zinc-900 rounded-lg p-4 border border-zinc-800 shadow-inner h-24">
        <div style={{ width, height, position: 'relative' }}>
          {piece.map((row, r) =>
            row.map((cell, c) => {
              if (cell === 0) return null;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: 'absolute',
                    top: r * blockSize,
                    left: c * blockSize,
                    width: blockSize,
                    height: blockSize,
                    backgroundColor: COLORS[cell],
                    borderTop: `3px solid ${LIGHT_COLORS[cell]}`,
                    borderLeft: `3px solid ${LIGHT_COLORS[cell]}`,
                    borderBottom: `3px solid ${DARK_COLORS[cell]}`,
                    borderRight: `3px solid ${DARK_COLORS[cell]}`,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-dvh bg-zinc-950 text-zinc-100 font-sans flex flex-col items-center justify-start p-2 sm:p-8 touch-none select-none overflow-hidden">
      {/* Mobile Header: Stats */}
      <div className="w-full max-w-[360px] flex flex-row justify-between items-center mb-2 lg:hidden px-2">
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Score</span>
          <span className="text-xl font-mono text-emerald-400 font-bold leading-none">{gameState?.score || 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Level</span>
          <span className="text-xl font-mono text-amber-400 font-bold leading-none">{gameState?.level || 1}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Lines</span>
          <span className="text-xl font-mono text-blue-400 font-bold leading-none">{gameState?.lines || 0}</span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center overflow-hidden">
        
        {/* Left Panel: Stats (Desktop Only) */}
        <div className="hidden lg:flex flex-col gap-4 w-48">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 shadow-lg text-center">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Score</h2>
            <div className="text-3xl font-mono text-emerald-400 font-bold">{gameState?.score || 0}</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 shadow-lg text-center">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Level</h2>
            <div className="text-2xl font-mono text-amber-400 font-bold">{gameState?.level || 1}</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 shadow-lg text-center">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Lines</h2>
            <div className="text-2xl font-mono text-blue-400 font-bold">{gameState?.lines || 0}</div>
          </div>
        </div>

        {/* Center: Game Board */}
        <div className="relative flex-1 w-full max-w-[300px] sm:max-w-[360px] h-full max-h-[80vh] lg:max-h-none aspect-[1/2]">
          <Tetris onStateChange={handleStateChange} engineRef={engineRef} soundEnabled={soundEnabled} musicEnabled={musicEnabled} />
          
          {/* Overlays */}
          {gameState?.isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
              <h2 className="text-4xl font-black text-red-500 mb-2 tracking-tighter">GAME OVER</h2>
              <p className="text-zinc-300 mb-6 font-mono">Final Score: {gameState.score}</p>
              <button 
                onClick={handleRestart}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-full transition-colors flex items-center gap-2"
              >
                <RotateCcw size={20} /> Play Again
              </button>
            </div>
          )}

          {gameState?.isPaused && !gameState?.isGameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
              <h2 className="text-3xl font-black text-white mb-6 tracking-widest">PAUSED</h2>
              <button 
                onClick={handleTogglePause}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full transition-colors flex items-center gap-2"
              >
                <Play size={20} /> Resume
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Next Piece & Controls */}
        <div className="hidden lg:flex flex-col gap-6 w-48">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 shadow-lg">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3 text-center">Next Piece</h2>
            {renderNextPiece()}
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 shadow-lg flex flex-col gap-3">
            <button 
              onClick={handleTogglePause}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              {gameState?.isPaused ? <Play size={16} /> : <Pause size={16} />}
              {gameState?.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button 
              onClick={handleRestart}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              <RotateCcw size={16} /> Restart
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </button>
            <button 
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              <Music size={16} className={musicEnabled ? "text-emerald-400" : "text-zinc-500"} />
              {musicEnabled ? 'Music On' : 'Music Off'}
            </button>
          </div>
        </div>

        {/* Mobile Mini Controls (Floating or Bottom) */}
        <div className="lg:hidden w-full max-w-[360px] flex justify-between items-center mt-2 px-2">
           <button 
              onClick={handleTogglePause}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400"
              aria-label="Toggle Pause"
            >
              {gameState?.isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            <button 
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`p-3 border rounded-full transition-all ${
                musicEnabled 
                  ? "bg-zinc-900 border-zinc-800 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]" 
                  : "bg-zinc-900 border-zinc-800/60 text-zinc-600"
              }`}
              aria-label="Toggle Music"
            >
              <Music size={20} />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Next</span>
              <div className="scale-75 origin-center">
                {renderNextPiece()}
              </div>
            </div>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 border rounded-full transition-all ${
                soundEnabled 
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300" 
                  : "bg-zinc-900 border-zinc-800/60 text-zinc-600"
              }`}
              aria-label="Toggle Sound Effects"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
}
