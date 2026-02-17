const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");
const hud = document.getElementById("hud");
const scoreValue = document.getElementById("score");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

/**
 * Global game state
 */
const game = {
  running: false,
  score: 0,
  animationFrameId: null,
  keys: {
    left: false,
    right: false,
  },
};

class Paddle {
  constructor() {
    this.width = 120;
    this.height = 14;
    this.speed = 8;
    this.reset();
  }

  reset() {
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 18;
  }

  update() {
    if (game.keys.left) this.x -= this.speed;
    if (game.keys.right) this.x += this.speed;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
  }

  draw() {
    ctx.fillStyle = "#48cae4";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Ball {
  constructor() {
    this.radius = 8;
    this.baseSpeed = 5;
    this.reset();
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height - 55;
    this.dx = this.baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    this.dy = -this.baseSpeed;
  }

  update(paddle, bricks) {
    this.x += this.dx;
    this.y += this.dy;

    // Wall collision
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.dx *= -1;
    } else if (this.x + this.radius > canvas.width) {
      this.x = canvas.width - this.radius;
      this.dx *= -1;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.dy *= -1;
    }

    // Paddle collision
    if (
      this.y + this.radius >= paddle.y &&
      this.y - this.radius <= paddle.y + paddle.height &&
      this.x >= paddle.x &&
      this.x <= paddle.x + paddle.width &&
      this.dy > 0
    ) {
      this.y = paddle.y - this.radius;
      this.dy *= -1;

      // Give angle based on hit position on paddle.
      const hitOffset = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      this.dx = this.baseSpeed * hitOffset;
      if (Math.abs(this.dx) < 1.5) this.dx = 1.5 * Math.sign(this.dx || 1);
    }

    // Brick collision
    for (const brick of bricks.items) {
      if (!brick.active) continue;

      const hit =
        this.x + this.radius > brick.x &&
        this.x - this.radius < brick.x + brick.width &&
        this.y + this.radius > brick.y &&
        this.y - this.radius < brick.y + brick.height;

      if (hit) {
        brick.active = false;
        game.score += 10;
        updateScore();

        // Basic bounce resolution (invert y).
        this.dy *= -1;
        break;
      }
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.fill();
    ctx.closePath();
  }
}

class Bricks {
  constructor() {
    this.rows = 6;
    this.cols = 10;
    this.width = 68;
    this.height = 22;
    this.padding = 8;
    this.offsetTop = 45;
    this.offsetLeft = 22;
    this.items = [];
  }

  reset() {
    this.items = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        this.items.push({
          x: this.offsetLeft + col * (this.width + this.padding),
          y: this.offsetTop + row * (this.height + this.padding),
          width: this.width,
          height: this.height,
          active: true,
          color: `hsl(${200 + row * 16}, 80%, ${52 - row * 2}%)`,
        });
      }
    }
  }

  draw() {
    for (const brick of this.items) {
      if (!brick.active) continue;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    }
  }

  remaining() {
    return this.items.filter((brick) => brick.active).length;
  }
}

const paddle = new Paddle();
const ball = new Ball();
const bricks = new Bricks();

function updateScore() {
  scoreValue.textContent = String(game.score);
}

function resetGame() {
  game.score = 0;
  updateScore();
  paddle.reset();
  ball.reset();
  bricks.reset();
}

function drawBackground() {
  ctx.fillStyle = "#000814";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  if (!game.running) return;

  drawBackground();
  paddle.update();
  ball.update(paddle, bricks);

  bricks.draw();
  paddle.draw();
  ball.draw();

  // Lose condition
  if (ball.y - ball.radius > canvas.height) {
    endGame(false);
    return;
  }

  // Win condition
  if (bricks.remaining() === 0) {
    endGame(true);
    return;
  }

  game.animationFrameId = requestAnimationFrame(gameLoop);
}

function showElement(el) {
  el.classList.remove("hidden");
  el.classList.add("active");
}

function hideElement(el) {
  el.classList.remove("active");
  el.classList.add("hidden");
}

function startGame() {
  resetGame();
  hideElement(startScreen);
  hideElement(endScreen);
  showElement(hud);
  game.running = true;
  game.animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame(isWin) {
  game.running = false;
  if (game.animationFrameId) {
    cancelAnimationFrame(game.animationFrameId);
    game.animationFrameId = null;
  }

  endTitle.textContent = isWin ? "You Win!" : "Game Over";
  endMessage.textContent = `Final score: ${game.score}`;
  restartButton.textContent = isWin ? "Play Again" : "Restart";

  hideElement(hud);
  showElement(endScreen);
}

// Keyboard controls
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") game.keys.left = true;
  if (event.key === "ArrowRight") game.keys.right = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") game.keys.left = false;
  if (event.key === "ArrowRight") game.keys.right = false;
});

// Mouse controls
canvas.addEventListener("mousemove", (event) => {
  if (!game.running) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  paddle.x = mouseX - paddle.width / 2;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) {
    paddle.x = canvas.width - paddle.width;
  }
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// Draw a default blank board on load.
drawBackground();
