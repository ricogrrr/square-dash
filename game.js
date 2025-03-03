class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameLoop = null;
        this.gameState = 'menu';
        this.gameMode = 'classic'; // classic, speedrun
        this.scoreMultiplier = 1;
        this.powerUpTimer = null;
        this.lastPowerUpTime = 0;
        this.activeBoosts = {
            speed: [],
            multiplier: []
        };
        
        // Speedrun tracking
        this.startTime = null;
        this.speedrunTime = null;
        this.targetScore = 30;
        
        // Player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 30,
            speed: 5,
            baseSpeed: 5,
            color: '#4CAF50'
        };
        
        // Game elements
        this.strawberries = [];
        this.obstacles = [];
        this.enemies = [];
        this.boosts = [];
        
        // Controls
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            s: false,
            a: false,
            d: false
        };
        
        // Power-up settings
        this.powerUpSettings = {
            spawnInterval: 15000, // Spawn every 15 seconds
            speedBoostDuration: 10000,
            multiplierDuration: 30000,
            maxStacks: 3 // Maximum number of stacks for each power-up
        };

        // Game mode settings
        this.gameModeSettings = {
            classic: {
                strawberrySpawnRate: 1,
                enemySpeedMultiplier: 1,
                powerUpFrequency: 1,
                description: "Classic mode - Balance of challenge and fun!"
            },
            speedrun: {
                strawberrySpawnRate: 2,
                enemySpeedMultiplier: 0.8,
                powerUpFrequency: 1.5,
                description: "Speedrun mode - Collect strawberries fast!"
            }
        };
        
        // User authentication
        this.currentUser = null;
        this.initializeAuth();
        
        // Initialize
        this.setupEventListeners();
        this.initializeLeaderboard();
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    initializeAuth() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateAuthUI();
        }
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
        document.getElementById('login-menu-btn').addEventListener('click', () => this.showLoginScreen());
        document.getElementById('back-to-menu-from-login').addEventListener('click', () => this.showMenu());

        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update leaderboard display
                this.displayLeaderboard(btn.dataset.tab);
            });
        });

        // Game mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update game mode
                this.gameMode = btn.dataset.mode;
                
                // Update description
                document.getElementById('mode-description').textContent = 
                    this.gameModeSettings[this.gameMode].description;
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });

        // Auth event listeners
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('register-btn').addEventListener('click', () => this.register());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'flex';
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'flex';
        });
        document.getElementById('login-to-submit').addEventListener('click', () => {
            this.showMenu();
            document.getElementById('show-login').click();
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showLoginScreen() {
        this.gameState = 'login';
        this.showScreen('login-screen');
    }

    showMenu() {
        this.gameState = 'menu';
        this.showScreen('menu-screen');
        // Reset container and canvas size
        document.getElementById('game-container').style.width = '800px';
        document.getElementById('game-container').style.height = '600px';
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Draw menu background animation
        this.drawMenuBackground();
    }

    showLeaderboard() {
        this.gameState = 'leaderboard';
        this.showScreen('leaderboard-screen');
        // Show classic mode leaderboard by default
        this.displayLeaderboard('classic');
    }

    startGame() {
        this.gameState = 'playing';
        this.showScreen('game-screen');
        this.resetGame();
        
        // Apply game mode settings
        const modeSettings = this.gameModeSettings[this.gameMode];
        this.powerUpSettings.spawnInterval = 15000 / modeSettings.powerUpFrequency;
        
        // Start time tracking for speedrun mode
        if (this.gameMode === 'speedrun') {
            this.startTime = Date.now();
            this.speedrunTime = null; // Reset speedrun time
        }
        
        // Make game container and canvas fullscreen
        document.getElementById('game-container').style.width = '100vw';
        document.getElementById('game-container').style.height = '100vh';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Update canvas dimensions
        this.handleResize();
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.strawberries = [];
        this.obstacles = [];
        this.enemies = [];
        this.boosts = [];
        this.activeBoosts = {
            speed: [],
            multiplier: []
        };
        this.player.speed = this.player.baseSpeed;
        this.scoreMultiplier = 1;
        this.startTime = null;
        this.speedrunTime = null;
        
        // Clear any existing power-up timers
        const powerUpTimer = document.getElementById('power-up-timer');
        if (powerUpTimer) {
            powerUpTimer.innerHTML = '';
            powerUpTimer.style.display = 'none';
        }
        
        this.spawnStrawberry();
        this.updateUI();
    }

    handleResize() {
        if (this.gameState === 'playing') {
            // Update canvas dimensions
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            // Adjust player position if needed
            this.player.x = Math.min(Math.max(this.player.x, this.player.size/2), this.canvas.width - this.player.size/2);
            this.player.y = Math.min(Math.max(this.player.y, this.player.size/2), this.canvas.height - this.player.size/2);
        }
    }

    isPositionValid(x, y, size, type) {
        // Check distance from player for new spawns
        const playerDistance = Math.sqrt(
            Math.pow(this.player.x - x, 2) + 
            Math.pow(this.player.y - y, 2)
        );
        const minPlayerDistance = 50; // Reduced from 100 to allow more spawns
        if (playerDistance < minPlayerDistance) {
            return false;
        }

        // Check collision with obstacles
        for (const obstacle of this.obstacles) {
            // For all elements, check if they're inside or too close to any obstacle
            const elementLeft = x - size/2;
            const elementRight = x + size/2;
            const elementTop = y - size/2;
            const elementBottom = y + size/2;

            const obstacleLeft = obstacle.x;
            const obstacleRight = obstacle.x + obstacle.width;
            const obstacleTop = obstacle.y;
            const obstacleBottom = obstacle.y + obstacle.height;

            // Check if the element overlaps with the obstacle
            if (elementLeft < obstacleRight &&
                elementRight > obstacleLeft &&
                elementTop < obstacleBottom &&
                elementBottom > obstacleTop) {
                return false;
            }

            // Add a small buffer zone around obstacles
            const buffer = 10;
            if (elementLeft < obstacleRight + buffer &&
                elementRight > obstacleLeft - buffer &&
                elementTop < obstacleBottom + buffer &&
                elementBottom > obstacleTop - buffer) {
                return false;
            }
        }

        // Check collision with strawberries
        for (const strawberry of this.strawberries) {
            const distance = Math.sqrt(
                Math.pow(x - strawberry.x, 2) + 
                Math.pow(y - strawberry.y, 2)
            );
            if (distance < (size + strawberry.size) / 1.5) { // Reduced from 2 to allow closer spawning
                return false;
            }
        }

        // Check collision with enemies
        for (const enemy of this.enemies) {
            const distance = Math.sqrt(
                Math.pow(x - enemy.x, 2) + 
                Math.pow(y - enemy.y, 2)
            );
            if (distance < (size + enemy.size) / 1.5) { // Reduced from 2 to allow closer spawning
                return false;
            }
        }

        return true;
    }

    findValidPosition(size, type) {
        const margin = 30; // Reduced from 50 to allow more spawns
        let attempts = 0;
        const maxAttempts = 50; // Reduced from 100 to prevent infinite loops
        
        while (attempts < maxAttempts) {
            const x = margin + Math.random() * (this.canvas.width - 2 * margin);
            const y = margin + Math.random() * (this.canvas.height - 2 * margin);
            
            if (this.isPositionValid(x, y, size, type)) {
                return { x, y };
            }
            attempts++;
        }
        
        // If no valid position found after max attempts, try with smaller margins
        const x = 10 + Math.random() * (this.canvas.width - 20); // Reduced from 20
        const y = 10 + Math.random() * (this.canvas.height - 20); // Reduced from 20
        return { x, y };
    }

    spawnStrawberry() {
        // Ensure at least one strawberry is always present
        if (this.strawberries.length === 0) {
            const position = this.findValidPosition(20, 'strawberry');
            const strawberry = {
                x: position.x,
                y: position.y,
                size: 20,
                color: '#FF0000'
            };
            this.strawberries.push(strawberry);
        }
    }

    spawnObstacle() {
        const obstacle = {
            x: Math.random() * (this.canvas.width - 100),
            y: Math.random() * (this.canvas.height - 100),
            // Base size of 40, increases by 5 per level, capped at 100
            width: Math.min(40 + (this.level * 5), 100),
            height: Math.min(40 + (this.level * 5), 100),
            color: '#666666'
        };
        this.obstacles.push(obstacle);
    }

    spawnEnemy() {
        const enemy = {
            x: Math.random() < 0.5 ? -30 : this.canvas.width + 30,
            y: Math.random() * this.canvas.height,
            size: 25,
            // Base speed of 2, increases by 0.3 per level, capped at 5
            speed: Math.min(2 + (this.level * 0.3), 5) * this.gameModeSettings[this.gameMode].enemySpeedMultiplier,
            color: '#FF4444'
        };
        this.enemies.push(enemy);
    }

    spawnPowerUp() {
        const currentTime = Date.now();
        if (currentTime - this.lastPowerUpTime >= this.powerUpSettings.spawnInterval) {
            const type = Math.random() < 0.5 ? 'speedBoost' : 'multiplier';
            const position = this.findValidPosition(30, 'powerup');
            const powerUp = {
                x: position.x,
                y: position.y,
                size: 30,
                type: type,
                color: type === 'speedBoost' ? '#FFFF00' : '#FF00FF'
            };
            this.boosts.push(powerUp);
            this.lastPowerUpTime = currentTime;
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.updatePlayer();
        this.updateEnemies();
        this.checkCollisions();
        this.draw();
        this.updateUI();

        // Level progression
        if (this.score > 0 && this.score % 5 === 0 && this.strawberries.length === 0) {
            this.level++;
            this.updateUI();
            
            // Spawn new enemies and obstacles when level increases
            const numEnemies = Math.min(1 + Math.floor(this.level / 2), 5); // 1-5 enemies based on level
            const numObstacles = Math.min(1 + Math.floor(this.level / 3), 4); // 1-4 obstacles based on level
            
            for (let i = 0; i < numEnemies; i++) {
                this.spawnEnemy();
            }
            for (let i = 0; i < numObstacles; i++) {
                this.spawnObstacle();
            }
        }

        // Spawn strawberries periodically
        if (this.strawberries.length < 3) {
            this.spawnStrawberry();
        }

        // Spawn enemies periodically
        if (this.enemies.length < Math.min(1 + Math.floor(this.level / 2), 5)) {
            this.spawnEnemy();
        }

        // Spawn obstacles periodically
        if (this.obstacles.length < Math.min(1 + Math.floor(this.level / 3), 4)) {
            this.spawnObstacle();
        }

        // Spawn power-ups periodically
        const currentTime = Date.now();
        if (currentTime - this.lastPowerUpTime > this.powerUpSettings.spawnInterval) {
            this.spawnPowerUp();
            this.lastPowerUpTime = currentTime;
        }

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    updatePlayer() {
        // Handle both WASD and Arrow keys
        if (this.keys.ArrowLeft || this.keys.a) this.player.x -= this.player.speed;
        if (this.keys.ArrowRight || this.keys.d) this.player.x += this.player.speed;
        if (this.keys.ArrowUp || this.keys.w) this.player.y -= this.player.speed;
        if (this.keys.ArrowDown || this.keys.s) this.player.y += this.player.speed;

        // Keep player in bounds
        this.player.x = Math.max(this.player.size/2, Math.min(this.canvas.width - this.player.size/2, this.player.x));
        this.player.y = Math.max(this.player.size/2, Math.min(this.canvas.height - this.player.size/2, this.player.y));
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }

            // Remove enemies that go off screen
            if (enemy.x < -50 || enemy.x > this.canvas.width + 50 ||
                enemy.y < -50 || enemy.y > this.canvas.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // Check strawberry collisions
        this.strawberries = this.strawberries.filter(strawberry => {
            const dx = this.player.x - strawberry.x;
            const dy = this.player.y - strawberry.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.player.size + strawberry.size) / 2) {
                this.score += 1 * this.scoreMultiplier;
                this.updateUI();
                
                // Check for speedrun completion
                if (this.gameMode === 'speedrun' && this.score >= this.targetScore) {
                    this.speedrunTime = Date.now() - this.startTime;
                    this.gameOver();
                }
                
                this.spawnStrawberry();
                return false;
            }
            return true;
        });

        // Check enemy collisions
        this.enemies.forEach(enemy => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.player.size + enemy.size) / 2) {
                this.gameOver();
            }
        });

        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            if (this.player.x + this.player.size/2 > obstacle.x &&
                this.player.x - this.player.size/2 < obstacle.x + obstacle.width &&
                this.player.y + this.player.size/2 > obstacle.y &&
                this.player.y - this.player.size/2 < obstacle.y + obstacle.height) {
                this.gameOver();
            }
        });

        // Check power-up collisions
        this.boosts = this.boosts.filter(boost => {
            const dx = this.player.x - boost.x;
            const dy = this.player.y - boost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.player.size + boost.size) / 2) {
                this.applyBoost(boost);
                return false;
            }
            return true;
        });
    }

    applyBoost(boost) {
        const powerUpTimer = document.getElementById('power-up-timer');
        powerUpTimer.style.display = 'flex';

        switch(boost.type) {
            case 'speedBoost':
                if (this.activeBoosts.speed.length < this.powerUpSettings.maxStacks) {
                    const speedBoost = {
                        id: Date.now(),
                        timeLeft: this.powerUpSettings.speedBoostDuration / 1000
                    };
                    
                    // If there's an existing speed boost, extend its duration
                    if (this.activeBoosts.speed.length > 0) {
                        const existingBoost = this.activeBoosts.speed[0];
                        existingBoost.timeLeft += this.powerUpSettings.speedBoostDuration / 1000;
                        const speedTimer = document.getElementById(`speed-timer-${existingBoost.id}`);
                        if (speedTimer) {
                            speedTimer.querySelector('.timer-value').textContent = `${Math.floor(existingBoost.timeLeft)}s`;
                        }
                    } else {
                        this.activeBoosts.speed.push(speedBoost);
                        this.player.speed = this.player.baseSpeed * (1 + this.activeBoosts.speed.length);
                        
                        const speedTimer = document.createElement('div');
                        speedTimer.className = 'timer-item speed';
                        speedTimer.id = `speed-timer-${speedBoost.id}`;
                        speedTimer.innerHTML = `
                            <div class="timer-icon"></div>
                            <span class="timer-value">${speedBoost.timeLeft}s</span>
                        `;
                        powerUpTimer.appendChild(speedTimer);

                        const speedInterval = setInterval(() => {
                            speedBoost.timeLeft--;
                            if (speedBoost.timeLeft > 0) {
                                speedTimer.querySelector('.timer-value').textContent = `${Math.floor(speedBoost.timeLeft)}s`;
                            }
                        }, 1000);

                        setTimeout(() => {
                            const index = this.activeBoosts.speed.findIndex(b => b.id === speedBoost.id);
                            if (index !== -1) {
                                this.activeBoosts.speed.splice(index, 1);
                                this.player.speed = this.player.baseSpeed * (1 + this.activeBoosts.speed.length);
                                speedTimer.remove();
                                if (this.activeBoosts.speed.length === 0 && this.activeBoosts.multiplier.length === 0) {
                                    powerUpTimer.style.display = 'none';
                                }
                            }
                            clearInterval(speedInterval);
                        }, this.powerUpSettings.speedBoostDuration);
                    }
                }
                break;

            case 'multiplier':
                if (this.activeBoosts.multiplier.length < this.powerUpSettings.maxStacks) {
                    const multiplierBoost = {
                        id: Date.now(),
                        timeLeft: this.powerUpSettings.multiplierDuration / 1000
                    };
                    
                    // If there's an existing multiplier boost, extend its duration
                    if (this.activeBoosts.multiplier.length > 0) {
                        const existingBoost = this.activeBoosts.multiplier[0];
                        existingBoost.timeLeft += this.powerUpSettings.multiplierDuration / 1000;
                        const multiplierTimer = document.getElementById(`multiplier-timer-${existingBoost.id}`);
                        if (multiplierTimer) {
                            multiplierTimer.querySelector('.timer-value').textContent = `${Math.floor(existingBoost.timeLeft)}s`;
                        }
                    } else {
                        this.activeBoosts.multiplier.push(multiplierBoost);
                        this.scoreMultiplier = 1 + this.activeBoosts.multiplier.length;
                        
                        const multiplierTimer = document.createElement('div');
                        multiplierTimer.className = 'timer-item multiplier';
                        multiplierTimer.id = `multiplier-timer-${multiplierBoost.id}`;
                        multiplierTimer.innerHTML = `
                            <div class="timer-icon"></div>
                            <span class="timer-value">${multiplierBoost.timeLeft}s</span>
                        `;
                        powerUpTimer.appendChild(multiplierTimer);

                        const multiplierInterval = setInterval(() => {
                            multiplierBoost.timeLeft--;
                            if (multiplierBoost.timeLeft > 0) {
                                multiplierTimer.querySelector('.timer-value').textContent = `${Math.floor(multiplierBoost.timeLeft)}s`;
                            }
                        }, 1000);

                        setTimeout(() => {
                            const index = this.activeBoosts.multiplier.findIndex(b => b.id === multiplierBoost.id);
                            if (index !== -1) {
                                this.activeBoosts.multiplier.splice(index, 1);
                                this.scoreMultiplier = 1 + this.activeBoosts.multiplier.length;
                                multiplierTimer.remove();
                                if (this.activeBoosts.speed.length === 0 && this.activeBoosts.multiplier.length === 0) {
                                    powerUpTimer.style.display = 'none';
                                }
                            }
                            clearInterval(multiplierInterval);
                        }, this.powerUpSettings.multiplierDuration);
                    }
                }
                break;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw player with glow effect when powered up
        if (this.player.speed > this.player.baseSpeed || this.scoreMultiplier > 1) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = this.player.speed > this.player.baseSpeed ? '#FFFF00' : '#FF00FF';
        }
        
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(
            this.player.x - this.player.size/2,
            this.player.y - this.player.size/2,
            this.player.size,
            this.player.size
        );
        this.ctx.shadowBlur = 0;

        // Draw strawberries with leaf
        this.strawberries.forEach(strawberry => {
            // Draw the strawberry body
            this.ctx.fillStyle = strawberry.color;
            this.ctx.beginPath();
            this.ctx.arc(strawberry.x, strawberry.y, strawberry.size/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw the leaf
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.ellipse(
                strawberry.x, 
                strawberry.y - strawberry.size/2, 
                strawberry.size/4, 
                strawberry.size/6, 
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
        });

        // Draw obstacles with slight glow
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#666666';
        this.ctx.fillStyle = '#666666';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Draw enemies with menacing glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#FF0000';
        this.ctx.fillStyle = '#FF4444';
        this.enemies.forEach(enemy => {
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw power-ups with distinctive glow
        this.boosts.forEach(boost => {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = boost.color;
            this.ctx.fillStyle = boost.color;
            this.ctx.beginPath();
            this.ctx.arc(boost.x, boost.y, boost.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.shadowBlur = 0;
    }

    updateUI() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('level-value').textContent = this.level;
        
        // Update UI to show active power-ups
        const gameUI = document.getElementById('game-ui');
        
        // Remove existing power-up indicators
        const existingPowerUps = gameUI.querySelectorAll('.power-up-indicator');
        existingPowerUps.forEach(el => el.remove());
        
        // Show active power-ups
        if (this.player.speed > this.player.baseSpeed) {
            const speedIndicator = document.createElement('div');
            speedIndicator.className = 'power-up-indicator speed';
            speedIndicator.textContent = '2x Speed';
            gameUI.appendChild(speedIndicator);
        }
        
        if (this.scoreMultiplier > 1) {
            const multiplierIndicator = document.createElement('div');
            multiplierIndicator.className = 'power-up-indicator multiplier';
            multiplierIndicator.textContent = '2x Score';
            gameUI.appendChild(multiplierIndicator);
        }
    }

    gameOver() {
        this.gameState = 'over';
        cancelAnimationFrame(this.gameLoop);
        
        if (this.gameMode === 'speedrun') {
            // Only set speedrun time if target was reached
            if (this.score >= this.targetScore) {
                this.speedrunTime = Date.now() - this.startTime;
                document.getElementById('final-score').textContent = 
                    `Time to collect ${this.targetScore} points: ${(this.speedrunTime / 1000).toFixed(2)}s`;
            } else {
                document.getElementById('final-score').textContent = 
                    `Failed to collect ${this.targetScore} points. Score: ${this.score}`;
            }
        } else {
            document.getElementById('final-score').textContent = `Final Score: ${this.score}`;
        }
        
        this.showScreen('game-over-screen');
    }

    initializeLeaderboard() {
        // Reset both leaderboards
        localStorage.setItem('leaderboard', JSON.stringify([]));
        localStorage.setItem('speedrunLeaderboard', JSON.stringify([]));
    }

    submitScore() {
        if (!this.currentUser) {
            alert('Please log in to submit your score');
            return;
        }

        if (this.gameMode === 'speedrun') {
            // Don't allow score submission if target wasn't reached
            if (this.score < this.targetScore) {
                alert('You need to collect 30 strawberries to submit a speedrun score!');
                return;
            }

            // Only allow submission if the game was completed and speedrun time exists
            if (!this.speedrunTime) {
                alert('You need to complete the speedrun challenge to submit a score!');
                return;
            }

            const speedrunLeaderboard = JSON.parse(localStorage.getItem('speedrunLeaderboard') || '[]');
            const existingIndex = speedrunLeaderboard.findIndex(entry => entry.username === this.currentUser.username);
            
            if (existingIndex !== -1) {
                // Update existing score if better
                if (this.speedrunTime < speedrunLeaderboard[existingIndex].time) {
                    speedrunLeaderboard[existingIndex] = {
                        username: this.currentUser.username,
                        time: this.speedrunTime,
                        date: new Date().toISOString()
                    };
                }
            } else {
                // Add new score
                speedrunLeaderboard.push({
                    username: this.currentUser.username,
                    time: this.speedrunTime,
                    date: new Date().toISOString()
                });
            }
            
            speedrunLeaderboard.sort((a, b) => a.time - b.time);
            speedrunLeaderboard.splice(10); // Keep only top 10
            localStorage.setItem('speedrunLeaderboard', JSON.stringify(speedrunLeaderboard));
            
            // Show success message
            alert(`Speedrun completed in ${(this.speedrunTime / 1000).toFixed(2)}s!`);
        } else {
            // For classic mode, only allow submission if the game is over
            if (this.gameState !== 'over') {
                alert('You need to complete the game to submit a score!');
                return;
            }

            const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
            const existingIndex = leaderboard.findIndex(entry => entry.username === this.currentUser.username);
            
            if (existingIndex !== -1) {
                // Update existing score if better
                if (this.score > leaderboard[existingIndex].score) {
                    leaderboard[existingIndex] = {
                        username: this.currentUser.username,
                        score: this.score
                    };
                }
            } else {
                // Add new score
                leaderboard.push({
                    username: this.currentUser.username,
                    score: this.score
                });
            }
            
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard.splice(10); // Keep only top 10
            localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        }
        
        this.showLeaderboard();
    }

    displayLeaderboard(mode = this.gameMode) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';

        if (mode === 'speedrun') {
            const speedrunLeaderboard = JSON.parse(localStorage.getItem('speedrunLeaderboard') || '[]');
            if (speedrunLeaderboard.length === 0) {
                leaderboardList.innerHTML = '<div class="no-scores">No speedrun times yet!</div>';
                return;
            }
            speedrunLeaderboard.forEach((entry, index) => {
                const item = document.createElement('div');
                
                if (index < 3) {
                    const medal = document.createElement('span');
                    medal.className = `medal medal-${index + 1}`;
                    medal.textContent = index + 1;
                    item.appendChild(medal);
                } else {
                    const position = document.createElement('span');
                    position.style.width = '25px';
                    position.style.textAlign = 'center';
                    position.textContent = index + 1;
                    item.appendChild(position);
                }

                const name = document.createElement('span');
                name.textContent = entry.username;
                item.appendChild(name);

                const time = document.createElement('span');
                time.className = 'player-score';
                time.textContent = `${(entry.time / 1000).toFixed(2)}s`;
                item.appendChild(time);

                leaderboardList.appendChild(item);
            });
        } else {
            const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
            if (leaderboard.length === 0) {
                leaderboardList.innerHTML = '<div class="no-scores">No scores yet!</div>';
                return;
            }
            leaderboard.forEach((entry, index) => {
                const item = document.createElement('div');
                
                if (index < 3) {
                    const medal = document.createElement('span');
                    medal.className = `medal medal-${index + 1}`;
                    medal.textContent = index + 1;
                    item.appendChild(medal);
                } else {
                    const position = document.createElement('span');
                    position.style.width = '25px';
                    position.style.textAlign = 'center';
                    position.textContent = index + 1;
                    item.appendChild(position);
                }

                const name = document.createElement('span');
                name.textContent = entry.username;
                item.appendChild(name);

                const score = document.createElement('span');
                score.className = 'player-score';
                score.textContent = entry.score;
                item.appendChild(score);

                leaderboardList.appendChild(item);
            });
        }
    }

    drawMenuBackground() {
        if (this.gameState !== 'menu') return;

        const ctx = this.ctx;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw floating particles
        const time = Date.now() * 0.001;
        for (let i = 0; i < 50; i++) {
            const x = Math.sin(time + i * 0.5) * 100 + this.canvas.width / 2;
            const y = Math.cos(time + i * 0.5) * 100 + this.canvas.height / 2;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(76, 175, 80, ${0.3 + Math.sin(time + i) * 0.2})`;
            ctx.fill();
        }

        requestAnimationFrame(() => this.drawMenuBackground());
    }

    displayControls() {
        const controls = document.createElement('div');
        controls.className = 'controls-info';
        controls.innerHTML = `
            <div class="controls-group">
                <div class="control-key">W</div>
                <div class="control-key">A</div>
                <div class="control-key">S</div>
                <div class="control-key">D</div>
            </div>
            <span>or</span>
            <div class="controls-group">
                <div class="control-key">↑</div>
                <div class="control-key">←</div>
                <div class="control-key">↓</div>
                <div class="control-key">→</div>
            </div>
        `;
        return controls;
    }

    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = { username };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateAuthUI();
            this.showMenu();
            alert('Login successful!');
        } else {
            alert('Invalid username or password');
        }
    }

    register() {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (username.length < 4) {
            alert('Username must be at least 4 characters long');
            return;
        }

        if (password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.username === username)) {
            alert('Username already exists');
            return;
        }

        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        this.currentUser = { username };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateAuthUI();
        alert('Registration successful!');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateAuthUI();
        this.showMenu();
        alert('Logged out successfully!');
    }

    updateAuthUI() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const userInfo = document.getElementById('user-info');
        const notLoggedIn = document.getElementById('not-logged-in');
        const loggedIn = document.getElementById('logged-in');
        const submitUsername = document.getElementById('submit-username');
        const loginMenuBtn = document.getElementById('login-menu-btn');

        if (this.currentUser) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            userInfo.style.display = 'block';
            document.getElementById('current-username').textContent = this.currentUser.username;
            submitUsername.textContent = this.currentUser.username;
            notLoggedIn.style.display = 'none';
            loggedIn.style.display = 'block';
            loginMenuBtn.textContent = 'Logout';
            loginMenuBtn.onclick = () => this.logout();
        } else {
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
            userInfo.style.display = 'none';
            notLoggedIn.style.display = 'block';
            loggedIn.style.display = 'none';
            loginMenuBtn.textContent = 'Login';
            loginMenuBtn.onclick = () => this.showLoginScreen();
        }
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 