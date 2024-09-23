const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

document.getElementById("startButton").addEventListener("click", function() {
    document.getElementById("startScreen").style.display = "none";  // Скрываем начальный экран
    canvas.style.display = "block";  // Показываем канвас
    resetGame();  // Сбрасываем параметры игры
    gameLoop();  // Запускаем цикл игры
});

document.getElementById("leaderboardButton").addEventListener("click", function() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("leaderboardScreen").style.display = "block";
    loadLeaderboard();
});

document.getElementById("backButton").addEventListener("click", function() {
    document.getElementById("leaderboardScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
});

document.getElementById("restartButton").addEventListener("click", function() {
    document.getElementById("gameOverScreen").style.display = "none";
    resetGame();
    canvas.style.display = "block";
    // Не вызываем gameLoop() снова
});

document.getElementById("backToMenuButton").addEventListener("click", function() {
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
});

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

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2); // Перемещаем точку вращения к центру птицы
    let angle = 0;

    if (bird.velocity < 0) {
        angle = -20 * Math.PI / 180; // Поворачиваем вверх на 20 градусов
    } else if (bird.velocity > 0) {
        angle = 20 * Math.PI / 180; // Поворачиваем вниз на 20 градусов
    }

    ctx.rotate(angle); // Поворот канваса
    ctx.drawImage(birdImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height); // Отрисовываем птичку
    ctx.restore();
}

function drawGround() {
    ctx.fillStyle = "#8B4513"; // Коричневый цвет земли
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Земля внизу
}

function drawPipes() {
    ctx.fillStyle = "green";
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, pipe.top, pipe.width, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, pipe.bottomHeight);
    });
}

function updatePipes() {
    const pipeInterval = 90 * 1.15; // Увеличили интервал между трубами на 15%
    
    if (frame % Math.floor(pipeInterval) === 0) {
        let gap = 105;
        let topHeight = Math.floor(Math.random() * (canvas.height - gap - 50));
        pipes.push({
            x: canvas.width,
            top: 0,
            topHeight: topHeight,
            bottom: topHeight + gap,
            bottomHeight: canvas.height - topHeight - gap - 50, // Учитываем землю
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
            bird.x + bird.width - 5 > pipes[i].x &&    // уменьшение зоны коллизии
            bird.x + 5 < pipes[i].x + pipes[i].width && // уменьшение зоны коллизии
            (
                bird.y + 5 < pipes[i].topHeight ||       // уменьшение зоны коллизии сверху
                bird.y + bird.height - 5 > pipes[i].bottom // уменьшение зоны коллизии снизу
            )
        ) {
            showCollision = true;
            endGame();
            break; // Добавляем break, чтобы избежать дальнейших проверок после столкновения
        }
    }

    if (bird.y + bird.height >= canvas.height - 50) { // Птичка касается земли
        showCollision = true;
        endGame();
    }
}

function endGame() {
    if (!gameOver) {
        gameOver = true; // Устанавливаем флаг завершения игры
        bird.gravity = 1.5; // Увеличиваем гравитацию, чтобы птичка быстрее падала
        saveScore(score); // Сохраняем счет в лидерборд
    }
    // Удаляем setInterval, так как обновление происходит в gameLoop()
}

function showGameOverScreen() {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);

    // Отображаем кнопки на игровом поле
    displayButtons();
}

function displayButtons() {
    const canvasRect = canvas.getBoundingClientRect(); // Получаем координаты и размеры канваса

    // Удаляем предыдущие кнопки, если они остались
    const existingRestartButton = document.getElementById('restartButton');
    const existingMenuButton = document.getElementById('menuButton');
    if (existingRestartButton) existingRestartButton.remove();
    if (existingMenuButton) existingMenuButton.remove();

    // Создаем кнопку "Начать сначала"
    const restartButton = document.createElement('button');
    restartButton.id = 'restartButton'; // Устанавливаем ID для удобства
    restartButton.innerText = "Restart Game";
    restartButton.style.position = 'absolute';
    restartButton.style.top = (canvasRect.top + canvas.height / 2 + 50) + 'px';
    restartButton.style.left = (canvasRect.left + canvas.width / 2 - 50) + 'px';
    restartButton.onclick = function() {
        resetGame();
        restartButton.remove();
        menuButton.remove();
        // Не вызываем gameLoop() снова
    };

    // Создаем кнопку "Выйти в меню"
    const menuButton = document.createElement('button');
    menuButton.id = 'menuButton'; // Устанавливаем ID для удобства
    menuButton.innerText = "Back to Menu";
    menuButton.style.position = 'absolute';
    menuButton.style.top = (canvasRect.top + canvas.height / 2 + 100) + 'px';
    menuButton.style.left = (canvasRect.left + canvas.width / 2 - 50) + 'px';
    menuButton.onclick = function() {
        document.getElementById("startScreen").style.display = "block";
        canvas.style.display = "none";
        restartButton.remove();
        menuButton.remove();
    };

    // Добавляем кнопки в DOM
    document.body.appendChild(restartButton);
    document.body.appendChild(menuButton);
}

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    bird.gravity = 0.54; // Сброс гравитации на начальное значение
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
    showCollision = false; // Скрыть место столкновения
    gameOverScreenShown = false; // Сбрасываем флаг отображения экрана Game Over

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
        leaderboard = leaderboard.slice(0, 10); // Храним только топ-10
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
        // Птичка продолжает падать после завершения игры
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        // Останавливаем птичку, когда она касается земли
        if (!gameOverScreenShown && bird.y + bird.height >= canvas.height - 50) {
            bird.y = canvas.height - bird.height - 50; // Останавливаем птичку на земле
            showGameOverScreen(); // Показываем экран с результатами
            gameOverScreenShown = true; // Устанавливаем флаг, чтобы избежать повторного вызова
        }
    }

    drawPipes();
    drawGround(); // Рисуем землю
    drawBird();   // Отрисовываем птичку на переднем плане

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 10, 20);

    frame++;
    requestAnimationFrame(gameLoop); // Продолжаем цикл игры
}
