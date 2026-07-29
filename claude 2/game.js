const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 36;

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.linesDisplay = document.getElementById('lines-display');

        // High-DPI HD Sharpness Canvas Scaling
        this.setupHDCanvas(this.canvas, this.ctx, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        this.setupHDCanvas(this.holdCanvas, this.holdCtx, 100, 100);
        this.setupHDCanvas(this.nextCanvas, this.nextCtx, 120, 360);

        this.reset();
    }

    setupHDCanvas(canvas, ctx, width, height) {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
    }

    reset() {
        this.board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.bag = [];
        this.currentPiece = this.getNextPiece();
        this.holdPiece = null;
        this.canHold = true;
        
        this.dropInterval = 1000;
        this.lastTime = performance.now();
        this.dropCounter = 0;
        
        this.lockDelay = 500; // 500ms lock delay tolerance
        this.lockTimer = 0;
        this.isLocking = false;

        this.activeDir = null;
        this.dasDelay = 150;
        this.arrDelay = 40;
        this.dasTimer = 0;
        this.arrTimer = 0;

        this.isGameOver = false;
        this.isPaused = false;
        this.lastClearWasTetris = false;

        this.updateStats();
        this.drawHold();
    }

    getNextPiece() {
        while (this.bag.length <= 3) {
            const newBag = [...PIECE_TYPES];
            newBag.sort(() => Math.random() - 0.5);
            this.bag = newBag.concat(this.bag);
        }
        const p = new Piece(this.bag.pop());
        this.drawNext();
        return p;
    }

    drawNext() {
        this.nextCtx.clearRect(0, 0, 120, 360);
        for(let i=0; i<3; i++) {
            if(this.bag.length > i) {
                const nextType = this.bag[this.bag.length - 1 - i];
                const p = new Piece(nextType);
                const bSize = 24; 
                const shape = p.shape;
                const pw = shape[0].length * bSize;
                const ph = shape.length * bSize;
                const ox = (120 - pw) / 2;
                const oy = (110 - ph) / 2 + (i * 115);

                for (let r = 0; r < shape.length; r++) {
                    for (let c = 0; c < shape[r].length; c++) {
                        if (shape[r][c]) {
                            this.renderBlock(this.nextCtx, ox + c * bSize, oy + r * bSize, bSize - 1, p.color);
                        }
                    }
                }
            }
        }
    }

    drawHold() {
        this.holdCtx.clearRect(0, 0, 100, 100);
        if (this.holdPiece) {
            this.drawPieceCentered(this.holdCtx, this.holdPiece, 100, 100);
        }
    }

    getLevelColor(baseColor, level) {
        if (!baseColor || level <= 1) return baseColor;
        
        // Convert hex or color to HSL and shift hue by +35deg per level
        let hex = baseColor.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length !== 6) return baseColor;

        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        // Shift hue based on current level (+35 degrees per level)
        let shiftDegrees = ((level - 1) * 35) % 360;
        let newHue = (h * 360 + shiftDegrees) % 360;

        return `hsl(${Math.round(newHue)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    renderBlock(ctx, x, y, size, color) {
        const theme = document.body.getAttribute('data-theme');
        const finalColor = this.getLevelColor(color, this.level || 1);
        
        ctx.save();
        if (theme === 'cyberpunk') {
            // Dark base fill
            ctx.fillStyle = 'rgba(6, 2, 18, 0.9)';
            ctx.fillRect(x, y, size, size);

            // Glowing neon stroke
            ctx.shadowBlur = Math.max(6, size / 2.5);
            ctx.shadowColor = finalColor;
            ctx.strokeStyle = finalColor;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
            
            // Inner vibrant core
            const padding = Math.max(2, Math.floor(size / 3.5));
            ctx.shadowBlur = padding;
            ctx.fillStyle = finalColor;
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

            // Inner top-left highlight accent
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(x + padding, y + padding, size - padding * 2, 2);
            ctx.fillRect(x + padding, y + padding, 2, size - padding * 2);
        } else if (theme === 'nes') {
            // Crisp flat 8-bit sprite block: no gradients, no blur, hard pixel edges
            ctx.imageSmoothingEnabled = false;
            const px = Math.max(2, Math.round(size / 8)); // pixel unit

            // Solid base fill (flat color, no antialiasing feel)
            ctx.fillStyle = finalColor;
            ctx.fillRect(x, y, size, size);

            // Thick black pixel outline (classic sprite border)
            ctx.fillStyle = '#000000';
            ctx.fillRect(x, y, size, px);                     // top
            ctx.fillRect(x, y + size - px, size, px);          // bottom
            ctx.fillRect(x, y, px, size);                       // left
            ctx.fillRect(x + size - px, y, px, size);           // right

            // Hard 1-pixel highlight (top-left) and shadow (bottom-right) - NES sprite shading
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillRect(x + px, y + px, size - px * 2, px);
            ctx.fillRect(x + px, y + px, px, size - px * 2);

            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(x + px, y + size - px * 2, size - px * 2, px);
            ctx.fillRect(x + size - px * 2, y + px, px, size - px * 2);

            // Single bright corner pixel accent
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fillRect(x + px, y + px, px, px);
        } else if (theme === 'nebula') {
            // Glassy, glowing cosmic block
            ctx.fillStyle = 'rgba(10, 8, 30, 0.55)';
            ctx.fillRect(x, y, size, size);

            ctx.shadowBlur = size / 2;
            ctx.shadowColor = finalColor;
            ctx.fillStyle = finalColor;
            ctx.globalAlpha = 0.85;
            const padding = Math.max(2, Math.floor(size / 6));
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
            ctx.globalAlpha = 1.0;

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.fillRect(x + padding, y + padding, size - padding * 2, 2);
        } else {
            // Modern High-Res HD 3D Block - crisper bevels & sharper edges
            ctx.fillStyle = finalColor;
            ctx.fillRect(x, y, size, size);

            // Crisp bevel highlights (tighter, higher-contrast)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.fillRect(x, y, size, 2);
            ctx.fillRect(x, y, 2, size);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(x, y + size - 2, size, 2);
            ctx.fillRect(x + size - 2, y, 2, size);

            // Sharp 1px outer outline for definition at any zoom level
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

            // Subtle inner highlight dot for crisp glassy pop
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(x + 3, y + 3, Math.max(2, size / 5), 2);
        }
        ctx.restore();
    }

    drawPieceCentered(ctx, piece, width, height) {
        const shape = piece.shape;
        const bSize = 25; 
        const pw = shape[0].length * bSize;
        const ph = shape.length * bSize;
        const ox = (width - pw) / 2;
        const oy = (height - ph) / 2;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    this.renderBlock(ctx, ox + c * bSize, oy + r * bSize, bSize - 1, piece.color);
                }
            }
        }
    }

    hold() {
        if (!this.canHold) return;
        
        if (this.holdPiece) {
            const temp = this.currentPiece.type;
            this.currentPiece = new Piece(this.holdPiece.type);
            this.holdPiece = new Piece(temp);
        } else {
            this.holdPiece = new Piece(this.currentPiece.type);
            this.currentPiece = this.getNextPiece();
        }
        this.canHold = false;
        this.drawHold();
        this.resetLockDelay();
        if (typeof cyberSFX !== 'undefined') cyberSFX.playHoldSound();
    }

    move(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        if (this.collides()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
        if (dx !== 0 && typeof cyberSFX !== 'undefined') cyberSFX.playMoveSound(false);
        return true;
    }

    rotate(dir) {
        const shape = this.currentPiece.shape;
        const newShape = Array.from({length: shape[0].length}, () => Array(shape.length).fill(0));
        
        if (dir === 1) { // CW
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    newShape[c][shape.length - 1 - r] = shape[r][c];
                }
            }
        } else { // CCW
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    newShape[shape[0].length - 1 - c][r] = shape[r][c];
                }
            }
        }

        const oldShape = this.currentPiece.shape;
        const oldX = this.currentPiece.x;
        const oldY = this.currentPiece.y;
        
        this.currentPiece.shape = newShape;

        // Modern SRS (Super Rotation System) Wall Kick Offsets
        let kickOffsets = [];
        if (this.currentPiece.type === 'I') {
            // SRS Kicks for 4x4 I-piece
            kickOffsets = [
                [0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2], [2, 0], [-1, 0], [2, -1], [-1, 2], [0, -1], [0, -2]
            ];
        } else {
            // SRS Kicks for 3x3 pieces (J, L, S, T, Z)
            kickOffsets = [
                [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, -2]
            ];
        }

        let success = false;
        for (const [dx, dy] of kickOffsets) {
            this.currentPiece.x = oldX + dx;
            this.currentPiece.y = oldY + dy;
            if (!this.collides()) {
                success = true;
                break;
            }
        }

        if (!success) {
            // Revert if all kick offsets collide
            this.currentPiece.shape = oldShape;
            this.currentPiece.x = oldX;
            this.currentPiece.y = oldY;
        } else {
            this.resetLockDelayIfTouching();
            if (typeof cyberSFX !== 'undefined') cyberSFX.playMoveSound(true);
        }
    }

    collides(piece = this.currentPiece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (!piece.shape[r][c]) continue;
                let nx = piece.x + c;
                let ny = piece.y + r;
                
                if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                if (ny >= 0 && this.board[ny][nx]) return true;
            }
        }
        return false;
    }

    drop() {
        if (this.move(0, 1)) {
            this.dropCounter = 0;
            this.resetLockDelay();
            return true;
        } else {
            if (!this.isLocking) {
                this.isLocking = true;
                this.lockTimer = 0;
            }
            return false;
        }
    }

    hardDrop() {
        while(this.move(0, 1)) {
            this.score += 2; 
        }
        if (typeof cyberSFX !== 'undefined') cyberSFX.playHardDropSound();
        this.lock();
    }

    resetLockDelay() {
        this.isLocking = false;
        this.lockTimer = 0;
    }

    resetLockDelayIfTouching() {
        this.currentPiece.y++;
        if(this.collides()) {
            this.isLocking = true;
            this.lockTimer = 0;
        } else {
            if (this.isLocking) {
                this.isLocking = false;
                this.lockTimer = 0;
                this.dropCounter = this.dropInterval; // prevent hovering
            }
        }
        this.currentPiece.y--;
    }

    lock() {
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
            for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                if (this.currentPiece.shape[r][c]) {
                    if (this.currentPiece.y + r < 0) {
                        this.gameOver();
                        return;
                    }
                    this.board[this.currentPiece.y + r][this.currentPiece.x + c] = this.currentPiece.color;
                }
            }
        }
        this.clearLines();
        this.currentPiece = this.getNextPiece();
        this.canHold = true;
        this.resetLockDelay();
        if (this.collides()) {
            this.gameOver();
        }
    }

    showActionText(text) {
        const container = document.getElementById('action-text-container');
        if (!container) return;
        
        const el = document.createElement('div');
        el.className = 'action-popup';
        el.innerText = text;
        
        if (text.includes('Tetris')) {
            el.classList.add('glitch-text');
            el.setAttribute('data-text', text);
        }

        container.appendChild(el);

        setTimeout(() => {
            if (container.contains(el)) container.removeChild(el);
        }, 1500);
    }

    clearLines() {
        let linesCleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.board[r].every(cell => cell !== 0)) {
                this.board.splice(r, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                r++; 
            }
        }

        if (linesCleared > 0) {
            let points = 0;
            let actionName = '';

            switch(linesCleared) {
                case 1: points = 100; actionName = 'Single'; break;
                case 2: points = 300; actionName = 'Double'; break;
                case 3: points = 500; actionName = 'Triple'; break;
                case 4: 
                    if (this.lastClearWasTetris) {
                        points = 1800; // B2B Bonus
                        actionName = 'B2B Tetris!';
                    } else {
                        points = 1200;
                        actionName = 'Tetris!';
                    }
                    this.lastClearWasTetris = true;
                    break;
            }

            if (linesCleared < 4 && linesCleared > 0) {
                this.lastClearWasTetris = false;
            }

            this.lines += linesCleared;
            this.score += points * this.level;
            
            this.showActionText(actionName);
            if (typeof cyberSFX !== 'undefined') {
                cyberSFX.playScoreSound(linesCleared, actionName.includes('B2B'));
            }
            if (typeof backgroundFX !== 'undefined') {
                backgroundFX.triggerScoreBurst(linesCleared);
            }
            if (document.body.getAttribute('data-theme') === 'cyberpunk') {
                document.body.classList.remove('screen-glitch', 'screen-glitch-medium', 'screen-glitch-weak');
                // Force reflow
                void document.body.offsetWidth;
                if (linesCleared === 4) {
                    document.body.classList.add('screen-glitch');
                } else if (linesCleared === 3) {
                    document.body.classList.add('screen-glitch-medium');
                } else if (linesCleared === 2) {
                    document.body.classList.add('screen-glitch-weak');
                }
            }
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                if (typeof backgroundFX !== 'undefined') {
                    backgroundFX.setHueShift((this.level - 1) * 35);
                }
                
                setTimeout(() => {
                    this.showActionText('LEVEL ' + this.level + '!');
                    if (typeof cyberSFX !== 'undefined') {
                        cyberSFX.playLevelUpSound();
                    }
                }, 300);
            }
            this.updateStats();
        }
    }

    updateStats() {
        this.scoreDisplay.innerText = this.score;
        this.levelDisplay.innerText = this.level;
        this.linesDisplay.innerText = this.lines;
    }

    gameOver() {
        this.isGameOver = true;
        document.getElementById('final-score-val').innerText = this.score;
        document.getElementById('name-input-container').classList.remove('hidden');
        document.getElementById('game-over-buttons').classList.add('hidden');
        document.getElementById('game-over-overlay').classList.remove('hidden');
        document.getElementById('player-name').focus();
        if (typeof cyberSFX !== 'undefined') cyberSFX.playGameOverSound();
    }

    getGhostY() {
        let ghostY = this.currentPiece.y;
        while (!this.collides({...this.currentPiece, y: ghostY + 1})) {
            ghostY++;
        }
        return ghostY;
    }

    draw() {
        this.ctx.fillStyle = '#0f0f13';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for(let r=0; r<=ROWS; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r*BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, r*BLOCK_SIZE);
            this.ctx.stroke();
        }
        for(let c=0; c<=COLS; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c*BLOCK_SIZE, 0);
            this.ctx.lineTo(c*BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.board[r][c]) {
                    this.drawBlock(c, r, this.board[r][c]);
                }
            }
        }

        if (!this.isGameOver) {
            const gy = this.getGhostY();
            this.ctx.globalAlpha = 0.2;
            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {
                        this.drawBlock(this.currentPiece.x + c, gy + r, this.currentPiece.color);
                    }
                }
            }
            this.ctx.globalAlpha = 1.0;

            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {
                        this.drawBlock(this.currentPiece.x + c, this.currentPiece.y + r, this.currentPiece.color);
                    }
                }
            }
        }
    }

    drawBlock(x, y, color) {
        this.renderBlock(this.ctx, x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, color);
    }

    update(time) {
        if (this.isGameOver || this.isPaused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        // DAS / ARR logic
        if (Input.keys[Input.settings.left] && !Input.keys[Input.settings.right]) {
            if (this.activeDir !== 'left') {
                this.activeDir = 'left';
                this.dasTimer = 0;
            } else {
                this.dasTimer += deltaTime;
                if (this.dasTimer >= this.dasDelay) {
                    this.arrTimer += deltaTime;
                    if (this.arrTimer >= this.arrDelay) {
                        this.move(-1, 0);
                        this.resetLockDelayIfTouching();
                        this.arrTimer = 0;
                    }
                }
            }
        } else if (Input.keys[Input.settings.right] && !Input.keys[Input.settings.left]) {
            if (this.activeDir !== 'right') {
                this.activeDir = 'right';
                this.dasTimer = 0;
            } else {
                this.dasTimer += deltaTime;
                if (this.dasTimer >= this.dasDelay) {
                    this.arrTimer += deltaTime;
                    if (this.arrTimer >= this.arrDelay) {
                        this.move(1, 0);
                        this.resetLockDelayIfTouching();
                        this.arrTimer = 0;
                    }
                }
            }
        } else {
            this.activeDir = null;
        }

        const currentDropInterval = Input.keys[Input.settings.softDrop] ? this.dropInterval / 30 : this.dropInterval;

        if (this.isLocking) {
            this.lockTimer += deltaTime;
            if (this.lockTimer >= this.lockDelay) {
                this.currentPiece.y++;
                const touching = this.collides();
                this.currentPiece.y--;
                if (touching) {
                    this.lock();
                } else {
                    this.isLocking = false;
                    this.lockTimer = 0;
                    this.dropCounter = currentDropInterval;
                }
            } else {
                this.currentPiece.y++;
                if(!this.collides()) {
                    this.isLocking = false;
                    this.lockTimer = 0;
                    this.dropCounter = currentDropInterval;
                }
                this.currentPiece.y--;
            }
        } else {
            this.dropCounter += deltaTime;
            if (this.dropCounter >= currentDropInterval) {
                this.drop();
                if(Input.keys[Input.settings.softDrop]) {
                    this.score += 1;
                    this.updateStats();
                }
            }
        }

        this.draw();
    }
}
