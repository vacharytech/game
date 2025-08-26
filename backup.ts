// ============================================================================
// GAME ENGINE - Modern Optimized Racing Game
// ============================================================================

// Game Configuration
const GAME_CONFIG = {
    // Canvas & Display
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: window.innerHeight || 600, // Use viewport height
    FPS: 60,
    
    // Game Settings
    GAME_DURATION: 60000, // 60 seconds
    LANES: [100, 200, 300], // Lane positions
    
    // Speed Progression
    BASE_NPC_SPEED: 200,
    SPEED_INCREASE_20S: 1.1, // 10% increase at 20 seconds
    SPEED_INCREASE_40S: 1.2, // 20% increase at 40 seconds
    
    // Player Settings
    PLAYER_WIDTH: 80,
    PLAYER_HEIGHT: 120,
    PLAYER_SPEED: 5,
    LANE_CHANGE_DURATION: 150,
    
    // NPC Settings
    NPC_WIDTH: 85,
    NPC_HEIGHT: 125,
    NPC_SPEED: 200,
    NPC_SPAWN_INTERVAL: 2000, // Increased from 1200ms for more breathing space
    MAX_NPCS: 8, // Reduced from 12 to create more space
    
    // Coin System
    COIN_SIZE: 25,
    COIN_SPAWN_CHANCE: 0.35,
    COIN_SPAWN_INTERVAL: 600,
    MAX_COINS: 20,
    COIN_BURST_PARTICLES: 20,
    
    // Power System
    POWER_PER_COIN: 15,
    MAX_POWER: 120,
    POWER_DECAY_RATE: 1,
    
    // Powerups
    POWERUP_SPAWN_CHANCE: 0.08,
    MAX_POWERUPS: 6,
    SHIELD_DURATION: 8000,
    
    // Hazards
    HAZARD_SPAWN_CHANCE: 0.08,
    MAX_HAZARDS: 8,
    
    // Particles
    MAX_PARTICLES: 150,
    
    // Physics
    GRAVITY: 0.3,
    FRICTION: 0.95,
    COLLISION_MARGIN: 40
};

// Game States
const GAME_STATE = {
    SPLASH: 'splash',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    LEAD_FORM: 'lead_form'
};

// ============================================================================
// GAME CLASSES
// ============================================================================

class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.active = true;
    }
    
    update(dt) {
        this.x += this.velocityX * (dt / 1000);
        this.y += this.velocityY * (dt / 1000);
    }
    
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
    
    collidesWith(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        
        return bounds1.left < bounds2.right &&
               bounds1.right > bounds2.left &&
               bounds1.top < bounds2.bottom &&
               bounds1.bottom > bounds2.top;
    }
}

class Player extends GameObject {
    constructor() {
        super(GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT - 100, 
              GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT);
        
        this.targetLane = 1; // Middle lane
        this.currentLane = 1;
        this.laneChangeProgress = 0;
        this.power = 100;
        this.maxPower = GAME_CONFIG.MAX_POWER;
        this.shieldActive = false;
        this.shieldEndTime = 0;
        this.score = 0;
        // Removed velocityY - player stays in fixed position
    }
    
    update(dt) {
        super.update(dt);
        
        // Lane changing animation
        if (this.laneChangeProgress < 1) {
            this.laneChangeProgress += (dt / GAME_CONFIG.LANE_CHANGE_DURATION);
            if (this.laneChangeProgress >= 1) {
                this.laneChangeProgress = 1;
                this.currentLane = this.targetLane;
            }
        }
        
        // Update position based on lane
        const startX = GAME_CONFIG.LANES[this.currentLane];
        const endX = GAME_CONFIG.LANES[this.targetLane];
        this.x = startX + (endX - startX) * this.laneChangeProgress;
        
        // Keep player at fixed Y position
        this.y = GAME_CONFIG.CANVAS_HEIGHT - 100;
        
        // Power decay
        this.power = Math.max(0, this.power - (GAME_CONFIG.POWER_DECAY_RATE * dt / 1000));
        
        // Shield timeout
        if (this.shieldActive && Date.now() > this.shieldEndTime) {
            this.shieldActive = false;
        }
    }
    
    changeLane(direction) {
        if (this.laneChangeProgress < 1) return;
        
        const newLane = Math.max(0, Math.min(2, this.targetLane + direction));
        if (newLane !== this.targetLane) {
            this.targetLane = newLane;
            this.laneChangeProgress = 0;
        }
    }
    
    activateShield() {
        this.shieldActive = true;
        this.shieldEndTime = Date.now() + GAME_CONFIG.SHIELD_DURATION;
    }
    
    takeDamage(amount) {
        if (!this.shieldActive) {
            this.power = Math.max(0, this.power - amount);
        }
    }
}

class NPC extends GameObject {
    constructor(lane) {
        // Random car type selection
        const carTypes = [
            { type: 'saloon', width: 85, height: 125, color: '#3498db' }, // Blue saloon
            { type: 'suv', width: 95, height: 140, color: '#e74c3c' }, // Red SUV
            { type: 'hatchback', width: 75, height: 110, color: '#2ecc71' }, // Green hatchback
            { type: 'sports', width: 80, height: 120, color: '#f39c12' }, // Orange sports car
            { type: 'truck', width: 100, height: 150, color: '#9b59b6' }, // Purple truck
            { type: 'compact', width: 70, height: 100, color: '#1abc9c' } // Teal compact
        ];
        
        const selectedCar = carTypes[Math.floor(Math.random() * carTypes.length)];
        
        super(GAME_CONFIG.LANES[lane], -100, selectedCar.width, selectedCar.height);
        this.velocityY = GAME_CONFIG.NPC_SPEED + (Math.random() - 0.5) * 50; // Vary speed
        this.lane = lane;
        this.wobbleOffset = Math.random() * Math.PI * 2; // Random wobble phase
        this.wobbleSpeed = 0.02 + Math.random() * 0.03; // Random wobble speed
        this.originalX = GAME_CONFIG.LANES[lane];
        
        // Car type properties
        this.carType = selectedCar.type;
        this.carColor = selectedCar.color;
        this.carWidth = selectedCar.width;
        this.carHeight = selectedCar.height;
        
        // Forward movement properties (reduced frequency)
        this.forwardMovement = Math.random() > 0.9; // 10% chance to have forward movement (was 20%)
        this.forwardSpeed = 15 + Math.random() * 25; // Reduced speed range (was 20-60)
        this.forwardDirection = Math.random() > 0.5 ? 1 : -1; // Random direction
        this.forwardTimer = 0;
        this.forwardDuration = 1500 + Math.random() * 2000; // Shorter duration (was 2000-5000)
        
        // Lane changing properties (reduced frequency)
        this.laneChangeTimer = 0;
        this.laneChangeInterval = 8000 + Math.random() * 12000; // Much longer intervals (was 5000-13000)
        this.targetLane = lane;
        this.laneChangeProgress = 0;
        this.laneChangeSpeed = 0.002 + Math.random() * 0.003; // Slower lane changes (was 0.003-0.008)
        
        // Physics properties for avoidance
        this.avoidanceDirection = Math.random() > 0.5 ? 1 : -1; // Random left or right
        this.avoidanceSpeed = 0;
        this.maxAvoidanceSpeed = 100; // Pixels per second
        this.avoidanceDistance = 150; // Distance to start avoiding
        this.isAvoiding = false;
        this.avoidanceOffset = 0; // Current offset from original position
    }
    
    update(dt, player) {
        super.update(dt);
        
        // Update forward movement
        this.updateForwardMovement(dt);
        
        // Update lane changing
        this.updateLaneChanging(dt);
        
        if (player) {
            // Check distance to player for avoidance
            const distanceToPlayer = Math.abs(this.y - player.y);
            const horizontalDistance = Math.abs(this.x - player.x);
            
            // Start avoidance when player is approaching from behind
            if (distanceToPlayer < this.avoidanceDistance && horizontalDistance < 80) {
                this.isAvoiding = true;
                
                // Calculate avoidance force (stronger when closer)
                const avoidanceForce = Math.max(0, (this.avoidanceDistance - distanceToPlayer) / this.avoidanceDistance);
                this.avoidanceSpeed = this.maxAvoidanceSpeed * avoidanceForce;
                
                // Determine which direction to move (away from player)
                if (player.x < this.x) {
                    this.avoidanceDirection = 1; // Move right
                } else {
                    this.avoidanceDirection = -1; // Move left
                }
                
                // Apply avoidance movement
                this.avoidanceOffset += this.avoidanceDirection * this.avoidanceSpeed * (dt / 1000);
                
                // Limit how far NPC can move from original position
                this.avoidanceOffset = Math.max(-60, Math.min(60, this.avoidanceOffset));
                
            } else {
                // Return to original position when not avoiding
                this.isAvoiding = false;
                this.avoidanceOffset *= 0.9; // Gradual return to center
            }
        }
        
        // Apply movement: wobble + avoidance + lane change
        const wobble = Math.sin(this.wobbleOffset) * 3;
        const laneChangeOffset = this.getLaneChangeOffset();
        this.x = this.originalX + wobble + this.avoidanceOffset + laneChangeOffset;
        this.wobbleOffset += this.wobbleSpeed * (dt / 16.67);
        
        // Remove if off screen
        if (this.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
            this.active = false;
        }
    }
    
    updateForwardMovement(dt) {
        if (this.forwardMovement) {
            this.forwardTimer += dt;
            
            if (this.forwardTimer > this.forwardDuration) {
                // Reset forward movement
                this.forwardMovement = Math.random() > 0.9;
                this.forwardTimer = 0;
                this.forwardDuration = 1500 + Math.random() * 2000;
                this.forwardDirection = Math.random() > 0.5 ? 1 : -1;
            }
        }
    }
    
    updateLaneChanging(dt) {
        this.laneChangeTimer += dt;
        
        if (this.laneChangeTimer > this.laneChangeInterval) {
            // Start lane change
            const availableLanes = [0, 1, 2].filter(l => l !== this.lane);
            if (availableLanes.length > 0) {
                this.targetLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
                this.laneChangeProgress = 0;
                this.laneChangeTimer = 0;
                this.laneChangeInterval = 8000 + Math.random() * 12000;
            }
        }
        
        // Update lane change progress
        if (this.laneChangeProgress < 1) {
            this.laneChangeProgress += this.laneChangeSpeed * (dt / 16.67);
            if (this.laneChangeProgress >= 1) {
                this.laneChangeProgress = 1;
                this.lane = this.targetLane;
                this.originalX = GAME_CONFIG.LANES[this.lane];
            }
        }
    }
    
    getLaneChangeOffset() {
        if (this.laneChangeProgress < 1) {
            const startX = GAME_CONFIG.LANES[this.lane];
            const endX = GAME_CONFIG.LANES[this.targetLane];
            return (endX - startX) * this.laneChangeProgress;
        }
        return 0;
    }
}

class Coin extends GameObject {
    constructor(lane) {
        super(GAME_CONFIG.LANES[lane], -50, GAME_CONFIG.COIN_SIZE, GAME_CONFIG.COIN_SIZE);
        this.velocityY = GAME_CONFIG.NPC_SPEED + (Math.random() - 0.5) * 30; // Vary speed
        this.lane = lane;
        this.collected = false;
        this.collectTime = 0;
        this.bobOffset = Math.random() * Math.PI * 2; // Random bob phase
        this.bobSpeed = 0.03 + Math.random() * 0.02; // Random bob speed
        this.originalX = GAME_CONFIG.LANES[lane];
    }
    
    update(dt) {
        super.update(dt);
        
        // Add subtle horizontal bobbing
        const bob = Math.sin(this.bobOffset) * 2;
        this.x = this.originalX + bob;
        this.bobOffset += this.bobSpeed * (dt / 16.67);
        
        // Remove if off screen
        if (this.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
            this.active = false;
        }
        
        // Reset collection state
        if (this.collected && Date.now() > this.collectTime) {
            this.collected = false;
        }
    }
    
    collect() {
        if (!this.collected) {
            this.collected = true;
            this.active = false; // Make coin disappear immediately
            return true;
        }
        return false;
    }
}

class Powerup extends GameObject {
    constructor(lane) {
        super(GAME_CONFIG.LANES[lane], -50, 30, 30);
        this.velocityY = GAME_CONFIG.NPC_SPEED;
        this.lane = lane;
        this.type = 'shield';
        this.collected = false;
    }
    
    update(dt) {
        super.update(dt);
        
        // Remove if off screen
        if (this.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
            this.active = false;
        }
    }
}

class Hazard extends GameObject {
    constructor(lane, type) {
        super(GAME_CONFIG.LANES[lane], -50, 30, 24);
        this.velocityY = GAME_CONFIG.NPC_SPEED;
        this.lane = lane;
        this.type = type;
        this.blinkState = 0;
    }
    
    update(dt) {
        super.update(dt);
        
        // Remove if off screen
        if (this.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
            this.active = false;
        }
        
        // Update blink state for hazard lights
        if (this.type === 'hazard_light') {
            this.blinkState = (this.blinkState + 1) % 60;
        }
    }
}

class Particle {
    constructor(x, y, velocityX, velocityY, life, color, size) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.active = true;
    }
    
    update(dt) {
        this.x += this.velocityX * (dt / 1000);
        this.y += this.velocityY * (dt / 1000);
        this.velocityY += GAME_CONFIG.GRAVITY * (dt / 1000);
        this.life -= dt;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    getAlpha() {
        return this.life / this.maxLife;
    }
}

// ============================================================================
// GAME MANAGER
// ============================================================================

class GameManager {
    constructor() {
        console.log('GameManager: Initializing...');
        this.canvas = document.getElementById('game');
        if (!this.canvas) {
            console.error('GameManager: Canvas element not found!');
            return;
        }
        console.log('GameManager: Canvas found, setting up context...');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = GAME_STATE.SPLASH;
        this.isGameLoopRunning = false;
        
        // Game objects
        this.player = new Player();
        this.npcs = [];
        this.coins = [];
        this.powerups = [];
        this.hazards = [];
        this.particles = [];
        
        // Game timing
        this.gameTime = GAME_CONFIG.GAME_DURATION;
        this.lastSpawnTime = 0;
        this.lastCoinSpawnTime = 0;
        this.lastPowerupSpawnTime = 0;
        this.lastHazardSpawnTime = 0;
        
        // Effects
        this.burstStreak = 0;
        this.lastBurstTime = 0;
        
        // Road animation
        this.roadOffset = 0;
        this.roadSpeed = 8; // Reduced speed for smoother animation
        
        // Speed progression
        this.currentSpeedMultiplier = 1.0;
        this.speedIncreaseApplied20s = false;
        this.speedIncreaseApplied40s = false;
        
        // Image assets
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 0;
        
        // Input
        this.keys = {};
        this.touchStartX = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragOffsetX = 0;
        
        this.setupCanvas();
        this.loadImages();
        this.setupEventListeners();
        this.setupAudio();
        console.log('GameManager: Initialization complete!');
    }
    
    setupCanvas() {
        // Update canvas height to viewport height
        GAME_CONFIG.CANVAS_HEIGHT = window.innerHeight || 600;
        
        this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('Canvas setup complete');
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = window.innerHeight || container.clientHeight;
        
        // Update canvas height to viewport height
        GAME_CONFIG.CANVAS_HEIGHT = containerHeight;
        this.canvas.height = containerHeight;
        
        const scale = Math.min(containerWidth / GAME_CONFIG.CANVAS_WIDTH, 
                              containerHeight / GAME_CONFIG.CANVAS_HEIGHT);
        
        this.canvas.style.width = `${GAME_CONFIG.CANVAS_WIDTH * scale}px`;
        this.canvas.style.height = `${GAME_CONFIG.CANVAS_HEIGHT * scale}px`;
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch controls with drag capability and tap-to-move
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.dragOffsetX = 0;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging && this.gameState === GAME_STATE.PLAYING) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - this.dragStartX;
                const deltaY = touch.clientY - this.dragStartY;
                
                // Only respond to horizontal drag (ignore vertical)
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.dragOffsetX = deltaX;
                    
                    // Calculate target position based on drag
                    const dragSensitivity = 0.5; // Adjust for responsiveness
                    const targetX = this.player.x + (deltaX * dragSensitivity);
                    
                    // Convert position to lane
                    const lanePositions = GAME_CONFIG.LANES;
                    let targetLane = this.player.currentLane;
                    
                    // Find closest lane
                    let minDistance = Infinity;
                    for (let i = 0; i < lanePositions.length; i++) {
                        const distance = Math.abs(targetX - lanePositions[i]);
                        if (distance < minDistance) {
                            minDistance = distance;
                            targetLane = i;
                        }
                    }
                    
                    // Change lane if different
                    if (targetLane !== this.player.targetLane) {
                        this.player.changeLane(targetLane - this.player.targetLane);
                    }
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Check if it was a tap (minimal movement)
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.dragStartX;
            const deltaY = touchEndY - this.dragStartY;
            const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // If minimal movement, treat as tap and move car to tap position
            if (totalMovement < 20 && this.gameState === GAME_STATE.PLAYING) {
                const canvasRect = this.canvas.getBoundingClientRect();
                const tapX = touchEndX - canvasRect.left;
                const canvasScaleX = this.canvas.width / canvasRect.width;
                const gameX = tapX * canvasScaleX;
                
                // Convert tap position to lane
                const lanePositions = GAME_CONFIG.LANES;
                let targetLane = this.player.currentLane;
                let minDistance = Infinity;
                
                for (let i = 0; i < lanePositions.length; i++) {
                    const distance = Math.abs(gameX - lanePositions[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        targetLane = i;
                    }
                }
                
                // Change lane if different
                if (targetLane !== this.player.targetLane) {
                    this.player.changeLane(targetLane - this.player.targetLane);
                }
            }
            
            this.isDragging = false;
            this.dragOffsetX = 0;
        });
        
        // Mouse controls for desktop drag
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragOffsetX = 0;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.gameState === GAME_STATE.PLAYING) {
                const deltaX = e.clientX - this.dragStartX;
                const deltaY = e.clientY - this.dragStartY;
                
                // Only respond to horizontal drag (ignore vertical)
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.dragOffsetX = deltaX;
                    
                    // Calculate target position based on drag
                    const dragSensitivity = 0.5; // Adjust for responsiveness
                    const targetX = this.player.x + (deltaX * dragSensitivity);
                    
                    // Convert position to lane
                    const lanePositions = GAME_CONFIG.LANES;
                    let targetLane = this.player.currentLane;
                    
                    // Find closest lane
                    let minDistance = Infinity;
                    for (let i = 0; i < lanePositions.length; i++) {
                        const distance = Math.abs(targetX - lanePositions[i]);
                        if (distance < minDistance) {
                            minDistance = distance;
                            targetLane = i;
                        }
                    }
                    
                    // Change lane if different
                    if (targetLane !== this.player.targetLane) {
                        this.player.changeLane(targetLane - this.player.targetLane);
                    }
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.isDragging = false;
            this.dragOffsetX = 0;
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupAudio() {
        // Audio context for sound effects
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    loadImages() {
        // ============================================================================
        // CUSTOM IMAGE CONFIGURATION
        // ============================================================================
        // To replace images with your own:
        // 1. Place your images in the 'assets' folder
        // 2. Update the paths below to match your image filenames
        // 3. Supported formats: .png, .jpg, .jpeg, .svg, .webp
        // 4. Recommended sizes: 80x120px for cars, 25x25px for coins/powerups
        
        const imageList = {
            // Player car image (your main car)
            playerCar: 'assets/player-car.svg',
            
            // NPC car images (opponent cars) - you can add multiple for variety
            npcCar: 'assets/npc-car.svg',
            npcCar2: 'assets/npc-car-2.svg', // Optional: additional NPC car
            npcCar3: 'assets/npc-car-3.svg', // Optional: additional NPC car
            
            // Collectible items
            coin: 'assets/coin.svg',
            powerup: 'assets/powerup.svg',
            
            // Hazard/obstacle images
            hazardLight: 'assets/hazard-light.svg',
            roadWork: 'assets/road-work.svg',
            camelCrossing: 'assets/camel-crossing.svg'
        };
        
        // ============================================================================
        // IMAGE LOADING SYSTEM
        // ============================================================================
        this.totalImages = Object.keys(imageList).length;
        
        Object.entries(imageList).forEach(([key, src]) => {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                console.log(`✅ Loaded image: ${key} (${src})`);
                if (this.imagesLoaded === this.totalImages) {
                    console.log('🎉 All images loaded successfully!');
                }
            };
            img.onerror = () => {
                console.warn(`❌ Failed to load image: ${src} - using fallback shapes`);
                this.imagesLoaded++;
            };
            img.src = src;
            this.images[key] = img;
        });
        
        // ============================================================================
        // IMAGE REPLACEMENT INSTRUCTIONS
        // ============================================================================
        console.log(`
🎨 IMAGE REPLACEMENT GUIDE:
==========================
1. PLACE YOUR IMAGES:
   - Put your images in the 'assets' folder
   - Supported formats: .png, .jpg, .jpeg, .svg, .webp

2. RECOMMENDED SIZES:
   - Player Car: 80x120px
   - NPC Cars: 85x125px (various sizes)
   - Coins: 25x25px
   - Powerups: 30x30px
   - Hazards: 30x24px

3. UPDATE PATHS:
   - Change the paths above to match your filenames
   - Example: 'assets/my-car.png'

4. TEST YOUR IMAGES:
   - Check browser console for loading status
   - Fallback shapes will show if images fail to load
        `);
    }
    
    // ============================================================================
    // GAME LOGIC
    // ============================================================================
    
    startGame() {
        console.log('GameManager: Starting game...');
        this.gameState = GAME_STATE.LOADING;
        this.showLoadingScreen();
        
        setTimeout(() => {
            console.log('GameManager: Loading complete, starting game loop...');
            this.gameState = GAME_STATE.PLAYING;
            this.hideAllScreens();
            this.showFloatingScore();
            this.resetGame();
            this.startGameLoop();
        }, 500); // Reduced from 2000ms to 500ms for faster loading
    }
    
    resetGame() {
        this.player = new Player();
        this.npcs = [];
        this.coins = [];
        this.powerups = [];
        this.hazards = [];
        this.particles = [];
        this.gameTime = GAME_CONFIG.GAME_DURATION;
        this.lastSpawnTime = 0;
        this.lastCoinSpawnTime = 0;
        this.lastPowerupSpawnTime = 0;
        this.lastHazardSpawnTime = 0;
        this.burstStreak = 0;
        this.lastBurstTime = 0;
        this.roadOffset = 0;
        
        // Reset speed progression
        this.currentSpeedMultiplier = 1.0;
        this.speedIncreaseApplied20s = false;
        this.speedIncreaseApplied40s = false;
    }
    
    startGameLoop() {
        if (this.isGameLoopRunning) return;
        
        this.isGameLoopRunning = true;
        let lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.isGameLoopRunning) return;
            
            const dt = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update(dt);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    stopGameLoop() {
        this.isGameLoopRunning = false;
    }
    
    update(dt) {
        if (this.gameState !== GAME_STATE.PLAYING) return;
        
        // Update game time
        this.gameTime -= dt;
        if (this.gameTime <= 0) {
            this.endGame();
            return;
        }
        
        // Speed progression logic
        this.updateSpeedProgression();
        
        // Update road animation - move upward for forward motion
        this.roadOffset -= this.roadSpeed * (dt / 16.67); // Negative for upward movement
        if (this.roadOffset < 0) {
            this.roadOffset = 40; // Reset to pattern length
        }
        
        // Handle input
        this.handleInput();
        
        // Update player
        this.player.update(dt);
        
        // Spawn objects
        this.spawnObjects(dt);
        
        // Update objects
        this.updateObjects(dt);
        
        // Check collisions
        this.checkCollisions();
        
        // Update particles
        this.updateParticles(dt);
    }
    
    updateSpeedProgression() {
        const timeElapsed = (GAME_CONFIG.GAME_DURATION - this.gameTime) / 1000; // Convert to seconds
        
        // Speed increase at 20 seconds (10% increase)
        if (timeElapsed >= 20 && !this.speedIncreaseApplied20s) {
            this.currentSpeedMultiplier = GAME_CONFIG.SPEED_INCREASE_20S;
            this.speedIncreaseApplied20s = true;
            console.log('Speed increased by 10% at 20 seconds');
        }
        
        // Speed increase at 40 seconds (20% increase)
        if (timeElapsed >= 40 && !this.speedIncreaseApplied40s) {
            this.currentSpeedMultiplier = GAME_CONFIG.SPEED_INCREASE_40S;
            this.speedIncreaseApplied40s = true;
            console.log('Speed increased by 20% at 40 seconds');
        }
    }
    
    handleInput() {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.changeLane(-1);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.changeLane(1);
        }
    }
    
    spawnObjects(dt) {
        const currentTime = Date.now();
        
        // Spawn NPCs - with breathing space between cars
        if (currentTime - this.lastSpawnTime > GAME_CONFIG.NPC_SPAWN_INTERVAL && 
            this.npcs.length < GAME_CONFIG.MAX_NPCS) {
            
            // Check minimum distance from existing NPCs
            const minDistance = 200; // Minimum pixels between NPCs
            const proposedLane = Math.floor(Math.random() * GAME_CONFIG.LANES.length);
            const proposedY = -100; // Spawn position
            
            // Check if there's enough space
            let hasSpace = true;
            let npcsInLane = 0;
            
            for (const existingNpc of this.npcs) {
                const distance = Math.abs(existingNpc.y - proposedY);
                if (distance < minDistance) {
                    hasSpace = false;
                    break;
                }
                
                // Count NPCs in the same lane
                if (Math.abs(existingNpc.x - GAME_CONFIG.LANES[proposedLane]) < 50) {
                    npcsInLane++;
                }
            }
            
            // Only spawn if there's enough space and not too many cars in the lane
            if (hasSpace && npcsInLane < 2) { // Max 2 cars per lane
                const npc = new NPC(proposedLane);
                // Apply speed multiplier to NPC
                npc.velocityY *= this.currentSpeedMultiplier;
                this.npcs.push(npc);
                this.lastSpawnTime = currentTime;
            }
        }
        
        // Spawn coins - faster initial spawn
        if (currentTime - this.lastCoinSpawnTime > GAME_CONFIG.COIN_SPAWN_INTERVAL && 
            this.coins.length < GAME_CONFIG.MAX_COINS &&
            Math.random() < GAME_CONFIG.COIN_SPAWN_CHANCE) {
            const lane = Math.floor(Math.random() * GAME_CONFIG.LANES.length);
            const coin = new Coin(lane);
            // Apply speed multiplier to coin
            coin.velocityY *= this.currentSpeedMultiplier;
            this.coins.push(coin);
            this.lastCoinSpawnTime = currentTime;
        }
        
        // Spawn powerups - faster initial spawn
        if (currentTime - this.lastPowerupSpawnTime > 1000 && // Reduced from 2000ms
            this.powerups.length < GAME_CONFIG.MAX_POWERUPS &&
            Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE) {
            const lane = Math.floor(Math.random() * GAME_CONFIG.LANES.length);
            const powerup = new Powerup(lane);
            // Apply speed multiplier to powerup
            powerup.velocityY *= this.currentSpeedMultiplier;
            this.powerups.push(powerup);
            this.lastPowerupSpawnTime = currentTime;
        }
        
        // Spawn hazards - faster initial spawn
        if (currentTime - this.lastHazardSpawnTime > 1500 && // Reduced from 3000ms
            this.hazards.length < GAME_CONFIG.MAX_HAZARDS &&
            Math.random() < GAME_CONFIG.HAZARD_SPAWN_CHANCE) {
            const lane = Math.floor(Math.random() * GAME_CONFIG.LANES.length);
            const types = ['hazard_light', 'road_work', 'camel_crossing'];
            const type = types[Math.floor(Math.random() * types.length)];
            const hazard = new Hazard(lane, type);
            // Apply speed multiplier to hazard
            hazard.velocityY *= this.currentSpeedMultiplier;
            this.hazards.push(hazard);
            this.lastHazardSpawnTime = currentTime;
        }
    }
    
    updateObjects(dt) {
        // Update NPCs with player reference for physics
        this.npcs.forEach(npc => npc.update(dt, this.player));
        this.npcs = this.npcs.filter(npc => npc.active);
        
        // Update coins
        this.coins.forEach(coin => coin.update(dt));
        this.coins = this.coins.filter(coin => coin.active);
        
        // Update powerups
        this.powerups.forEach(powerup => powerup.update(dt));
        this.powerups = this.powerups.filter(powerup => powerup.active);
        
        // Update hazards
        this.hazards.forEach(hazard => hazard.update(dt));
        this.hazards = this.hazards.filter(hazard => hazard.active);
    }
    
    checkCollisions() {
        // Coin collisions
        this.coins.forEach(coin => {
            if (this.player.collidesWith(coin) && coin.collect()) {
                this.createCoinBurst(coin.x, coin.y);
                this.player.score += 10;
                this.playSound(800, 0.1);
                
                // Show points snackbar
                this.showPointsSnackbar(10);
                
                // Burst streak
                const now = Date.now();
                if (now - this.lastBurstTime < 500) {
                    this.burstStreak++;
                } else {
                    this.burstStreak = 1;
                }
                this.lastBurstTime = now;
            }
        });
        
        // Powerup collisions
        this.powerups.forEach(powerup => {
            if (this.player.collidesWith(powerup)) {
                if (powerup.type === 'shield') {
                    this.player.activateShield();
                }
                this.createExplosion(powerup.x, powerup.y);
                this.playSound(600, 0.2);
                this.showPointsSnackbar(25); // Show points for powerup
                powerup.active = false;
            }
        });
        
        // NPC collisions - don't remove NPCs, just apply damage and effects
        this.npcs.forEach(npc => {
            if (this.player.collidesWith(npc)) {
                this.player.takeDamage(10);
                this.createExplosion(npc.x, npc.y);
                this.playSound(200, 0.3);
                
                // Show narrow escape snackbar
                this.showNarrowEscapeSnackbar();
                
                // DON'T remove the NPC: npc.active = false; 
                // Instead, make NPC move away more aggressively
                npc.avoidanceOffset += npc.avoidanceDirection * 30;
                npc.avoidanceOffset = Math.max(-80, Math.min(80, npc.avoidanceOffset));
                
                if (this.player.power <= 0) {
                    this.endGame();
                }
            }
        });
        
        // Hazard collisions
        this.hazards.forEach(hazard => {
            if (this.player.collidesWith(hazard)) {
                this.player.takeDamage(15);
                this.createExplosion(hazard.x, hazard.y);
                this.playSound(150, 0.4);
                
                // Show narrow escape snackbar
                this.showNarrowEscapeSnackbar();
                
                hazard.active = false;
                
                if (this.player.power <= 0) {
                    this.endGame();
                }
            }
        });
    }
    
    updateParticles(dt) {
        this.particles.forEach(particle => particle.update(dt));
        this.particles = this.particles.filter(particle => particle.active);
    }
    
    createCoinBurst(x, y) {
        const colors = ['#0066cc', '#4ecdc4', '#ffffff', '#ffd700', '#ff6b35'];
        
        for (let i = 0; i < GAME_CONFIG.COIN_BURST_PARTICLES; i++) {
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.COIN_BURST_PARTICLES;
            const speed = 12 + Math.random() * 8;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed - 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 4 + 2;
            
            this.particles.push(new Particle(x, y, velocityX, velocityY, 1200, color, size));
        }
    }
    
    createExplosion(x, y) {
        const colors = ['#ff6b35', '#ffd700', '#ffffff', '#ff4757'];
        
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 12;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 6 + 3;
            
            this.particles.push(new Particle(x, y, velocityX, velocityY, 800, color, size));
        }
    }
    
    endGame() {
        this.gameState = GAME_STATE.GAME_OVER;
        this.stopGameLoop();
        this.hideFloatingScore();
        this.showGameOverScreen();
    }
    
    // ============================================================================
    // RENDERING
    // ============================================================================
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw road
        this.drawRoad();
        
        // Draw game objects
        this.drawObjects();
        
        // Draw particles
        this.drawParticles();
        
        // Draw UI
        this.drawUI();
    }
    
    drawRoad() {
        // Clean dark asphalt road background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Moving yellow dashed center line
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([20, 20]);
        this.ctx.lineDashOffset = this.roadOffset;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        
        // Moving white double edge lines
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]); // Solid lines for edges
        this.ctx.beginPath();
        
        // Left edge - double white lines
        this.ctx.moveTo(80, 0);
        this.ctx.lineTo(80, this.canvas.height);
        this.ctx.moveTo(85, 0);
        this.ctx.lineTo(85, this.canvas.height);
        
        // Right edge - double white lines
        this.ctx.moveTo(this.canvas.width - 80, 0);
        this.ctx.lineTo(this.canvas.width - 80, this.canvas.height);
        this.ctx.moveTo(this.canvas.width - 85, 0);
        this.ctx.lineTo(this.canvas.width - 85, this.canvas.height);
        
        this.ctx.stroke();
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    drawPalmTrees() {
        // Palm tree colors
        const palmColors = ['#228B22', '#32CD32', '#006400', '#228B22'];
        
        // Calculate movement offset for roadside elements
        const movementOffset = (this.roadOffset * 0.3) % 40;
        
        // Left side palm trees with movement
        this.drawPalmTree(20 + movementOffset * 0.1, 80, palmColors[0]);
        this.drawPalmTree(15 + movementOffset * 0.15, 200, palmColors[1]);
        this.drawPalmTree(25 + movementOffset * 0.05, 350, palmColors[2]);
        this.drawPalmTree(10 + movementOffset * 0.2, 500, palmColors[3]);
        
        // Right side palm trees with movement
        this.drawPalmTree(this.canvas.width - 20 - movementOffset * 0.1, 60, palmColors[1]);
        this.drawPalmTree(this.canvas.width - 15 - movementOffset * 0.15, 180, palmColors[2]);
        this.drawPalmTree(this.canvas.width - 25 - movementOffset * 0.05, 320, palmColors[0]);
        this.drawPalmTree(this.canvas.width - 10 - movementOffset * 0.2, 480, palmColors[3]);
        
        // Dense bush on right side with movement
        this.drawBush(this.canvas.width - 30 - movementOffset * 0.1, 280);
    }
    
    drawPalmTree(x, y, color) {
        this.ctx.save();
        
        // Palm tree trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 2, y, 4, 40);
        
        // Palm fronds
        this.ctx.fillStyle = color;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const frondLength = 25 + Math.random() * 10;
            const frondWidth = 3 + Math.random() * 2;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(angle);
            
            // Frond shape
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(frondWidth, -frondLength/2, 0, -frondLength);
            this.ctx.quadraticCurveTo(-frondWidth, -frondLength/2, 0, 0);
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawBush(x, y) {
        this.ctx.save();
        
        // Bush base
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bush details
        this.ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 10;
            const size = 3 + Math.random() * 4;
            
            this.ctx.beginPath();
            this.ctx.arc(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawTrafficCones() {
        this.ctx.save();
        
        // Traffic cone color
        this.ctx.fillStyle = '#FF6B35';
        
        // Left side traffic cones
        this.drawTrafficCone(30, 50);
        this.drawTrafficCone(35, 70);
        
        this.ctx.restore();
    }
    
    drawTrafficCone(x, y) {
        this.ctx.save();
        
        // Cone base
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cone top
        this.ctx.beginPath();
        this.ctx.arc(x, y - 12, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cone middle
        this.ctx.beginPath();
        this.ctx.arc(x, y - 6, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // White stripes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x - 6, y - 8, 12, 2);
        this.ctx.fillRect(x - 4, y - 2, 8, 2);
        
        this.ctx.restore();
    }
    
    drawObjects() {
        // Draw NPCs
        this.npcs.forEach(npc => this.drawNPC(npc));
        
        // Draw coins
        this.coins.forEach(coin => this.drawCoin(coin));
        
        // Draw powerups
        this.powerups.forEach(powerup => this.drawPowerup(powerup));
        
        // Draw hazards
        this.hazards.forEach(hazard => this.drawHazard(hazard));
        
        // Draw player
        this.drawPlayer();
    }
    
    drawPlayer() {
        this.ctx.save();
        
        // Shield effect only (removed drag indicator circle)
        if (this.player.shieldActive) {
            this.ctx.strokeStyle = '#4ecdc4';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.width / 2 + 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw player car image
        if (this.images.playerCar && this.images.playerCar.complete) {
            this.ctx.drawImage(
                this.images.playerCar,
                this.player.x - this.player.width / 2,
                this.player.y - this.player.height / 2,
                this.player.width,
                this.player.height
            );
        } else {
            // Fallback to geometric shape if image not loaded
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillRect(this.player.x - this.player.width / 2, 
                             this.player.y - this.player.height / 2,
                             this.player.width, this.player.height);
            
            // Car details
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(this.player.x - this.player.width / 2 + 5,
                             this.player.y - this.player.height / 2 + 5,
                             this.player.width - 10, 20);
        }
        
        this.ctx.restore();
    }
    
    drawNPC(npc) {
        this.ctx.save();
        
        // Draw NPC car based on type
        this.drawCarByType(npc);
        
        this.ctx.restore();
    }
    
    drawCarByType(npc) {
        const x = npc.x;
        const y = npc.y;
        const width = npc.width;
        const height = npc.height;
        const color = npc.carColor;
        
        switch (npc.carType) {
            case 'suv':
                this.drawSUV(x, y, width, height, color);
                break;
            case 'saloon':
                this.drawSaloon(x, y, width, height, color);
                break;
            case 'hatchback':
                this.drawHatchback(x, y, width, height, color);
                break;
            case 'sports':
                this.drawSportsCar(x, y, width, height, color);
                break;
            case 'truck':
                this.drawTruck(x, y, width, height, color);
                break;
            case 'compact':
                this.drawCompact(x, y, width, height, color);
                break;
            default:
                this.drawSaloon(x, y, width, height, color);
        }
    }
    
    drawSUV(x, y, width, height, color) {
        // SUV body (taller and wider)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // SUV roof (slightly smaller)
        this.ctx.fillStyle = this.darkenColor(color, 0.2);
        this.ctx.fillRect(x - width/2 + 5, y - height/2 + 5, width - 10, height * 0.6);
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - width/2 + 8, y - height/2 + 8, width - 16, height * 0.4);
        
        // Wheels
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2 + 5, y + height/2 - 8, 12, 8);
        this.ctx.fillRect(x + width/2 - 17, y + height/2 - 8, 12, 8);
    }
    
    drawSaloon(x, y, width, height, color) {
        // Saloon body
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Saloon roof
        this.ctx.fillStyle = this.darkenColor(color, 0.3);
        this.ctx.fillRect(x - width/2 + 3, y - height/2 + 3, width - 6, height * 0.5);
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - width/2 + 5, y - height/2 + 5, width - 10, height * 0.3);
        
        // Wheels
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2 + 3, y + height/2 - 6, 10, 6);
        this.ctx.fillRect(x + width/2 - 13, y + height/2 - 6, 10, 6);
    }
    
    drawHatchback(x, y, width, height, color) {
        // Hatchback body (shorter and more compact)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Hatchback roof (angled)
        this.ctx.fillStyle = this.darkenColor(color, 0.2);
        this.ctx.beginPath();
        this.ctx.moveTo(x - width/2 + 5, y - height/2 + 5);
        this.ctx.lineTo(x + width/2 - 5, y - height/2 + 5);
        this.ctx.lineTo(x + width/2 - 8, y - height/2 + height * 0.4);
        this.ctx.lineTo(x - width/2 + 8, y - height/2 + height * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - width/2 + 6, y - height/2 + 6, width - 12, height * 0.25);
        
        // Wheels
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2 + 2, y + height/2 - 5, 8, 5);
        this.ctx.fillRect(x + width/2 - 10, y + height/2 - 5, 8, 5);
    }
    
    drawSportsCar(x, y, width, height, color) {
        // Sports car body (lower and sleeker)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width/2, y - height/2 + 5, width, height - 10);
        
        // Sports car roof (low profile)
        this.ctx.fillStyle = this.darkenColor(color, 0.4);
        this.ctx.fillRect(x - width/2 + 2, y - height/2 + 8, width - 4, height * 0.3);
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - width/2 + 4, y - height/2 + 10, width - 8, height * 0.2);
        
        // Wheels (larger for sports car)
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2 + 2, y + height/2 - 8, 12, 8);
        this.ctx.fillRect(x + width/2 - 14, y + height/2 - 8, 12, 8);
    }
    
    drawTruck(x, y, width, height, color) {
        // Truck body (tall and wide)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Truck cabin
        this.ctx.fillStyle = this.darkenColor(color, 0.3);
        this.ctx.fillRect(x - width/2 + 5, y - height/2 + 5, width * 0.4, height * 0.6);
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - width/2 + 7, y - height/2 + 7, width * 0.35, height * 0.4);
        
        // Wheels (multiple for truck)
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2 + 3, y + height/2 - 10, 15, 10);
        this.ctx.fillRect(x + width/2 - 18, y + height/2 - 10, 15, 10);
    }
    
    drawCompact(x, y, width, height, color) {
        // Compact car body (small and round)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Compact roof (rounded)
        this.ctx.fillStyle = this.darkenColor(color, 0.2);
        this.ctx.fillRect(x - width/2 + 2, y - height/2 + 2, width - 4, height * 0.6);
        
        // Windows
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - width/2 + 4, y - height/2 + 4, width - 8, height * 0.4);
        
        // Wheels (smaller)
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2 + 1, y + height/2 - 4, 6, 4);
        this.ctx.fillRect(x + width/2 - 7, y + height/2 - 4, 6, 4);
    }
    
    darkenColor(color, factor) {
        // Simple color darkening for car details
        const colors = {
            '#3498db': '#2980b9', // Blue
            '#e74c3c': '#c0392b', // Red
            '#2ecc71': '#27ae60', // Green
            '#f39c12': '#e67e22', // Orange
            '#9b59b6': '#8e44ad', // Purple
            '#1abc9c': '#16a085'  // Teal
        };
        return colors[color] || color;
    }
    
    drawCoin(coin) {
        this.ctx.save();
        
        // Draw coin image
        if (this.images.coin && this.images.coin.complete) {
            this.ctx.drawImage(
                this.images.coin,
                coin.x - coin.width / 2,
                coin.y - coin.height / 2,
                coin.width,
                coin.height
            );
        } else {
            // Fallback to geometric shape if image not loaded
            this.ctx.fillStyle = '#0066cc';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(coin.x, coin.y, coin.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Coin symbol
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('S', coin.x, coin.y);
        }
        
        this.ctx.restore();
    }
    
    drawPowerup(powerup) {
        this.ctx.save();
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(powerup.x - powerup.width / 2, powerup.y - powerup.height / 2,
                     powerup.width, powerup.height);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Powerup symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('S', powerup.x, powerup.y);
        this.ctx.restore();
    }
    
    drawHazard(hazard) {
        this.ctx.save();
        
        let imageKey = null;
        switch (hazard.type) {
            case 'hazard_light':
                imageKey = 'hazardLight';
                break;
            case 'road_work':
                imageKey = 'roadWork';
                break;
            case 'camel_crossing':
                imageKey = 'camelCrossing';
                break;
        }
        
        // Draw hazard image
        if (imageKey && this.images[imageKey] && this.images[imageKey].complete) {
            this.ctx.drawImage(
                this.images[imageKey],
                hazard.x - hazard.width / 2,
                hazard.y - hazard.height / 2,
                hazard.width,
                hazard.height
            );
        } else {
            // Fallback to geometric shapes if image not loaded
            switch (hazard.type) {
                case 'hazard_light':
                    const isBlinking = hazard.blinkState < 30;
                    this.ctx.fillStyle = isBlinking ? '#ff6b35' : '#ffd700';
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(hazard.x, hazard.y, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('!', hazard.x, hazard.y);
                    break;
                    
                case 'road_work':
                    this.ctx.fillStyle = '#ff6b35';
                    this.ctx.fillRect(hazard.x - 15, hazard.y - 12, 30, 24);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('WORK', hazard.x, hazard.y);
                    break;
                    
                case 'camel_crossing':
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(hazard.x - 15, hazard.y - 12, 30, 24);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('CAMEL', hazard.x, hazard.y);
                    break;
            }
        }
        
        this.ctx.restore();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.getAlpha();
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawUI() {
        if (this.gameState !== GAME_STATE.PLAYING) return;
        
        // Mobile-friendly UI layout - all elements in one row
        const uiHeight = 30;
        const uiY = 15;
        const padding = 10;
        
        // Calculate positions for mobile-friendly layout
        const powerBarWidth = 80; // Smaller power bar
        const powerBarHeight = 15;
        const powerBarX = padding;
        const powerBarY = uiY;
        
        // Power bar background
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(powerBarX, powerBarY, powerBarWidth, powerBarHeight);
        
        // Power level
        const powerWidth = (this.player.power / this.player.maxPower) * powerBarWidth;
        this.ctx.fillStyle = this.player.power > 50 ? '#27ae60' : this.player.power > 25 ? '#f39c12' : '#e74c3c';
        this.ctx.fillRect(powerBarX, powerBarY, powerWidth, powerBarHeight);
        
        // Power bar border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(powerBarX, powerBarY, powerBarWidth, powerBarHeight);
        
        // Mobile-optimized text sizes
        const isMobile = this.canvas.width < 500;
        const powerFontSize = isMobile ? '10px' : '12px';
        const mainFontSize = isMobile ? '12px' : '14px';
        
        // Power text (smaller and inline)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${powerFontSize} Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`P:${Math.round(this.player.power)}`, powerBarX + powerBarWidth + 5, powerBarY + 11);
        
        // Time (center)
        const timeLeft = Math.ceil(this.gameTime / 1000);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${mainFontSize} Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Time: ${timeLeft}s`, this.canvas.width / 2, uiY + 11);
        
        // Coin count (right side)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${mainFontSize} Arial`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Coins: ${this.player.score}`, this.canvas.width - padding, uiY + 11);
        
        // Update floating score display
        this.updateFloatingScore();
        
        // Drag instructions (show for first 10 seconds)
        if (this.gameTime > (GAME_CONFIG.GAME_DURATION - 10000)) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = isMobile ? 'bold 14px Arial' : 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Drag left/right to move car', this.canvas.width / 2, this.canvas.height - 40);
            this.ctx.font = isMobile ? '12px Arial' : '14px Arial';
            this.ctx.fillText('or use arrow keys', this.canvas.width / 2, this.canvas.height - 20);
        }
    }
    
    updateFloatingScore() {
        const scoreElement = document.getElementById('currentScore');
        if (scoreElement) {
            scoreElement.textContent = this.player.score;
        }
    }
    
    showFloatingScore() {
        const floatingScore = document.getElementById('floating-score');
        if (floatingScore) {
            floatingScore.style.display = 'block';
        }
    }
    
    hideFloatingScore() {
        const floatingScore = document.getElementById('floating-score');
        if (floatingScore) {
            floatingScore.style.display = 'none';
        }
    }
    
    showPointsSnackbar(points) {
        const snackbar = document.getElementById('points-snackbar');
        const pointsEarned = document.getElementById('points-earned');
        
        if (snackbar && pointsEarned) {
            // Update points text
            pointsEarned.textContent = points;
            
            // Show snackbar with animation
            snackbar.classList.add('show');
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                snackbar.classList.remove('show');
            }, 2000);
        }
    }
    
    showNarrowEscapeSnackbar() {
        const snackbar = document.getElementById('points-snackbar');
        const pointsEarned = document.getElementById('points-earned');
        
        if (snackbar && pointsEarned) {
            // Update text to show narrow escape
            pointsEarned.textContent = 'NARROW ESCAPE!';
            
            // Show snackbar with animation
            snackbar.classList.add('show');
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                snackbar.classList.remove('show');
            }, 2000);
        }
    }
    
    // ============================================================================
    // UI MANAGEMENT
    // ============================================================================
    
    showLoadingScreen() {
        document.getElementById('loading').style.display = 'flex';
    }
    
    hideAllScreens() {
        document.getElementById('splash').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('gameover').style.display = 'none';
        document.getElementById('lead').style.display = 'none';
        this.hideFloatingScore();
    }
    
    showGameOverScreen() {
        document.getElementById('gameover').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.player.score;
        this.hideFloatingScore();
    }
    
    showLeadScreen() {
        document.getElementById('lead').style.display = 'flex';
    }
}

// ============================================================================
// GLOBAL GAME INSTANCE
// ============================================================================

let gameManager;

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function startGameOnClick() {
    console.log('Start button clicked!');
    if (!gameManager) {
        console.log('Creating new game manager...');
        gameManager = new GameManager();
    }
    console.log('Starting game...');
    gameManager.startGame();
}

function restartGame() {
    if (gameManager) {
        gameManager.startGame();
    }
}

function submitLeadForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    
    if (name && email && phone) {
        // Here you would typically send the data to your server
        console.log('Lead submitted:', { name, email, phone });
        alert('Thank you! We will contact you soon.');
        hideAllScreens();
    } else {
        alert('Please fill in all fields.');
    }
}

function submitGameOverForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    
    if (name && email && phone) {
        console.log('Game over lead submitted:', { name, email, phone });
        alert('Thank you! We will contact you soon.');
        hideAllScreens();
    } else {
        alert('Please fill in all fields.');
    }
}

function hideAllScreens() {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gameover').style.display = 'none';
    document.getElementById('lead').style.display = 'none';
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    // Initialize game when DOM is ready
    gameManager = new GameManager();
    
    // Set up form event listeners
    document.getElementById('leadForm').addEventListener('submit', submitLeadForm);
    document.getElementById('gameoverForm').addEventListener('submit', submitGameOverForm);
    
    // Set up button event listeners
    const startButton = document.getElementById('btnStart');
    if (startButton) {
        console.log('Start button found, adding event listener...');
        startButton.addEventListener('click', startGameOnClick);
} else {
        console.error('Start button not found!');
}
    console.log('Game initialization complete!');
});
