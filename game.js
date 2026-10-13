// Cyber Dino Runner - Game Engine

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const highScoreEl = document.getElementById('highScore');
const currentScoreEl = document.getElementById('currentScore');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const gameOverSummary = document.getElementById('gameOverSummary');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const touchJumpBtn = document.getElementById('touchJumpBtn');
const touchDuckBtn = document.getElementById('touchDuckBtn');

// Audio Synthesizer (No external asset files needed!)
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playScore() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHit() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const sfx = new SoundFX();

soundToggleBtn.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  soundToggleBtn.textContent = sfx.enabled ? '🔊 Audio: ON' : '🔇 Audio: OFF';
});

// Game Constants
const GROUND_Y = 270;
const GRAVITY = 0.65;
const JUMP_FORCE = -13.5;

// Dino Player
class Dino {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 60;
    this.standWidth = 44;
    this.standHeight = 48;
    this.duckWidth = 56;
    this.duckHeight = 28;
    this.w = this.standWidth;
    this.h = this.standHeight;
    this.y = GROUND_Y - this.h;
    this.vy = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.legStep = 0;
    this.stepTimer = 0;
  }

  jump() {
    if (!this.isJumping) {
      this.vy = JUMP_FORCE;
      this.isJumping = true;
      sfx.playJump();
    }
  }

  duck(state) {
    if (this.isJumping && state) {
      // Fast drop
      this.vy += 1.8;
    }
    this.isDucking = state;
    if (this.isDucking) {
      this.w = this.duckWidth;
      this.h = this.duckHeight;
      this.y = GROUND_Y - this.h;
    } else {
      this.w = this.standWidth;
      this.h = this.standHeight;
      if (!this.isJumping) {
        this.y = GROUND_Y - this.h;
      }
    }
  }

  update() {
    // Jump mechanics
    if (this.isJumping) {
      this.y += this.vy;
      this.vy += GRAVITY;

      if (this.y >= GROUND_Y - this.h) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // Animation running legs
    this.stepTimer++;
    if (this.stepTimer > 6) {
      this.legStep = (this.legStep + 1) % 2;
      this.stepTimer = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Glowing Neon Dino
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00f2fe';

    if (!this.isDucking) {
      // Standing / Jumping Dino
      // Main body
      ctx.fillRect(8, 12, 28, 24);
      // Head
      ctx.fillRect(20, 0, 24, 18);
      // Snout
      ctx.fillRect(36, 6, 8, 10);
      // Eye (dark cutout)
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(24, 4, 4, 4);
      ctx.fillStyle = '#00f2fe';

      // Tail
      ctx.fillRect(0, 16, 8, 10);
      ctx.fillRect(0, 26, 4, 6);

      // Tiny Arms
      ctx.fillRect(30, 22, 6, 4);

      // Legs
      if (this.isJumping) {
        ctx.fillRect(14, 36, 6, 8);
        ctx.fillRect(26, 36, 6, 8);
      } else {
        if (this.legStep === 0) {
          ctx.fillRect(12, 36, 6, 12);
          ctx.fillRect(26, 36, 6, 6);
        } else {
          ctx.fillRect(12, 36, 6, 6);
          ctx.fillRect(26, 36, 6, 12);
        }
      }
    } else {
      // Ducking Dino
      // Long lower body
      ctx.fillRect(8, 6, 36, 14);
      // Head extending forward
      ctx.fillRect(36, 2, 20, 14);
      // Snout
      ctx.fillRect(52, 6, 4, 8);
      // Eye
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(40, 5, 4, 4);
      ctx.fillStyle = '#00f2fe';

      // Tail
      ctx.fillRect(0, 8, 8, 8);

      // Ducking legs
      if (this.legStep === 0) {
        ctx.fillRect(16, 20, 6, 8);
        ctx.fillRect(34, 20, 6, 4);
      } else {
        ctx.fillRect(16, 20, 6, 4);
        ctx.fillRect(34, 20, 6, 8);
      }
    }

    ctx.restore();
  }

  getBounds() {
    // Slightly forgiving bounding box
    const padding = 4;
    return {
      x: this.x + padding,
      y: this.y + padding,
      w: this.w - padding * 2,
      h: this.h - padding * 2
    };
  }
}

// Cactus Obstacle
class Cactus {
  constructor(speed) {
    this.type = 'cactus';
    this.speed = speed;
    this.variant = Math.floor(Math.random() * 3); // 0: single, 1: double, 2: tall
    
    if (this.variant === 0) {
      this.w = 20;
      this.h = 42;
    } else if (this.variant === 1) {
      this.w = 38;
      this.h = 42;
    } else {
      this.w = 26;
      this.h = 56;
    }
    this.x = canvas.width + 50;
    this.y = GROUND_Y - this.h;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#ff416c';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff416c';

    if (this.variant === 0) {
      // Single cactus
      ctx.fillRect(6, 0, 8, this.h);
      ctx.fillRect(0, 12, 6, 14);
      ctx.fillRect(14, 18, 6, 12);
    } else if (this.variant === 1) {
      // Double cactus
      ctx.fillRect(4, 8, 8, this.h - 8);
      ctx.fillRect(0, 16, 4, 10);
      ctx.fillRect(20, 0, 8, this.h);
      ctx.fillRect(28, 14, 6, 12);
    } else {
      // Tall cactus
      ctx.fillRect(8, 0, 10, this.h);
      ctx.fillRect(0, 16, 8, 16);
      ctx.fillRect(18, 22, 8, 16);
    }
    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x + 3,
      y: this.y + 2,
      w: this.w - 6,
      h: this.h - 4
    };
  }
}

// Pterodactyl Obstacle (Flying)
class Bird {
  constructor(speed) {
    this.type = 'bird';
    this.speed = speed * 1.05;
    this.w = 46;
    this.h = 30;
    this.x = canvas.width + 60;
    
    // Low (must duck), Mid (duck or jump), High (run underneath)
    const heights = [GROUND_Y - 32, GROUND_Y - 58, GROUND_Y - 85];
    this.y = heights[Math.floor(Math.random() * heights.length)];
    this.wingFrame = 0;
    this.timer = 0;
  }

  update() {
    this.x -= this.speed;
    this.timer++;
    if (this.timer > 8) {
      this.wingFrame = (this.wingFrame + 1) % 2;
      this.timer = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe600';

    // Body
    ctx.fillRect(12, 10, 24, 10);
    // Head & Beak
    ctx.fillRect(0, 8, 12, 8);
    ctx.fillRect(0, 12, 4, 8);

    // Wings
    if (this.wingFrame === 0) {
      // Wings Up
      ctx.fillRect(16, 0, 12, 10);
      ctx.fillRect(22, 0, 6, 4);
    } else {
      // Wings Down
      ctx.fillRect(16, 20, 12, 10);
      ctx.fillRect(22, 26, 6, 4);
    }

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      w: this.w - 8,
      h: this.h - 8
    };
  }
}

// Environment: Scrolling Ground and Starry Skyline
class Environment {
  constructor() {
    this.groundOffset = 0;
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (GROUND_Y - 40),
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  update(speed) {
    this.groundOffset = (this.groundOffset + speed) % 24;
    this.stars.forEach(star => {
      star.x -= star.speed;
      if (star.x < 0) star.x = canvas.width;
    });
  }

  draw(ctx) {
    // Stars
    this.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Horizon Line with Glow
    ctx.save();
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    // Cyberpunk grid ground texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = -this.groundOffset; x < canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x - 20, canvas.height);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Particles on hit
class ParticleManager {
  constructor() {
    this.particles = [];
  }

  burst(x, y, color = '#00f2fe') {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color
      });
    }
  }

  update() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // slight gravity
      p.life -= 0.03;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.restore();
    });
  }
}

// Main Game Controller
class Game {
  constructor() {
    this.dino = new Dino();
    this.env = new Environment();
    this.particles = new ParticleManager();
    this.obstacles = [];
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('chrono_dino_hi') || '0', 10);
    this.speed = 6.5;
    this.spawnTimer = 0;
    this.nextSpawn = 90;
    this.isPlaying = false;
    this.startTime = 0;
    this.lastMilestone = 0;

    this.updateHighScoreDisplay();
  }

  updateHighScoreDisplay() {
    highScoreEl.textContent = String(this.highScore).padStart(5, '0');
  }

  start() {
    sfx.init();
    this.dino.reset();
    this.obstacles = [];
    this.score = 0;
    this.speed = 6.5;
    this.spawnTimer = 0;
    this.nextSpawn = 80;
    this.isPlaying = true;
    this.startTime = Date.now();
    this.lastMilestone = 0;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
  }

  gameOver() {
    this.isPlaying = false;
    sfx.playHit();

    // Burst particles at dino
    this.particles.burst(this.dino.x + 20, this.dino.y + 20, '#ff416c');

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('chrono_dino_hi', this.highScore);
      this.updateHighScoreDisplay();
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    gameOverSummary.textContent = `You survived for ${elapsed} seconds!`;
    finalScoreEl.textContent = this.score;
    finalBestEl.textContent = this.highScore;

    setTimeout(() => {
      gameOverOverlay.classList.add('active');
    }, 400);
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.w &&
      rect1.x + rect1.w > rect2.x &&
      rect1.y < rect2.y + rect2.h &&
      rect1.y + rect1.h > rect2.y
    );
  }

  update() {
    if (this.isPlaying) {
      this.score++;
      currentScoreEl.textContent = String(this.score).padStart(5, '0');

      // Milestone audio cheer every 100 points
      if (this.score > 0 && this.score % 100 === 0 && this.score !== this.lastMilestone) {
        this.lastMilestone = this.score;
        sfx.playScore();
      }

      // Smooth gradual speed ramp
      this.speed = 6.5 + Math.min(this.score / 350, 9);

      this.dino.update();
      this.env.update(this.speed);

      // Obstacle spawning
      this.spawnTimer++;
      if (this.spawnTimer >= this.nextSpawn) {
        this.spawnTimer = 0;
        // Frequency varies slightly with speed
        this.nextSpawn = Math.floor(Math.random() * 45) + Math.max(50, 110 - this.speed * 4);

        // Spawn cactus or bird (birds appear once score > 150)
        if (this.score > 150 && Math.random() < 0.35) {
          this.obstacles.push(new Bird(this.speed));
        } else {
          this.obstacles.push(new Cactus(this.speed));
        }
      }

      // Update obstacles & check collisions
      const dinoBounds = this.dino.getBounds();
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.update();

        if (this.checkCollision(dinoBounds, obs.getBounds())) {
          this.gameOver();
          break;
        }

        // Remove offscreen
        if (obs.x + obs.w < -20) {
          this.obstacles.splice(i, 1);
        }
      }
    }

    this.particles.update();
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw world
    this.env.draw(ctx);
    this.dino.draw(ctx);

    // Draw obstacles
    this.obstacles.forEach(obs => obs.draw(ctx));

    // Draw effects
    this.particles.draw(ctx);
  }
}

// Instantiate and Loop
const game = new Game();

function loop() {
  game.update();
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keyboard Listeners
const activeKeys = {};

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (!game.isPlaying) {
      game.start();
    } else {
      game.dino.jump();
    }
  } else if (e.code === 'ArrowDown') {
    e.preventDefault();
    if (game.isPlaying) {
      game.dino.duck(true);
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') {
    if (game.isPlaying) {
      game.dino.duck(false);
    }
  }
});

// Click and Touch Events
startBtn.addEventListener('click', () => game.start());
restartBtn.addEventListener('click', () => game.start());

// Touch controls for mobile / screen buttons
touchJumpBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!game.isPlaying) {
    game.start();
  } else {
    game.dino.jump();
  }
});

touchDuckBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (game.isPlaying) {
    game.dino.duck(true);
  }
});

window.addEventListener('pointerup', () => {
  if (game.isPlaying) {
    game.dino.duck(false);
  }
});
