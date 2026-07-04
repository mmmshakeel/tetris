import { COLS, ROWS, SHAPES } from './constants';
import { SoundManager } from './SoundManager';

export type Grid = number[][];

export interface GameState {
  grid: Grid;
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  isPaused: boolean;
  nextPiece: number[][];
}

export class TetrisEngine {
  grid: Grid;
  score: number = 0;
  level: number = 1;
  lines: number = 0;
  isGameOver: boolean = false;
  isPaused: boolean = false;

  currentPiece: number[][] = [];
  currentX: number = 0;
  currentY: number = 0;
  
  nextPiece: number[][] = [];

  private dropCounter: number = 0;
  private dropInterval: number = 1000;
  private onStateChange: (state: GameState) => void;
  private soundManager?: SoundManager;

  constructor(onStateChange: (state: GameState) => void, soundManager?: SoundManager) {
    this.grid = this.getEmptyGrid();
    this.onStateChange = onStateChange;
    this.soundManager = soundManager;
    this.reset();
  }

  getEmptyGrid(): Grid {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  reset() {
    this.grid = this.getEmptyGrid();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.dropInterval = 1000;
    this.nextPiece = this.getRandomPiece();
    this.spawnPiece();
    this.soundManager?.startMusic();
    this.notifyStateChange();
  }

  getRandomPiece(): number[][] {
    const index = Math.floor(Math.random() * 7) + 1;
    return SHAPES[index];
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getRandomPiece();
    this.currentX = Math.floor(COLS / 2) - Math.floor(this.currentPiece[0].length / 2);
    this.currentY = 0;

    if (this.checkCollision(this.currentX, this.currentY, this.currentPiece)) {
      this.isGameOver = true;
      this.soundManager?.playGameOver();
    }
  }

  checkCollision(x: number, y: number, piece: number[][]): boolean {
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece[r].length; c++) {
        if (piece[r][c] !== 0) {
          const newX = x + c;
          const newY = y + r;

          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && this.grid[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  rotate() {
    if (this.isGameOver || this.isPaused) return;
    this.soundManager?.startMusic();

    // Transpose and reverse rows
    const rotated = this.currentPiece[0].map((_, index) =>
      this.currentPiece.map(row => row[index]).reverse()
    );

    // Wall kick logic (basic)
    let offset = 0;
    if (this.checkCollision(this.currentX, this.currentY, rotated)) {
      offset = 1;
      if (this.checkCollision(this.currentX + offset, this.currentY, rotated)) {
        offset = -1;
        if (this.checkCollision(this.currentX + offset, this.currentY, rotated)) {
          offset = 2;
          if (this.checkCollision(this.currentX + offset, this.currentY, rotated)) {
            offset = -2;
            if (this.checkCollision(this.currentX + offset, this.currentY, rotated)) {
              return; // Cannot rotate
            }
          }
        }
      }
    }

    this.currentPiece = rotated;
    this.currentX += offset;
    this.soundManager?.playRotate();
    this.notifyStateChange();
  }

  move(dir: number) {
    if (this.isGameOver || this.isPaused) return;
    this.soundManager?.startMusic();

    if (!this.checkCollision(this.currentX + dir, this.currentY, this.currentPiece)) {
      this.currentX += dir;
      this.soundManager?.playMove();
      this.notifyStateChange();
    }
  }

  drop() {
    if (this.isGameOver || this.isPaused) return;
    this.soundManager?.startMusic();

    if (!this.checkCollision(this.currentX, this.currentY + 1, this.currentPiece)) {
      this.currentY++;
      this.score += 1; // 1 point for soft drop
      this.notifyStateChange();
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    if (this.isGameOver || this.isPaused) return;
    this.soundManager?.startMusic();

    let dropDistance = 0;
    while (!this.checkCollision(this.currentX, this.currentY + 1, this.currentPiece)) {
      this.currentY++;
      dropDistance++;
    }
    this.score += dropDistance * 2; // 2 points per cell for hard drop
    this.soundManager?.playDrop();
    this.lockPiece();
  }

  lockPiece() {
    for (let r = 0; r < this.currentPiece.length; r++) {
      for (let c = 0; c < this.currentPiece[r].length; c++) {
        if (this.currentPiece[r][c] !== 0) {
          if (this.currentY + r < 0) {
            this.isGameOver = true;
            return;
          }
          this.grid[this.currentY + r][this.currentX + c] = this.currentPiece[r][c];
        }
      }
    }

    this.clearLines();
    this.spawnPiece();
    this.notifyStateChange();
  }

  clearLines() {
    let linesCleared = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(0));
        linesCleared++;
        r++; // Check the same row index again since we shifted down
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      
      // Original Nintendo scoring system
      const lineScores = [0, 40, 100, 300, 1200];
      this.score += lineScores[linesCleared] * this.level;

      if (linesCleared === 4) {
        this.soundManager?.playTetris();
      } else {
        this.soundManager?.playLineClear();
      }

      // Increase level every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.soundManager?.playLevelUp();
      }
      
      // Speed curve
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    }
  }

  update(deltaTime: number) {
    if (this.isGameOver || this.isPaused) return;

    this.dropCounter += deltaTime;

    if (this.dropCounter > this.dropInterval) {
      this.drop();
      this.dropCounter = 0;
    }
  }

  togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.soundManager?.stopMusic();
    } else {
      this.soundManager?.startMusic();
    }
    this.notifyStateChange();
  }

  notifyStateChange() {
    this.onStateChange({
      grid: this.grid,
      score: this.score,
      level: this.level,
      lines: this.lines,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      nextPiece: this.nextPiece,
    });
  }
}
