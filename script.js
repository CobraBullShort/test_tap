const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 320;
canvas.height = 480;

let bird = {
    x: 50,
    y: 150,
    width: 20,
    height: 20,
    gravity: 0.54,
    lift: -9,
    velocity: 0
};

let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;

document.addEventListener("keydown", function(event) {
    if (event.code === "Space" && !gameOver) {
        bird.velocity = bird.lift;
    }
});

canvas.addEventListener("touchstart", function(event) {
    if (!gameOver) {
        bird.velocity = bird.lift;
    }
});

document.getElementById("startButton").addEventListener("click", function() {
    document.getElementById("startScreen").style.display = "none";
    canvas.style.display = "block";
    resetGame();  // Сбрасываем игру при каждом запуске
    gameLoop();
    loadLeaderboard(); // Загружаем лидерборд при старте игры
});

function drawBird() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    ctx.fillStyle = "green";
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, pipe.top, pipe.width, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, pipe.bottomHeight);
    });
}

function updatePipes() {
    if (frame % 90 === 0) {
        let gap = 105;
        let topHeight = Math.floor(Math.random() * (canvas.height - gap));
        pipes.push({
            x: canvas.width,
            top: 0,
            topHeight: topHeight,
            bottom: topHeight + gap,
            bottomHeight: canvas.height - topHeight - gap,
            width: 20
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= 2;
    });

    if (pipes.length > 0 && pipes[0].x < -pipes[0].width) {
        pipes.shift();
        score++;
    }
}

function checkCollision() {
    for (let i = 0; i < pipes.length; i++) {
        if (bird.x + bird.width > pipes[i].x && bird.x < pipes[i].x + pipes[i].width) {
            if (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].bottom) {
                endGame();
            }
        }
    }

    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        endGame();
    }
}

function endGame() {
    gameOver = true;
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);

    saveScore(score);
    loadLeaderboard(); // Обновляем лидерборд после завершения игры
}

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
}

// Функция для сохранения счета в localStorage
function saveScore(score) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push(score);
    leaderboard.sort((a, b) => b - a);
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10); // Храним только топ-10
    }
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Функция для загрузки и отображения лидерборда
function loadLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '<h2>Leaderboard</h2>';
    leaderboard.forEach((score, index) => {
        const entryElement = document.createElement('div');
        entryElement.textContent = `${index + 1}. Score: ${score}`;
        leaderboardElement.appendChild(entryElement);
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        updateBird();
        updatePipes();
        checkCollision();
    }

    drawBird();
    drawPipes();

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 10, 20);

    frame++;
    if (!gameOver && document.getElementById("startScreen").style.display === "none") {
        requestAnimationFrame(gameLoop);
    }
}