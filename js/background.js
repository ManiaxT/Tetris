class BackgroundFX {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'bg-canvas';
            document.body.prepend(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.bursts = [];
        this.tetrominos3D = [];
        this.hueShift = 0;
        this.glitchTimer = 0;

        // Cached sun gradients for performance optimization
        this._sunGradCacheKey = null;
        this._sunGradCache = null;
        this._sunGlowCache = null;

        // Bind once so the RAF loop doesn't allocate a new arrow function every frame.
        this._boundAnimate = this.animate.bind(this);
        
        // Slow-drifting nebula cloud blobs for the Nebula theme
        this.nebulaBlobs = [];
        this.zenLeaves = [];
        this.oceanBubbles = [];
        this.spookyBats = [];
        this.spookyMist = [];
        this.marioClouds = [];
        this.marioCoins = [];
        this.marioStars = [];
        this.cyberBuildings = [];
        this.cyberSpinners = [];
        this.cyberRain = [];
        this.cyberSurge = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initParticles();
        this.init3DTetrominos();
        this.initNebulaBlobs();
        this.initZenLeaves();
        this.initOceanBubbles();
        this.initSpooky();
        this.initMario();
        this.initCyberCity();
        this.animate();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.scale(dpr, dpr);
        this._sunGradCacheKey = null;
        this.initCyberCity();
    }

    initParticles() {
        this.particles = [];
        const count = 90;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2.5 + 1.0,
                speedY: Math.random() * 0.45 + 0.15,
                speedX: (Math.random() - 0.5) * 0.25,
                alpha: Math.random() * 0.6 + 0.3,
                baseAlpha: Math.random() * 0.5 + 0.3,
                pulseSpeed: Math.random() * 0.03 + 0.01,
                pulseAngle: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '#ff007f' : '#00f0f0'
            });
        }
    }

    init3DTetrominos() {
        this.tetrominos3D = [];
        // 3D block layouts for Tetrominos
        const shapes3D = {
            I: [[-1.5,0,0], [-0.5,0,0], [0.5,0,0], [1.5,0,0]],
            O: [[-0.5,-0.5,0], [0.5,-0.5,0], [-0.5,0.5,0], [0.5,0.5,0]],
            T: [[-1,0,0], [0,0,0], [1,0,0], [0,-1,0]],
            L: [[-1,0,0], [0,0,0], [1,0,0], [1,-1,0]],
            Z: [[-1,-1,0], [0,-1,0], [0,0,0], [1,0,0]]
        };
        const types = Object.keys(shapes3D);
        const palette = ['#00f0f0', '#ff007f', '#a000f0', '#f0a000', '#00f000'];

        for (let i = 0; i < 14; i++) {
            const type = types[i % types.length];
            this.tetrominos3D.push({
                type: type,
                cubes: shapes3D[type],
                x: (Math.random() - 0.5) * window.innerWidth * 1.3,
                y: (Math.random() - 0.5) * window.innerHeight * 1.3,
                z: Math.random() * 350 + 100, // Depth
                rotX: Math.random() * Math.PI * 2,
                rotY: Math.random() * Math.PI * 2,
                rotZ: Math.random() * Math.PI * 2,
                speedRotX: (Math.random() - 0.5) * 0.012,
                speedRotY: (Math.random() - 0.5) * 0.015,
                speedRotZ: (Math.random() - 0.5) * 0.008,
                speedY: (Math.random() - 0.5) * 0.35 - 0.1, // Slow floating
                scale: Math.random() * 16 + 28, // Substantially larger HD scale
                color: palette[i % palette.length]
            });
        }
    }

    initNebulaBlobs() {
        this.nebulaBlobs = [];
        const palette = [
            'rgba(155, 89, 255, 0.35)',
            'rgba(255, 92, 200, 0.30)',
            'rgba(80, 150, 255, 0.30)',
            'rgba(120, 60, 220, 0.28)',
            'rgba(255, 140, 220, 0.22)'
        ];
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (let i = 0; i < 6; i++) {
            this.nebulaBlobs.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 260 + 220,
                color: palette[i % palette.length],
                speedX: (Math.random() - 0.5) * 0.12,
                speedY: (Math.random() - 0.5) * 0.12,
                pulseAngle: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.006 + 0.003
            });
        }
    }

    initZenLeaves() {
        this.zenLeaves = [];
        const palette = ['#c9a227', '#b85d19', '#d49b35', '#88992e', '#9e4719', '#dfb738'];
        const w = window.innerWidth, h = window.innerHeight;
        for (let i = 0; i < 40; i++) {
            this.zenLeaves.push({
                x: Math.random() * w,
                y: Math.random() * h,
                len: Math.random() * 14 + 10,
                width: Math.random() * 6 + 4,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02,
                speedY: Math.random() * 0.6 + 0.3,
                swaySpeed: Math.random() * 0.02 + 0.01,
                swayAmp: Math.random() * 1.5 + 0.8,
                swayPhase: Math.random() * Math.PI * 2,
                color: palette[i % palette.length],
                alpha: Math.random() * 0.45 + 0.35
            });
        }
    }

    initOceanBubbles() {
        this.oceanBubbles = [];
        const w = window.innerWidth, h = window.innerHeight;
        for (let i = 0; i < 50; i++) {
            this.oceanBubbles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 7 + 2.5,
                speedY: Math.random() * 0.85 + 0.4,
                wobbleSpeed: Math.random() * 0.035 + 0.015,
                wobbleAmp: Math.random() * 1.2 + 0.6,
                wobblePhase: Math.random() * Math.PI * 2,
                alpha: Math.random() * 0.45 + 0.25
            });
        }
    }

    initSpooky() {
        this.spookyBats = [];
        this.spookyMist = [];
        const w = window.innerWidth, h = window.innerHeight;
        for (let i = 0; i < 7; i++) {
            this.spookyBats.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.55),
                speedX: -(Math.random() * 1.8 + 1.2),
                speedY: 0,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.22,
                scale: Math.random() * 0.5 + 0.7
            });
        }
        for (let i = 0; i < 5; i++) {
            this.spookyMist.push({
                x: Math.random() * w,
                y: h * 0.65 + Math.random() * (h * 0.35),
                r: Math.random() * 220 + 160,
                speedX: (Math.random() - 0.5) * 0.18,
                alpha: Math.random() * 0.12 + 0.06
            });
        }
    }

    initMario() {
        this.marioClouds = [];
        this.marioCoins = [];
        this.marioStars = [];
        const w = window.innerWidth, h = window.innerHeight;
        
        // 8-bit Clouds (drifting from right to left)
        for (let i = 0; i < 6; i++) {
            this.marioClouds.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.45),
                scale: Math.random() * 0.5 + 0.75,
                speedX: -(Math.random() * 0.35 + 0.15)
            });
        }

        // Ambient rotating 8-bit Gold Coins bobbing in the breeze
        for (let i = 0; i < 10; i++) {
            this.marioCoins.push({
                x: Math.random() * w,
                y: Math.random() * (h * 0.85) + 30,
                phase: Math.random() * Math.PI * 2,
                bobPhase: Math.random() * Math.PI * 2,
                rotSpeed: Math.random() * 0.04 + 0.03,
                scale: Math.random() * 0.3 + 0.8,
                alpha: Math.random() * 0.35 + 0.35
            });
        }
    }

    drawMarioCloud(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // Outer black pixel contour
        ctx.fillStyle = '#000000';
        ctx.fillRect(-45, -12, 90, 36);
        ctx.fillRect(-35, -24, 70, 48);
        ctx.fillRect(-15, -34, 30, 58);

        // Cloud White Body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-42, -9, 84, 30);
        ctx.fillRect(-32, -21, 64, 42);
        ctx.fillRect(-12, -31, 24, 52);

        // Cloud Lower Sky-blue Shadow
        ctx.fillStyle = '#b0d4f8';
        ctx.fillRect(-42, 12, 84, 9);
        ctx.fillRect(-32, 9, 64, 6);

        ctx.restore();
    }

    drawMarioCoin(ctx, x, y, scale, phase, alpha) {
        const wFactor = Math.max(0.12, Math.abs(Math.cos(phase)));
        const baseW = 11 * scale * wFactor;
        const baseH = 17 * scale;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.translate(x, y);

        // Black outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(-baseW - 1.5, -baseH / 2 - 1.5, (baseW * 2) + 3, baseH + 3);

        // Gold coin body
        ctx.fillStyle = '#fcd800';
        ctx.fillRect(-baseW, -baseH / 2, baseW * 2, baseH);

        // Inner shiny highlight slot
        if (wFactor > 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-baseW * 0.35, -baseH * 0.35, Math.max(1.5, baseW * 0.7), baseH * 0.7);
            ctx.fillStyle = '#ea9e22';
            ctx.fillRect(-baseW * 0.15, -baseH * 0.25, Math.max(1, baseW * 0.3), baseH * 0.5);
        }

        ctx.restore();
    }

    drawMarioHills(ctx, w, h) {
        ctx.save();
        // Hill 1 (Left)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(w * 0.22, h, 140, 95, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.ellipse(w * 0.22, h, 136, 91, 0, Math.PI, 0);
        ctx.fill();

        // Hill 1 highlight
        ctx.fillStyle = '#80d010';
        ctx.beginPath();
        ctx.ellipse(w * 0.20, h - 40, 30, 20, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Hill 2 (Right side)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(w * 0.82, h, 210, 125, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.ellipse(w * 0.82, h, 206, 121, 0, Math.PI, 0);
        ctx.fill();

        // Hill 2 highlight
        ctx.fillStyle = '#80d010';
        ctx.beginPath();
        ctx.ellipse(w * 0.80, h - 55, 45, 28, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    initCyberCity() {
        this.cyberBuildings = [];
        this.cyberSpinners = [];
        this.cyberRain = [];
        const w = window.innerWidth || 1200;
        const h = window.innerHeight || 800;

        // Generate layered 16-bit skyscrapers
        let currentX = -40;
        const neonPalette = ['#ff007f', '#00f0ff', '#fcd800', '#a855f7'];
        const signs = ['NEO', 'TETRIS', '16-BIT', 'CYBER', 'CORP', 'MATRIX', 'AI', 'RAM'];

        while (currentX < w + 60) {
            const bWidth = Math.floor(Math.random() * 55) + 65;
            const bHeight = Math.floor(Math.random() * (h * 0.45)) + (h * 0.28);
            const isFront = Math.random() > 0.45;
            
            // Generate window matrix for building
            const rows = Math.floor(bHeight / 16);
            const cols = Math.floor((bWidth - 16) / 10);
            const windows = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.35) { // 65% lit windows
                        windows.push({
                            r: r,
                            c: c,
                            color: Math.random() > 0.7 ? '#00f0ff' : (Math.random() > 0.5 ? '#ff007f' : '#ffe680'),
                            flicker: Math.random() > 0.9
                        });
                    }
                }
            }

            // Optional rooftop antenna / beacon
            const hasAntenna = Math.random() > 0.35;
            const antennaHeight = Math.floor(Math.random() * 35) + 20;

            // Optional neon billboard sign
            const hasSign = Math.random() > 0.5;
            const signText = signs[Math.floor(Math.random() * signs.length)];
            const signColor = neonPalette[Math.floor(Math.random() * neonPalette.length)];

            this.cyberBuildings.push({
                x: currentX,
                w: bWidth,
                h: bHeight,
                isFront: isFront,
                bodyColor: isFront ? '#0d041c' : '#070110',
                edgeColor: isFront ? 'rgba(255, 0, 128, 0.45)' : 'rgba(0, 240, 255, 0.25)',
                windows: windows,
                cols: cols,
                hasAntenna: hasAntenna,
                antennaHeight: antennaHeight,
                hasSign: hasSign,
                signText: signText,
                signColor: signColor,
                signY: Math.floor(Math.random() * (bHeight * 0.4)) + 20
            });

            currentX += bWidth - 12; // slight overlap
        }

        // Flying Spinners (Hover-cars traffic streams)
        for (let i = 0; i < 9; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            this.cyberSpinners.push({
                x: Math.random() * w,
                y: (h * 0.15) + (i * (h * 0.065)) + (Math.random() * 20),
                speed: (Math.random() * 1.6 + 1.8) * dir,
                dir: dir,
                scale: Math.random() * 0.35 + 0.8,
                color: dir === 1 ? '#00f0ff' : '#ff007f', // Cyan heading right, hot pink heading left
                trailLen: Math.floor(Math.random() * 35) + 30
            });
        }

        // Digital Neon Rain
        for (let i = 0; i < 45; i++) {
            this.cyberRain.push({
                x: Math.random() * (w + 200) - 100,
                y: Math.random() * h,
                len: Math.random() * 18 + 12,
                speedY: Math.random() * 8 + 12,
                speedX: -2.2, // diagonal slant
                alpha: Math.random() * 0.35 + 0.2,
                color: Math.random() > 0.5 ? 'rgba(0, 240, 255, ' : 'rgba(255, 0, 128, '
            });
        }
    }

    drawCyberCity(ctx, w, h, now) {
        // 1. Atmosphere: 16-Bit Night Sky with Neon Haze
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#04000b');
        skyGrad.addColorStop(0.5, '#120224');
        skyGrad.addColorStop(0.85, '#24043d');
        skyGrad.addColorStop(1, '#3b004d');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Distant Glowing 16-Bit Cyber Sun / Data Moon
        const sunX = w * 0.5;
        const sunY = h * 0.42;
        const sunR = Math.min(w, h) * 0.22;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 1.5);
        sunGlow.addColorStop(0, 'rgba(255, 0, 128, 0.35)');
        sunGlow.addColorStop(0.6, 'rgba(0, 240, 255, 0.12)');
        sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 16-Bit Sun Body with horizontal neon bands
        ctx.save();
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.clip();
        const sunBodyGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
        sunBodyGrad.addColorStop(0, '#fcd800');
        sunBodyGrad.addColorStop(0.45, '#ff007f');
        sunBodyGrad.addColorStop(1, '#8b00ff');
        ctx.fillStyle = sunBodyGrad;
        ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);

        // Horizontal synth scanline cuts
        ctx.fillStyle = '#060112';
        const numStripes = 8;
        for (let i = 0; i < numStripes; i++) {
            const sy = sunY + (i * (sunR * 1.1 / numStripes)) - 10;
            const sh = (i + 1) * 2;
            ctx.fillRect(sunX - sunR, sy, sunR * 2, sh);
        }
        ctx.restore();

        // 2. Skyscrapers (Layered 16-Bit Skyline)
        const isSurging = this.cyberSurge > 0;
        if (this.cyberSurge > 0) this.cyberSurge--;

        for (let b of this.cyberBuildings) {
            const bx = b.x;
            const by = h - b.h;

            // Building silhouette
            ctx.fillStyle = isSurging ? '#250840' : b.bodyColor;
            ctx.fillRect(bx, by, b.w, b.h);

            // Neon roof and side edge
            ctx.strokeStyle = isSurging ? '#00f0ff' : b.edgeColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, b.w, b.h);

            // Antenna with blinking aircraft beacon
            if (b.hasAntenna) {
                const ax = bx + b.w * 0.5;
                ctx.strokeStyle = '#22083a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(ax, by);
                ctx.lineTo(ax, by - b.antennaHeight);
                ctx.stroke();

                // Blinking red warning beacon light
                const beaconPhase = Math.sin(now * 4 + bx) > 0;
                if (beaconPhase || isSurging) {
                    ctx.fillStyle = isSurging ? '#00f0ff' : '#ff1838';
                    ctx.beginPath();
                    ctx.arc(ax, by - b.antennaHeight, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Lit 16-Bit Windows
            const winW = 3;
            const winH = 4;
            const startX = bx + 8;
            const startY = by + 10;

            for (let win of b.windows) {
                const wx = startX + win.c * 8;
                const wy = startY + win.r * 12;
                if (wy > h - 40) continue;

                // Subtle flicker
                let alpha = 0.85;
                if (win.flicker && Math.sin(now * 5 + wx) > 0.6) {
                    alpha = 0.2;
                }
                if (isSurging) alpha = 1.0;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = isSurging ? '#00f0ff' : win.color;
                ctx.fillRect(wx, wy, winW, winH);
                ctx.restore();
            }

            // Neon Sign / Hologram Billboard
            if (b.hasSign) {
                const sx = bx + b.w * 0.5;
                const sy = by + b.signY;

                ctx.save();
                ctx.font = '10px "Orbitron", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const signPulse = 0.75 + Math.sin(now * 3 + bx) * 0.25;
                ctx.globalAlpha = isSurging ? 1.0 : signPulse;
                ctx.fillStyle = isSurging ? '#ffffff' : b.signColor;
                ctx.shadowColor = b.signColor;
                ctx.shadowBlur = isSurging ? 18 : 8;

                // Vertical billboard frame
                ctx.strokeStyle = b.signColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(sx - 18, sy - 12, 36, 24);
                ctx.fillText(b.signText, sx, sy);
                ctx.restore();
            }
        }

        // 3. Flying Aerocars / Spinners (Traffic Streams)
        for (let s of this.cyberSpinners) {
            s.x += s.speed;
            if (s.dir === 1 && s.x > w + 60) s.x = -60;
            if (s.dir === -1 && s.x < -60) s.x = w + 60;

            ctx.save();
            ctx.translate(s.x, s.y);

            // Laser trail
            const trailGrad = ctx.createLinearGradient(0, 0, -s.trailLen * s.dir, 0);
            trailGrad.addColorStop(0, s.color);
            trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = 2 * s.scale;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-s.trailLen * s.dir, 0);
            ctx.stroke();

            // Aerocar 16-bit body
            ctx.fillStyle = '#0a0316';
            ctx.fillRect(-6 * s.scale, -2.5 * s.scale, 12 * s.scale, 5 * s.scale);
            // Glowing headlights/taillights
            ctx.fillStyle = s.color;
            ctx.fillRect(s.dir === 1 ? 4 * s.scale : -6 * s.scale, -1.5 * s.scale, 2.5 * s.scale, 3 * s.scale);

            ctx.restore();
        }

        // 4. Digital Cyber Rain
        for (let r of this.cyberRain) {
            r.x += r.speedX;
            r.y += r.speedY;
            if (r.y > h) {
                r.y = -20;
                r.x = Math.random() * (w + 200) - 100;
            }

            ctx.strokeStyle = `${r.color}${r.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x + r.speedX * 1.5, r.y + r.len);
            ctx.stroke();
        }

        // 5. Horizon Wet Highway / Neon Reflection Grid
        ctx.save();
        const roadH = h * 0.18;
        const roadY = h - roadH;
        const roadGrad = ctx.createLinearGradient(0, roadY, 0, h);
        roadGrad.addColorStop(0, 'rgba(20, 2, 35, 0.95)');
        roadGrad.addColorStop(0.4, 'rgba(10, 0, 20, 0.98)');
        roadGrad.addColorStop(1, '#05000a');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, roadY, w, roadH);

        // Perspective Laser Highway Lines
        ctx.strokeStyle = 'rgba(255, 0, 128, 0.28)';
        ctx.lineWidth = 1.2;
        const numLanes = 12;
        for (let i = 0; i <= numLanes; i++) {
            const startX = (w * 0.5) + (i - numLanes * 0.5) * (w * 0.05);
            const endX = (w * 0.5) + (i - numLanes * 0.5) * (w * 0.18);
            ctx.beginPath();
            ctx.moveTo(startX, roadY);
            ctx.lineTo(endX, h);
            ctx.stroke();
        }

        // Horizontal laser grid tracks moving forward
        const gridSpeed = (now * 50) % 30;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
        for (let gy = roadY + gridSpeed; gy < h; gy += 25) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
        }
        ctx.restore();
    }

    triggerScoreBurst(linesCleared) {
        const currentTheme = document.body.getAttribute('data-theme') || 'modern';
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        if (currentTheme === 'cyberpunk') {
            this.cyberSurge = linesCleared >= 4 ? 45 : 20;
            return;
        }

        if (currentTheme === 'zen') {
            // Zen Garden: Swirl of warm golden leaves
            const count = linesCleared >= 4 ? 30 : linesCleared * 8;
            const palette = ['#c9a227', '#dfb738', '#b85d19', '#d49b35'];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.zenLeaves.push({
                    x: cx + (Math.random() - 0.5) * 100,
                    y: cy + (Math.random() - 0.5) * 100,
                    len: Math.random() * 12 + 10,
                    width: Math.random() * 6 + 4,
                    angle: angle,
                    rotSpeed: (Math.random() - 0.5) * 0.05,
                    speedY: Math.random() * 0.8 + 0.4,
                    swaySpeed: 0.03,
                    swayAmp: 2,
                    swayPhase: Math.random() * Math.PI * 2,
                    color: palette[i % palette.length],
                    alpha: 0.8,
                    isTemporary: true
                });
            }
            return;
        }

        if (currentTheme === 'ocean') {
            // Ocean: Burst of rising bubbles
            const count = linesCleared >= 4 ? 40 : linesCleared * 12;
            for (let i = 0; i < count; i++) {
                this.oceanBubbles.push({
                    x: cx + (Math.random() - 0.5) * 180,
                    y: cy + (Math.random() - 0.5) * 120,
                    r: Math.random() * 10 + 3,
                    speedY: Math.random() * 2.5 + 1.2,
                    wobbleSpeed: 0.05,
                    wobbleAmp: 1.8,
                    wobblePhase: Math.random() * Math.PI * 2,
                    alpha: 0.75,
                    isTemporary: true
                });
            }
            return;
        }

        if (currentTheme === 'mario') {
            // Mario: Leaping Gold Coin Shower
            const count = linesCleared >= 4 ? 35 : linesCleared * 10;
            for (let i = 0; i < count; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
                const spd = Math.random() * 7 + 4;
                this.marioCoins.push({
                    x: cx + (Math.random() - 0.5) * 80,
                    y: cy + (Math.random() - 0.5) * 40,
                    speedX: Math.cos(angle) * spd,
                    speedY: Math.sin(angle) * spd,
                    gravity: 0.22,
                    phase: Math.random() * Math.PI * 2,
                    rotSpeed: 0.18,
                    scale: 1.15,
                    alpha: 1.0,
                    isBurst: true
                });
            }
            if (linesCleared >= 4) {
                // Multicolored jumping Super Stars
                const starColors = ['#fcd800', '#00e000', '#00d0ff', '#ff3838', '#ff99ff'];
                for (let i = 0; i < 22; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = Math.random() * 8 + 3;
                    this.marioStars.push({
                        x: cx,
                        y: cy,
                        speedX: Math.cos(angle) * spd,
                        speedY: Math.sin(angle) * spd,
                        rot: 0,
                        rotSpeed: (Math.random() - 0.5) * 0.2,
                        size: Math.random() * 10 + 9,
                        color: starColors[i % starColors.length],
                        alpha: 1.0
                    });
                }
            }
            return;
        }

        const count = linesCleared >= 4 ? 70 : linesCleared * 18;
        const speed = linesCleared >= 4 ? 9 : 4.5;

        // Trigger 3D Background Tetromino Glitch Effect (Ultra-short & snappy burst)
        if (linesCleared >= 4) {
            this.glitchTimer = 12; // ~200ms snappy glitch
        } else if (linesCleared >= 2) {
            this.glitchTimer = 6;  // ~100ms micro glitch
        }

        // Add exploding particles
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const pSpeed = (Math.random() * 0.85 + 0.15) * speed;
            const pColor = currentTheme === 'spooky' 
                ? (Math.random() > 0.5 ? '#ff7518' : '#39ff14')
                : (Math.random() > 0.5 ? '#ff007f' : '#00ffff');
            this.particles.push({
                x: cx,
                y: cy,
                size: Math.random() * 3.5 + 2,
                speedX: Math.cos(angle) * pSpeed,
                speedY: Math.sin(angle) * pSpeed,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.01,
                isBurst: true,
                color: pColor
            });
        }
    }

    setHueShift(degrees) {
        this.hueShift = degrees;
        this._sunGradCacheKey = null;
    }

    // Helper to rotate and project a 3D vertex to 2D
    project3D(vx, vy, vz, shape) {
        let x = vx * shape.scale;
        let y = vy * shape.scale;
        let z = vz * shape.scale;

        // Rotate X
        let cosX = Math.cos(shape.rotX), sinX = Math.sin(shape.rotX);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;

        // Rotate Y
        let cosY = Math.cos(shape.rotY), sinY = Math.sin(shape.rotY);
        let x2 = x * cosY + z1 * sinY;
        let z2 = -x * sinY + z1 * cosY;

        // Rotate Z
        let cosZ = Math.cos(shape.rotZ), sinZ = Math.sin(shape.rotZ);
        let x3 = x2 * cosZ - y1 * sinZ;
        let y3 = x2 * sinZ + y1 * cosZ;

        // Translate
        let finalX = x3 + shape.x;
        let finalY = y3 + shape.y;
        let finalZ = z2 + shape.z;

        // 2D Perspective Projection
        let fov = 400;
        let scale = fov / (fov + finalZ);
        let screenX = window.innerWidth / 2 + finalX * scale;
        let screenY = window.innerHeight / 2 + finalY * scale;

        return { x: screenX, y: screenY, scale: scale };
    }

    drawWireCube(cx, cy, cz, shape) {
        const hs = 0.45; // half cube size
        const vertices = [
            [-hs,-hs,-hs], [hs,-hs,-hs], [hs,hs,-hs], [-hs,hs,-hs],
            [-hs,-hs, hs], [hs,-hs, hs], [hs,hs, hs], [-hs,hs, hs]
        ];
        const projected = vertices.map(v => this.project3D(cx + v[0], cy + v[1], cz + v[2], shape));

        const edges = [
            [0,1],[1,2],[2,3],[3,0], // back
            [4,5],[5,6],[6,7],[7,4], // front
            [0,4],[1,5],[2,6],[3,7]  // connecting
        ];

        // Draw translucent face fill
        this.ctx.beginPath();
        this.ctx.moveTo(projected[4].x, projected[4].y);
        this.ctx.lineTo(projected[5].x, projected[5].y);
        this.ctx.lineTo(projected[6].x, projected[6].y);
        this.ctx.lineTo(projected[7].x, projected[7].y);
        this.ctx.closePath();
        this.ctx.fillStyle = shape.color;
        this.ctx.globalAlpha *= 0.18;
        this.ctx.fill();
        this.ctx.globalAlpha /= 0.18;

        // Draw crisp 3D wireframe edges
        this.ctx.beginPath();
        edges.forEach(([i, j]) => {
            this.ctx.moveTo(projected[i].x, projected[i].y);
            this.ctx.lineTo(projected[j].x, projected[j].y);
        });
        this.ctx.stroke();
    }

    animate() {
        const currentTheme = document.body.getAttribute('data-theme') || 'modern';
        const isCyberpunk = currentTheme === 'cyberpunk';
        const isNES = currentTheme === 'nes';
        const isNebula = currentTheme === 'nebula';
        const isZen = currentTheme === 'zen';
        const isOcean = currentTheme === 'ocean';
        const isSpooky = currentTheme === 'spooky';
        const isMario = currentTheme === 'mario';

        const w = window.innerWidth;
        const h = window.innerHeight;
        this.ctx.clearRect(0, 0, w, h);
        const now = Date.now() * 0.001;

        if (isCyberpunk) {
            this.drawCyberCity(this.ctx, w, h, now);
            requestAnimationFrame(this._boundAnimate);
            return;
        }

        if (isZen) {
            // Warm Sandstone / Zen Garden Background
            const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#1c150c');
            bgGrad.addColorStop(1, '#100c07');
            this.ctx.fillStyle = bgGrad;
            this.ctx.fillRect(0, 0, w, h);

            // Subtle sand ripple texture waves
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(201, 162, 39, 0.04)';
            this.ctx.lineWidth = 1.5;
            for (let y = 60; y < h; y += 75) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                for (let x = 0; x <= w; x += 100) {
                    const waveY = y + Math.sin(x * 0.015 + y * 0.01 + now * 0.2) * 12;
                    this.ctx.lineTo(x, waveY);
                }
                this.ctx.stroke();
            }
            this.ctx.restore();

            // Animate and draw falling Zen Leaves
            for (let i = this.zenLeaves.length - 1; i >= 0; i--) {
                const leaf = this.zenLeaves[i];
                leaf.y += leaf.speedY;
                leaf.x += Math.sin(leaf.swayPhase) * leaf.swayAmp;
                leaf.swayPhase += leaf.swaySpeed;
                leaf.angle += leaf.rotSpeed;

                if (leaf.y > h + 30) {
                    if (leaf.isTemporary) {
                        this.zenLeaves.splice(i, 1);
                        continue;
                    }
                    leaf.y = -20;
                    leaf.x = Math.random() * w;
                }
                if (leaf.x < -30) leaf.x = w + 20;
                if (leaf.x > w + 30) leaf.x = -20;

                this.ctx.save();
                this.ctx.translate(leaf.x, leaf.y);
                this.ctx.rotate(leaf.angle);
                this.ctx.fillStyle = leaf.color;
                this.ctx.globalAlpha = leaf.alpha;

                // Organic curved leaf shape
                this.ctx.beginPath();
                this.ctx.moveTo(0, -leaf.len * 0.5);
                this.ctx.quadraticCurveTo(leaf.width, 0, 0, leaf.len * 0.5);
                this.ctx.quadraticCurveTo(-leaf.width, 0, 0, -leaf.len * 0.5);
                this.ctx.fill();

                // Leaf center vein
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -leaf.len * 0.45);
                this.ctx.lineTo(0, leaf.len * 0.45);
                this.ctx.stroke();

                this.ctx.restore();
            }

            requestAnimationFrame(this._boundAnimate);
            return;
        }

        if (isOcean) {
            // Deep Ocean Abyss Gradient
            const oceanGrad = this.ctx.createLinearGradient(0, 0, 0, h);
            oceanGrad.addColorStop(0, '#041d3a');
            oceanGrad.addColorStop(0.4, '#031326');
            oceanGrad.addColorStop(1, '#010814');
            this.ctx.fillStyle = oceanGrad;
            this.ctx.fillRect(0, 0, w, h);

            // Shimmering underwater sunbeam caustics from surface
            this.ctx.save();
            const rayCount = 5;
            for (let i = 0; i < rayCount; i++) {
                const rx = (w * 0.2) + (i * (w * 0.18)) + Math.sin(now * 0.35 + i) * 45;
                const rGrad = this.ctx.createLinearGradient(rx, 0, rx + 80, h * 0.85);
                rGrad.addColorStop(0, 'rgba(34, 211, 238, 0.14)');
                rGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.04)');
                rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = rGrad;
                this.ctx.beginPath();
                this.ctx.moveTo(rx - 30, 0);
                this.ctx.lineTo(rx + 30, 0);
                this.ctx.lineTo(rx + 160, h * 0.85);
                this.ctx.lineTo(rx + 70, h * 0.85);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.restore();

            // Animate and draw rising Ocean Bubbles
            for (let i = this.oceanBubbles.length - 1; i >= 0; i--) {
                const b = this.oceanBubbles[i];
                b.y -= b.speedY;
                b.x += Math.sin(b.wobblePhase) * b.wobbleAmp;
                b.wobblePhase += b.wobbleSpeed;

                if (b.y < -20) {
                    if (b.isTemporary) {
                        this.oceanBubbles.splice(i, 1);
                        continue;
                    }
                    b.y = h + 20;
                    b.x = Math.random() * w;
                }
                if (b.x < -20) b.x = w + 10;
                if (b.x > w + 20) b.x = -10;

                this.ctx.save();
                this.ctx.globalAlpha = b.alpha;

                // Bubble outer translucent body
                this.ctx.fillStyle = 'rgba(34, 211, 238, 0.18)';
                this.ctx.strokeStyle = 'rgba(103, 232, 249, 0.65)';
                this.ctx.lineWidth = 1.2;
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Specular reflection highlight on top-left of bubble
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                this.ctx.beginPath();
                this.ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(1, b.r * 0.28), 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.restore();
            }

            requestAnimationFrame(this._boundAnimate);
            return;
        }

        if (isSpooky) {
            // Eerie Crypt Night Gradient
            const spookyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
            spookyGrad.addColorStop(0, '#0a0512');
            spookyGrad.addColorStop(0.6, '#14081e');
            spookyGrad.addColorStop(1, '#050208');
            this.ctx.fillStyle = spookyGrad;
            this.ctx.fillRect(0, 0, w, h);

            // Rolling misty ground fog banks
            for (let m of this.spookyMist) {
                m.x += m.speedX;
                if (m.x < -m.r) m.x = w + m.r;
                if (m.x > w + m.r) m.x = -m.r;

                const fogGrad = this.ctx.createRadialGradient(m.x, m.y, 20, m.x, m.y, m.r);
                fogGrad.addColorStop(0, `rgba(200, 160, 240, ${m.alpha})`);
                fogGrad.addColorStop(0.6, `rgba(120, 60, 180, ${m.alpha * 0.4})`);
                fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = fogGrad;
                this.ctx.beginPath();
                this.ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Animate flying bat silhouettes across the moonlit sky
            for (let bat of this.spookyBats) {
                bat.x += bat.speedX;
                bat.wingPhase += bat.wingSpeed;
                bat.y += Math.sin(bat.wingPhase * 0.5) * 1.2;

                if (bat.x < -60) {
                    bat.x = w + 40;
                    bat.y = Math.random() * (h * 0.55);
                }

                this.ctx.save();
                this.ctx.translate(bat.x, bat.y);
                this.ctx.scale(bat.scale, bat.scale);

                const wingFlap = Math.sin(bat.wingPhase) * 12;

                // Bat body & ears
                this.ctx.fillStyle = '#12051a';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Bat Wings
                this.ctx.beginPath();
                // Left wing
                this.ctx.moveTo(0, -2);
                this.ctx.quadraticCurveTo(-12, -10 + wingFlap, -22, -2 + wingFlap * 0.7);
                this.ctx.quadraticCurveTo(-14, 4, 0, 4);
                // Right wing
                this.ctx.moveTo(0, -2);
                this.ctx.quadraticCurveTo(12, -10 + wingFlap, 22, -2 + wingFlap * 0.7);
                this.ctx.quadraticCurveTo(14, 4, 0, 4);
                this.ctx.fill();

                // Eerie glowing pumpkin eyes
                this.ctx.fillStyle = '#ff7518';
                this.ctx.fillRect(-2, -4, 1.2, 1.2);
                this.ctx.fillRect(1, -4, 1.2, 1.2);

                this.ctx.restore();
            }

            // Subtle eerie ember dust particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                if (p.isBurst) {
                    p.x += p.speedX;
                    p.y += p.speedY;
                    p.speedX *= 0.96;
                    p.speedY *= 0.96;
                    p.alpha -= p.decay;
                    if (p.alpha <= 0) {
                        this.particles.splice(i, 1);
                        continue;
                    }
                } else {
                    p.y -= p.speedY * 0.6;
                    p.x += Math.sin(now + p.y * 0.02) * 0.4;
                    if (p.y < 0) p.y = h;
                    if (p.x < 0) p.x = w;
                    if (p.x > w) p.x = 0;
                    p.alpha = 0.35 + Math.sin(p.pulseAngle) * 0.2;
                }
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.fillStyle = p.color || '#ff7518';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            requestAnimationFrame(this._boundAnimate);
            return;
        }

        if (isMario) {
            // Super Mario Mushroom Kingdom Retro Dusk Sky
            const marioSky = this.ctx.createLinearGradient(0, 0, 0, h);
            marioSky.addColorStop(0, '#09162c');
            marioSky.addColorStop(0.55, '#103058');
            marioSky.addColorStop(1, '#18467d');
            this.ctx.fillStyle = marioSky;
            this.ctx.fillRect(0, 0, w, h);

            // Horizon hills & Mario bushes
            this.drawMarioHills(this.ctx, w, h);

            // Animate and draw Mario Clouds
            for (let cloud of this.marioClouds) {
                cloud.x += cloud.speedX;
                if (cloud.x < -120 * cloud.scale) {
                    cloud.x = w + 120 * cloud.scale;
                    cloud.y = Math.random() * (h * 0.45);
                }
                this.drawMarioCloud(this.ctx, cloud.x, cloud.y, cloud.scale);
            }

            // Animate and draw Mario Coins (ambient & bursting)
            for (let i = this.marioCoins.length - 1; i >= 0; i--) {
                const coin = this.marioCoins[i];
                coin.phase += coin.rotSpeed;

                if (coin.isBurst) {
                    coin.x += coin.speedX;
                    coin.y += coin.speedY;
                    coin.speedY += coin.gravity;
                    coin.alpha -= 0.015;
                    if (coin.alpha <= 0 || coin.y > h + 50) {
                        this.marioCoins.splice(i, 1);
                        continue;
                    }
                } else {
                    coin.bobPhase += 0.03;
                    coin.y += Math.sin(coin.bobPhase) * 0.4;
                    coin.x -= 0.2;
                    if (coin.x < -30) coin.x = w + 30;
                }

                this.drawMarioCoin(this.ctx, coin.x, coin.y, coin.scale, coin.phase, coin.alpha);
            }

            // Animate Super Stars
            for (let i = this.marioStars.length - 1; i >= 0; i--) {
                const s = this.marioStars[i];
                s.x += s.speedX;
                s.y += s.speedY;
                s.speedY += 0.15;
                s.rot += s.rotSpeed;
                s.alpha -= 0.018;

                if (s.alpha <= 0 || s.y > h + 50) {
                    this.marioStars.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.translate(s.x, s.y);
                this.ctx.rotate(s.rot);
                this.ctx.globalAlpha = Math.max(0, s.alpha);
                this.ctx.fillStyle = s.color;
                // Draw 5-point star
                this.ctx.beginPath();
                for (let pt = 0; pt < 5; pt++) {
                    this.ctx.lineTo(Math.cos((18 + pt * 72) * Math.PI / 180) * s.size, -Math.sin((18 + pt * 72) * Math.PI / 180) * s.size);
                    this.ctx.lineTo(Math.cos((54 + pt * 72) * Math.PI / 180) * (s.size * 0.48), -Math.sin((54 + pt * 72) * Math.PI / 180) * (s.size * 0.48));
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            }

            requestAnimationFrame(this._boundAnimate);
            return;
        }

        let isGlitching = this.glitchTimer > 0;
        if (isGlitching) {
            this.glitchTimer--;
        }

        if (isNES) {
            // NES 8-Bit Dark Retro Background (Deep Space with Vintage CRT Center Glow)
            this.ctx.fillStyle = '#050512';
            this.ctx.fillRect(0, 0, w, h);

            // Vintage NES Center CRT Arcade Backlight
            const nesGlow = this.ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.min(w, h) * 0.7);
            nesGlow.addColorStop(0, 'rgba(28, 28, 64, 0.45)');
            nesGlow.addColorStop(0.6, 'rgba(12, 12, 32, 0.25)');
            nesGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = nesGlow;
            this.ctx.fillRect(0, 0, w, h);
        } else if (isNebula) {
            // Cosmic Nebula Theme: Deep Violet Space with Pulsing Cloud Blobs
            this.ctx.fillStyle = '#0a0518';
            this.ctx.fillRect(0, 0, w, h);

            for (let b of this.nebulaBlobs) {
                b.x += b.speedX;
                b.y += b.speedY;

                if (b.x < -b.r) b.x = w + b.r;
                if (b.x > w + b.r) b.x = -b.r;
                if (b.y < -b.r) b.y = h + b.r;
                if (b.y > h + b.r) b.y = -b.r;

                b.pulseAngle += b.pulseSpeed;
                const currentR = b.r + Math.sin(b.pulseAngle) * 35;

                const blobGrad = this.ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, Math.max(20, currentR));
                blobGrad.addColorStop(0, b.color);
                blobGrad.addColorStop(0.65, b.color.replace(/[\d\.]+\)$/, '0.12)'));
                blobGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                this.ctx.fillStyle = blobGrad;
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, Math.max(20, currentR), 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            // Modern Theme: Aurora Glass Nebula Light Field
            this.ctx.fillStyle = '#090b16';
            this.ctx.fillRect(0, 0, w, h);

            // Aurora Blob 1 (Top-Left Electric Indigo Mesh)
            const auroraX1 = w * 0.3 + Math.sin(now * 0.35) * 80;
            const auroraY1 = h * 0.3 + Math.cos(now * 0.25) * 60;
            const grad1 = this.ctx.createRadialGradient(auroraX1, auroraY1, 40, auroraX1, auroraY1, Math.max(w, h) * 0.6);
            grad1.addColorStop(0, 'rgba(99, 102, 241, 0.32)');
            grad1.addColorStop(0.5, 'rgba(79, 70, 229, 0.14)');
            grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = grad1;
            this.ctx.fillRect(0, 0, w, h);

            // Aurora Blob 2 (Bottom-Right Radiant Cyan Mesh)
            const auroraX2 = w * 0.7 + Math.cos(now * 0.28) * 90;
            const auroraY2 = h * 0.7 + Math.sin(now * 0.38) * 70;
            const grad2 = this.ctx.createRadialGradient(auroraX2, auroraY2, 40, auroraX2, auroraY2, Math.max(w, h) * 0.6);
            grad2.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            grad2.addColorStop(0.5, 'rgba(56, 189, 248, 0.10)');
            grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = grad2;
            this.ctx.fillRect(0, 0, w, h);
        }

        // 2. Animate 3D Floating Wireframe Tetrominos
        const glitchColors = ['#ff00ff', '#00ffff', '#ffff00', '#ffffff', '#00ff66'];
        for (let shape of this.tetrominos3D) {
            shape.rotX += shape.speedRotX * (isGlitching ? 7 : 1);
            shape.rotY += shape.speedRotY * (isGlitching ? 7 : 1);
            shape.rotZ += shape.speedRotZ * (isGlitching ? 7 : 1);
            shape.y += shape.speedY;

            if (shape.y < -h * 0.7) shape.y = h * 0.7;
            if (shape.y > h * 0.7) shape.y = -h * 0.7;

            const origX = shape.x;
            const origY = shape.y;

            let drawColor = isNES ? (shape.color || '#00f0f0') : (shape.color || '#818cf8');
            if (isGlitching) {
                shape.x += (Math.random() - 0.5) * 45;
                shape.y += (Math.random() - 0.5) * 45;
                drawColor = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            }

            this.ctx.save();
            this.ctx.strokeStyle = drawColor;
            this.ctx.lineWidth = isGlitching ? 3.5 : (isNES ? 2.5 : 2.2);
            this.ctx.globalAlpha = isGlitching ? 0.9 : (isNES ? 0.7 : 0.55);

            shape.cubes.forEach(c => {
                this.drawWireCube(c[0], c[1], c[2], shape);
            });

            // RGB Chromatic Aberration extra pass on glitch
            if (isGlitching) {
                this.ctx.strokeStyle = Math.random() > 0.5 ? '#00ffff' : '#ff007f';
                shape.x += (Math.random() - 0.5) * 20;
                shape.cubes.forEach(c => {
                    this.drawWireCube(c[0], c[1], c[2], shape);
                });
            }

            this.ctx.restore();

            shape.x = origX;
            shape.y = origY;
        }

        // 3. Animate Floating Dust / Stars Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.isBurst) {
                p.x += p.speedX;
                p.y += p.speedY;
                p.speedX *= 0.96;
                p.speedY *= 0.96;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
            } else {
                p.y -= p.speedY;
                p.x += p.speedX;

                if (p.y < 0) p.y = h;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;

                p.pulseAngle += p.pulseSpeed;
                p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.2;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            if (isNES) {
                // Crisp 8-bit twinkling multi-color retro starfield pixels
                const nesColors = ['#f8e400', '#00e4e4', '#ffffff', '#f87800', '#00a800'];
                const starColor = nesColors[Math.abs(Math.floor(p.x + p.y)) % nesColors.length];
                this.ctx.fillStyle = starColor;
                this.ctx.fillRect(p.x, p.y, Math.max(2, p.size * 1.4), Math.max(2, p.size * 1.4));
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }
        requestAnimationFrame(this._boundAnimate);
    }
}

const backgroundFX = new BackgroundFX();
