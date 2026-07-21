const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

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

        this.reset();
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
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        for(let i=0; i<3; i++) {
            if(this.bag.length > i) {
                const nextType = this.bag[this.bag.length - 1 - i];
                const p = new Piece(nextType);
                const bSize = 20; 
                const shape = p.shape;
                const pw = shape[0].length * bSize;
                const ph = shape.length * bSize;
                const ox = (this.nextCanvas.width - pw) / 2;
                const oy = (100 - ph) / 2 + (i * 100);

                this.nextCtx.fillStyle = p.color;
                for (let r = 0; r < shape.length; r++) {
                    for (let c = 0; c < shape[r].length; c++) {
                        if (shape[r][c]) {
                            this.nextCtx.fillRect(ox + c * bSize, oy + r * bSize, bSize - 1, bSize - 1);
                        }
                    }
                }
            }
        }
    }

    drawHold() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        if (this.holdPiece) {
            this.drawPieceCentered(this.holdCtx, this.holdPiece, this.holdCanvas.width, this.holdCanvas.height);
        }
    }

    renderBlock(ctx, x, y, size, color) {
        const isCyberpunk = document.body.getAttribute('data-theme') === 'cyberpunk';
        
        if (isCyberpunk) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y, size, size);

            ctx.shadowBlur = size / 2;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
            
            const padding = Math.max(1, Math.floor(size / 4));
            ctx.shadowBlur = padding;
            ctx.fillStyle = color;
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
            
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeRect(x, y, size, size);
            ctx.shadowBlur = 0;
        }
    }

    drawPieceCentered(ctx, piece, width, height) {
        const shape = piece.shape;
        const bSize = 20; 
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
    }

    move(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        if (this.collides()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
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
        this.currentPiece.shape = newShape;

        // Basic wall kick 
        if (this.collides()) {
            this.currentPiece.x++;
            if(this.collides()) {
                this.currentPiece.x -= 2;
                if(this.collides()) {
                    this.currentPiece.x++;
                    this.currentPiece.shape = oldShape; // Fail
                }
            }
        }
        
        this.resetLockDelayIfTouching();
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
            if (Math.floor(this.lines / 10) + 1 > this.level) {
                this.level++;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
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

        const currentDropInterval = Input.keys[Input.settings.softDrop] ? this.dropInterval / 10 : this.dropInterval;

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
