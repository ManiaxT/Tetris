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
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initParticles();
        this.init3DTetrominos();
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

    triggerScoreBurst(linesCleared) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
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
            this.particles.push({
                x: cx,
                y: cy,
                size: Math.random() * 3.5 + 2,
                speedX: Math.cos(angle) * pSpeed,
                speedY: Math.sin(angle) * pSpeed,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.01,
                isBurst: true,
                color: Math.random() > 0.5 ? '#ff007f' : '#00ffff'
            });
        }
    }

    setHueShift(degrees) {
        this.hueShift = degrees;
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
        const isCyberpunk = document.body.getAttribute('data-theme') === 'cyberpunk';
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.ctx.clearRect(0, 0, w, h);
        const now = Date.now() * 0.001;

        let isGlitching = this.glitchTimer > 0;
        if (isGlitching) {
            this.glitchTimer--;
        }

        if (isCyberpunk) {
            // 1. Sun & Laser Beams
            const sunX = w / 2;
            const sunY = h * 0.45;
            const sunRadius = Math.min(w, h) * 0.25;

            // Volumetric Sun Laser Rays (Fanning outwards)
            this.ctx.save();
            const rayCount = 12;
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2 + (now * 0.05);
                const rx = sunX + Math.cos(angle) * w;
                const ry = sunY + Math.sin(angle) * h;
                const rayGrad = this.ctx.createLinearGradient(sunX, sunY, rx, ry);
                rayGrad.addColorStop(0, `hsla(${(300 + this.hueShift) % 360}, 100%, 65%, 0.08)`);
                rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = rayGrad;
                this.ctx.beginPath();
                this.ctx.moveTo(sunX, sunY);
                this.ctx.arc(sunX, sunY, Math.max(w, h), angle - 0.08, angle + 0.08);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.restore();

            // Sun Outer Glow
            const sunGlow = this.ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.8);
            sunGlow.addColorStop(0, `hsla(${(320 + this.hueShift) % 360}, 100%, 65%, 0.35)`);
            sunGlow.addColorStop(0.5, `hsla(${(280 + this.hueShift) % 360}, 100%, 50%, 0.12)`);
            sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = sunGlow;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, sunRadius * 1.8, 0, Math.PI * 2);
            this.ctx.fill();

            // Sun Body Gradient
            const sunGrad = this.ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
            sunGrad.addColorStop(0, `hsl(${(50 + this.hueShift) % 360}, 100%, 60%)`);
            sunGrad.addColorStop(0.5, `hsl(${(340 + this.hueShift) % 360}, 100%, 55%)`);
            sunGrad.addColorStop(1, `hsl(${(280 + this.hueShift) % 360}, 100%, 45%)`);

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            this.ctx.clip();
            this.ctx.fillStyle = sunGrad;
            this.ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

            // Translucent Sun Horizontal Stripe Cuts
            const stripeCount = 9;
            const stripeGap = (sunRadius * 2) / (stripeCount * 1.6);
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            for (let i = 0; i < stripeCount; i++) {
                const stripeHeight = (i + 1) * 1.5;
                const stripeY = sunY + (i * stripeGap) - (sunRadius * 0.05);
                this.ctx.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, stripeHeight);
            }
            this.ctx.restore();
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

            let drawColor = isCyberpunk ? shape.color : 'rgba(255, 255, 255, 0.4)';
            if (isGlitching) {
                shape.x += (Math.random() - 0.5) * 45;
                shape.y += (Math.random() - 0.5) * 45;
                drawColor = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            }

            this.ctx.save();
            this.ctx.strokeStyle = drawColor;
            this.ctx.lineWidth = isGlitching ? 3.5 : (isCyberpunk ? 2.5 : 1.8);
            this.ctx.globalAlpha = isGlitching ? 0.9 : (isCyberpunk ? 0.6 : 0.25);
            this.ctx.shadowBlur = isGlitching ? 25 : (isCyberpunk ? 16 : 4);
            this.ctx.shadowColor = drawColor;

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

        // 3. Animate Bursts (Shockwaves)
        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const b = this.bursts[i];
            b.radius += (b.maxRadius - b.radius) * 0.08;
            b.alpha -= 0.02;

            if (b.alpha <= 0) {
                this.bursts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.strokeStyle = b.color;
            this.ctx.globalAlpha = b.alpha * 0.6;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 4. Animate Floating Particles & Binary Matrix Bits
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
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = isCyberpunk ? 8 : 4;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        requestAnimationFrame(() => this.animate());
    }
}

const backgroundFX = new BackgroundFX();
