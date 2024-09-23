const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let animationFrameId; // Переменная для хранения идентификатора анимации
let gameLoopRunning = false; // Флаг для отслеживания состояния цикла игры

// Устанавливаем правильное соотношение сторон для канваса
function resizeCanvas() {
    const aspectRatio = 768 / 1024; // Соотношение сторон игры (ширина/высота)
    let newWidth = window.innerWidth * 0.9;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > window.innerHeight * 0.9) {
        newHeight = window.innerHeight * 0.9;
        newWidth = newHeight * aspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
}

resizeCanvas(); // Первоначальная адаптация
window.addEventListener('resize', resizeCanvas); // Адаптация при изменении размеров окна

// Загружаем изображение птички
const birdImage = new Image();
birdImage.src = 'bird.png'; // Укажите путь к вашему изображению

let bird = {
    x: 50,
    y: 150,
    width: 32,   // Ширина птички 32 пикселя
    height: 32,  // Высота птички 32 пикселя
    gravity: 0.54,
    lift: -9,
    velocity: 0
};

let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;
let showCollision = false; // Показывать место касания
let gameOverScreenShown = false; // Флаг для отображения экрана Game Over

// Предотвращаем зумирование при двойном тапе
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    let now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Предотвращаем зумирование при жестах
document.addEventListener('gesturestart', function(event) {
    event.preventDefault();
});
document.addEventListener('gesturechange', function(event) {
    event.preventDefault();
});
document.addEventListener('gestureend', function(event) {
    event.preventDefault();
});

// Предотвращаем масштабирование при использовании нескольких пальцев
document.addEventListener('touchmove', function(event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

// Обработчик события для кнопки "Start"
document.getElementById("startButton").addEventListener("click", function() {
    document.getElementById("startScreen").style.display = "none";  // Скрываем начальный экран
    canvas.style.display = "block";  // Показываем канвас
    resetGame();  // Сбрасываем параметры игры
    if (!gameLoopRunning) {
        gameLoop();
        gameLoopRunning = true;
    }
});

// Обработчики событий для других кнопок
document.getElementById("leaderboardButton").addEventListener("click", function() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("leaderboardScreen").style.display = "block";
    loadLeaderboard();
});

document.getElementById("backButton").addEventListener("click", function() {
    document.getElementById("leaderboardScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
});

// Обработчики событий для управления птичкой
document.addEventListener("keydown", function(event) {
    if (event.code === "Space" && !gameOver) {
        bird.velocity = bird.lift;
    }
});

// Обновленный обработчик touchstart для предотвращения зумирования
canvas.addEventListener("touchstart", function(event) {
    event.preventDefault(); // Предотвращаем зумирование
    if (!gameOver) {
        bird.velocity = bird.lift;
    }
}, { passive: false });

// Функции рисования и обновления игры
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    let angle = 0;

    if (bird.velocity < 0) {
        angle = -20 * Math.PI / 180;
    } else if (bird.velocity > 0) {
        angle = 20 * Math.PI / 180;
    }

    ctx.rotate(angle);
    ctx.drawImage(birdImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

function drawGround() {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

function drawPipes() {
    ctx.fillStyle = "green";
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, pipe.top, pipe.width, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, pipe.bottomHeight);
    });
}

function updatePipes() {
    const pipeInterval = 90 * 1.15;
    
    if (frame % Math.floor(pipeInterval) === 0) {
        let gap = 105;
        let topHeight = Math.floor(Math.random() * (canvas.height - gap - 50));
        pipes.push({
            x: canvas.width,
            top: 0,
            topHeight: topHeight,
            bottom: topHeight + gap,
            bottomHeight: canvas.height - topHeight - gap - 50,
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
        if (
            bird.x + bird.width - 5 > pipes[i].x &&
            bird.x + 5 < pipes[i].x + pipes[i].width &&
            (
                bird.y + 5 < pipes[i].topHeight ||
                bird.y + bird.height - 5 > pipes[i].bottom
            )
        ) {
            showCollision = true;
            endGame();
            break;
        }
    }

    if (bird.y + bird.height >= canvas.height - 50) {
        showCollision = true;
        endGame();
    }
}

function endGame() {
    if (!gameOver) {
        gameOver = true;
        bird.gravity = 1.5;
        saveScore(score);
    }
}

function showGameOverScreen() {
    ctx.fillStyle = "red";
    ctx.font = (canvas.height * 0.05) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);

    displayButtons();
}

function displayButtons() {
    const canvasRect = canvas.getBoundingClientRect();

    // Удаляем предыдущие кнопки, если они остались
    const existingRestartButton = document.getElementById('restartButton');
    const existingMenuButton = document.getElementById('menuButton');
    if (existingRestartButton) existingRestartButton.remove();
    if (existingMenuButton) existingMenuButton.remove();

    // Создаем кнопку "Начать сначала"
    const restartButton = document.createElement('button');
    restartButton.id = 'restartButton';
    restartButton.innerText = "Restart Game";
    restartButton.style.position = 'absolute';
    restartButton.style.top = (canvasRect.top + canvas.height / 2 + 50) + 'px';
    restartButton.style.left = (canvasRect.left + canvas.width / 2 - 50) + 'px';
    restartButton.onclick = function() {
        resetGame();
        restartButton.remove();
        menuButton.remove();
        if (!gameLoopRunning) {
            gameLoop();
            gameLoopRunning = true;
        }
    };

    // Создаем кнопку "Выйти в меню"
    const menuButton = document.createElement('button');
    menuButton.id = 'menuButton';
    menuButton.innerText = "Back to Menu";
    menuButton.style.position = 'absolute';
    menuButton.style.top = (canvasRect.top + canvas.height / 2 + 100) + 'px';
    menuButton.style.left = (canvasRect.left + canvas.width / 2 - 50) + 'px';
    menuButton.onclick = function() {
        document.getElementById("startScreen").style.display = "block";
        canvas.style.display = "none";
        restartButton.remove();
        menuButton.remove();
        // Останавливаем цикл игры
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            gameLoopRunning = false;
        }
    };

    // Добавляем кнопки в DOM
    document.body.appendChild(restartButton);
    document.body.appendChild(menuButton);
}

function resetGame() {
    // Останавливаем предыдущий цикл анимации
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        gameLoopRunning = false;
    }

    bird.y = 150;
    bird.velocity = 0;
    bird.gravity = 0.54;
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
    showCollision = false;
    gameOverScreenShown = false;

    resizeCanvas(); // Обновляем размеры канваса

    // Удаляем кнопки, если они остались
    const existingRestartButton = document.getElementById('restartButton');
    const existingMenuButton = document.getElementById('menuButton');
    if (existingRestartButton) existingRestartButton.remove();
    if (existingMenuButton) existingMenuButton.remove();
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
        leaderboard = leaderboard.slice(0, 10);
    }
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Функция для загрузки и отображения лидерборда
function loadLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';
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
    } else {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        if (!gameOverScreenShown && bird.y + bird.height >= canvas.height - 50) {
            bird.y = canvas.height - bird.height - 50;
            showGameOverScreen();
            gameOverScreenShown = true;
        }
    }

    drawPipes();
    drawGround();
    drawBird();

    // Обновляем настройки шрифта и позицию текста
    ctx.fillStyle = "black";
    ctx.font = (canvas.height * 0.03) + "px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score: " + score, canvas.width * 0.02, canvas.height * 0.02);

    frame++;
    // Сохраняем идентификатор анимации
    animationFrameId = requestAnimationFrame(gameLoop);
}
