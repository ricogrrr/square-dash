import Strawberry from "./strawberry.js";
import Boost from "./boost.js";
import Obstacles from "./obstacles.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.documentElement.style.margin = "0";
document.documentElement.style.overflow = "hidden";

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let player = {
    x: 50,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    color: "blue",
    speed: 5,
    defaultSpeed: 5
};

let strawberry = new Strawberry(canvas);
let boost = new Boost(canvas);
let obstacles = new Obstacles(canvas, 0);

let score = 0;
let highScore = 0;
let level = 1;
let boostActive = false;
let boostTimeLeft = 0;
let isGameOver = false;
let keys = {};

document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
    if (isGameOver && event.key.toLowerCase() === "r") {
        restartGame();
    }
});

document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

function update() {
    if (isGameOver) return;

    if ((keys["arrowup"] || keys["w"]) && player.y > 0) {
        player.y -= player.speed;
    }
    if ((keys["arrowdown"] || keys["s"]) && player.y + player.height < canvas.height) {
        player.y += player.speed;
    }
    if ((keys["arrowleft"] || keys["a"]) && player.x > 0) {
        player.x -= player.speed;
    }
    if ((keys["arrowright"] || keys["d"]) && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }

    // Collision with strawberry
    if (
        player.x < strawberry.x + strawberry.width &&
        player.x + player.width > strawberry.x &&
        player.y < strawberry.y + strawberry.height &&
        player.y + player.height > strawberry.y
    ) {
        score++;
        strawberry.respawn();
        checkLevelUp();
    }

    // Collision with boost
    if (
        boost.active &&
        player.x < boost.x + boost.width &&
        player.x + player.width > boost.x &&
        player.y < boost.y + boost.height &&
        player.y + player.height > boost.y
    ) {
        activateBoost();
        boost.active = false;
        setTimeout(() => boost.respawn(), 7000);
    }

    // Collision with obstacles
    for (let obs of obstacles.obstacles) {
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            gameOver();
        }
    }

    if (boostActive) {
        boostTimeLeft -= 1 / 60;
        if (boostTimeLeft <= 0) {
            deactivateBoost();
        }
    }
}

function checkLevelUp() {
    if (score === 10) {
        level = 2;
        obstacles = new Obstacles(canvas, 4);
    } else if (score === 20) {
        level = 3;
        obstacles = new Obstacles(canvas, 8);
    } else if (score === 30) {
        level = 4;
        obstacles = new Obstacles(canvas, 12);
    }
}

function activateBoost() {
    if (!boostActive) {
        boostActive = true;
        player.speed = 10;
        boostTimeLeft = 5;
    }
}

function deactivateBoost() {
    boostActive = false;
    player.speed = player.defaultSpeed;
}

function gameOver() {
    isGameOver = true;
    if (score > highScore) {
        highScore = score;
    }
}

function restartGame() {
    isGameOver = false;
    score = 0;
    level = 1;
    player.x = 50;
    player.y = canvas.height / 2 - 25;
    obstacles = new Obstacles(canvas, 0);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isGameOver) {
        ctx.fillStyle = "red";
        ctx.font = "48px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText("Press 'R' to Restart", canvas.width / 2 - 100, canvas.height / 2 + 100);
        return;
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    strawberry.draw(ctx);
    boost.draw(ctx);
    obstacles.draw(ctx);

    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Level: ${level}`, 20, 100);

    if (boostActive) {
        ctx.fillStyle = "gold";
        ctx.fillText(`Boost: ${boostTimeLeft.toFixed(1)}s`, 20, 130);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
