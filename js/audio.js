class AudioDB {
    constructor() {
        this.dbName = 'TetrisAudioDB_v3';
        this.storeName = 'tracks';
        this.db = null;
    }
    
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2); // Version 2 to trigger upgrade
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Delete old store with wrong keyPath (id) and recreate with 'name'
                if (db.objectStoreNames.contains(this.storeName)) {
                    db.deleteObjectStore(this.storeName); 
                }
                db.createObjectStore(this.storeName, { keyPath: 'name' }); 
            };
        });
    }
    
    async saveTrack(file) {
        const buffer = await file.arrayBuffer();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const track = {
                name: file.name,
                type: file.type,
                data: buffer
            };
            store.put(track);
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    getAllTracks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result.map(t => {
                    const blob = new Blob([t.data], { type: t.type });
                    blob.name = t.name; 
                    return blob;
                });
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    deleteTrack(name) {
        return new Promise((resolve, reject) => {
            if (!name) return reject(new Error("Track name required for deletion"));
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            store.delete(name);
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        const savedSettings = (typeof Storage !== 'undefined') ? Storage.getSettings() : null;
        const initMusicVol = (savedSettings && savedSettings.musicVolume !== undefined) ? savedSettings.musicVolume : 80;
        this.volume = initMusicVol / 100;
        this.audio.volume = this.volume;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playMode = 0; // 0: Loop All, 1: Loop One, 2: Shuffle
        this.db = new AudioDB();
        this.currentObjectUrl = null; // Tracks the active blob URL so it can be revoked

        this.audio.addEventListener('ended', () => {
            this.playNext();
        });

        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.addFiles(e.dataTransfer.files);
            }
        });

        this.initDB();
    }

    setVolume(volPercent) {
        this.volume = Math.max(0, Math.min(1, volPercent / 100));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
    }

    // Centralizes object URL creation so the previous one is always revoked first,
    // preventing a memory leak from accumulating blob URLs on every track change.
    setAudioSource(file) {
        if (this.currentObjectUrl) {
            URL.revokeObjectURL(this.currentObjectUrl);
        }
        this.currentObjectUrl = URL.createObjectURL(file);
        this.audio.src = this.currentObjectUrl;
    }

    async initDB() {
        try {
            await this.db.init();
            const savedTracks = await this.db.getAllTracks();
            if (savedTracks.length > 0) {
                this.playlist = savedTracks;
                this.updatePlaylistUI();
                this.currentIndex = 0;
                this.updatePlayerUI();
                
                this.setAudioSource(this.playlist[0]);
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updatePlayerUI();
                }).catch(e => {
                    console.log("Autoplay blocked by browser. User interaction required.");
                });
            }
        } catch (e) {
            console.error("Failed to init Audio DB:", e);
        }
    }

    // Generates a non-colliding filename (e.g. "song (2).mp3")
    getUniqueName(name, existingNames) {
        if (!existingNames.has(name)) return name;
        const dotIdx = name.lastIndexOf('.');
        const base = dotIdx > 0 ? name.substring(0, dotIdx) : name;
        const ext = dotIdx > 0 ? name.substring(dotIdx) : '';
        let counter = 2;
        let candidate = `${base} (${counter})${ext}`;
        while (existingNames.has(candidate)) {
            counter++;
            candidate = `${base} (${counter})${ext}`;
        }
        return candidate;
    }

    async addFiles(fileList) {
        let added = 0;
        const existingNames = new Set(this.playlist.map(f => f.name));

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.type.startsWith('audio/')) {
                let fileToStore = file;
                const uniqueName = this.getUniqueName(file.name, existingNames);
                if (uniqueName !== file.name) {
                    fileToStore = new File([file], uniqueName, { type: file.type });
                }
                existingNames.add(fileToStore.name);

                try {
                    await this.db.saveTrack(fileToStore);
                } catch(e) {
                    console.error("Failed to save track to DB:", e);
                }
                this.playlist.push(fileToStore);
                added++;
            }
        }
        
        if (added > 0) {
            this.updatePlaylistUI();
            if (this.playlist.length === added && !this.isPlaying) {
                this.playIndex(0);
            }
        }
    }

    playIndex(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const file = this.playlist[index];

        this.setAudioSource(file);
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayerUI();
            this.updatePlaylistUI();
        }).catch(e => console.error("Audio playback error:", e));
    }

    togglePlayPause() {
        if (this.playlist.length === 0) return;
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            if (!this.audio.src) {
                this.setAudioSource(this.playlist[this.currentIndex]);
            }
            this.audio.play();
            this.isPlaying = true;
        }
        this.updatePlayerUI();
    }

    toggleMode() {
        this.playMode = (this.playMode + 1) % 3;
        this.updatePlayerUI();
    }

    playNext() {
        if (this.playlist.length === 0) return;
        
        if (this.playMode === 1 || this.playlist.length === 1) {
            // Loop One or single track -> restart song
            this.audio.currentTime = 0;
            this.audio.play().catch(e => console.error(e));
            this.isPlaying = true;
            this.updatePlayerUI();
            return;
        }

        let nextIndex;
        if (this.playMode === 2) {
            // Shuffle
            nextIndex = Math.floor(Math.random() * this.playlist.length);
            if (nextIndex === this.currentIndex && this.playlist.length > 1) {
                nextIndex = (nextIndex + 1) % this.playlist.length;
            }
        } else {
            // Loop All
            nextIndex = this.currentIndex + 1;
            if (nextIndex >= this.playlist.length) {
                nextIndex = 0; 
            }
        }
        this.playIndex(nextIndex);
    }

    playPrev() {
        if (this.playlist.length === 0) return;
        
        if (this.playMode === 1 || this.playlist.length === 1 || this.audio.currentTime > 3) {
            // If Loop One, single track, or playing for >3s -> restart song
            this.audio.currentTime = 0;
            this.audio.play().catch(e => console.error(e));
            this.isPlaying = true;
            this.updatePlayerUI();
            return;
        }

        let prevIndex;
        if (this.playMode === 2) {
            // Shuffle
            prevIndex = Math.floor(Math.random() * this.playlist.length);
            if (prevIndex === this.currentIndex && this.playlist.length > 1) {
                prevIndex = (prevIndex - 1 + this.playlist.length) % this.playlist.length;
            }
        } else {
            // Loop All
            prevIndex = this.currentIndex - 1;
            if (prevIndex < 0) {
                prevIndex = this.playlist.length - 1; 
            }
        }
        this.playIndex(prevIndex);
    }

    updatePlayerUI() {
        const titleEls = document.querySelectorAll('.now-playing-title');
        const playBtns = document.querySelectorAll('.btn-player-playpause');
        const modeBtns = document.querySelectorAll('.btn-player-mode');
        
        let modeIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
        let modeTitle = 'Loop All';
        if (this.playMode === 1) { 
            modeIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>'; 
            modeTitle = 'Loop One'; 
        }
        if (this.playMode === 2) { 
            modeIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>'; 
            modeTitle = 'Shuffle'; 
        }
        
        titleEls.forEach(titleEl => {
            if (this.playlist.length > 0) {
                titleEl.innerText = this.playlist[this.currentIndex].name || "Unknown Track";
            } else {
                titleEl.innerText = "No Song";
            }
        });
        
        playBtns.forEach(playBtn => {
            playBtn.innerHTML = this.isPlaying 
                ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            playBtn.title = this.isPlaying ? "Pause" : "Play";
        });
        
        modeBtns.forEach(modeBtn => {
            modeBtn.innerHTML = modeIcon;
            modeBtn.title = modeTitle;
        });
    }

    updatePlaylistUI() {
        const listEl = document.getElementById('playlist-container');
        if (!listEl) return;
        listEl.innerHTML = '';
        
        this.playlist.forEach((file, idx) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            
            const nameSpan = document.createElement('span');
            nameSpan.innerText = file.name || "Unknown Track";
            nameSpan.style.flexGrow = '1';
            
            const removeBtn = document.createElement('span');
            removeBtn.innerText = '❌';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.marginLeft = '10px';
            removeBtn.style.fontSize = '0.8rem';
            removeBtn.title = "Remove Song";
            
            if (idx === this.currentIndex) {
                li.classList.add('playing');
            }
            
            nameSpan.addEventListener('click', () => {
                this.playIndex(idx);
            });
            
            removeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.removeTrack(idx);
            });
            
            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            listEl.appendChild(li);
        });
    }

    async removeTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        const file = this.playlist[index];
        
        try {
            await this.db.deleteTrack(file.name);
        } catch(e) {
            console.error("Failed to delete track", e);
        }
        
        this.playlist.splice(index, 1);
        
        if (this.currentIndex === index) {
            this.audio.pause();
            this.isPlaying = false;
            if (this.playlist.length > 0) {
                this.playIndex(index >= this.playlist.length ? 0 : index);
            } else {
                if (this.currentObjectUrl) {
                    URL.revokeObjectURL(this.currentObjectUrl);
                    this.currentObjectUrl = null;
                }
                this.audio.src = '';
                this.updatePlayerUI();
            }
        } else if (this.currentIndex > index) {
            this.currentIndex--;
        }
        
        this.updatePlaylistUI();
    }
}

const audioPlayer = new AudioPlayer();

class CyberSFX {
    constructor() {
        this.ctx = null;
        const savedSettings = (typeof Storage !== 'undefined') ? Storage.getSettings() : null;
        const initSFXVol = (savedSettings && savedSettings.sfxVolume !== undefined) ? savedSettings.sfxVolume : 80;
        this.volume = initSFXVol / 100;
    }

    init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(volPercent) {
        this.volume = Math.max(0, Math.min(1, volPercent / 100));
    }

    getTheme() {
        if (typeof document !== 'undefined' && document.body) {
            return document.body.getAttribute('data-theme') || 'modern';
        }
        return 'modern';
    }

    playMoveSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            // Authentic NES Tetris Move Sound (140Hz 25% duty pulse blip)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);
            gain.gain.setValueAtTime(0.14 * this.volume, now);
            gain.gain.setValueAtTime(0.001, now + 0.018);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.018);
        } else if (theme === 'zen') {
            // Warm Bamboo/Woodblock "tok"
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(460, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.022);
            gain.gain.setValueAtTime(0.13 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.022);
        } else if (theme === 'ocean') {
            // Rising water droplet "bloop"
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(620, now + 0.025);
            gain.gain.setValueAtTime(0.09 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.025);
        } else if (theme === 'spooky') {
            // Dry bone snap / twig click
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(750, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.015);
            gain.gain.setValueAtTime(0.10 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.015);
        } else {
            // Soft click for Modern/Cyberpunk/Nebula
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            gain.gain.setValueAtTime(0.04 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.015);
        }
    }

    playRotateSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            // Authentic NES Tetris Rotate Sound (E4 330Hz -> A4 440Hz pulse jump)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.setValueAtTime(440, now + 0.02);
            gain.gain.setValueAtTime(0.16 * this.volume, now);
            gain.gain.setValueAtTime(0.001, now + 0.045);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.045);
        } else if (theme === 'zen') {
            // Bamboo pivot "clack"
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(540, now);
            osc.frequency.exponentialRampToValueAtTime(720, now + 0.035);
            gain.gain.setValueAtTime(0.13 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.035);
        } else if (theme === 'ocean') {
            // Swirling water bubble roll
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.linearRampToValueAtTime(820, now + 0.02);
            osc.frequency.exponentialRampToValueAtTime(680, now + 0.04);
            gain.gain.setValueAtTime(0.10 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (theme === 'spooky') {
            // Spectral flutter / bat wing flick
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);
            gain.gain.setValueAtTime(0.11 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.045);
        } else {
            // Modern/Cyberpunk rotate blip
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.03);
            gain.gain.setValueAtTime(0.06 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.03);
        }
    }

    playHoldSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            // Authentic 8-bit hold cue: quick ascending dual pulse
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(262, now);
            osc.frequency.setValueAtTime(392, now + 0.025);
            gain.gain.setValueAtTime(0.15 * this.volume, now);
            gain.gain.setValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (theme === 'zen') {
            // Resonant singing bowl / soft metallic gong chime
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(528, now + 0.08);
            gain.gain.setValueAtTime(0.16 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (theme === 'ocean') {
            // Deep resonant sonar ping
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
            gain.gain.setValueAtTime(0.12 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (theme === 'spooky') {
            // Eerie hollow bell
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(310, now + 0.07);
            gain.gain.setValueAtTime(0.14 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        } else {
            // Futuristic hold shimmer (Modern/Cyberpunk/Nebula)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.exponentialRampToValueAtTime(720, now + 0.04);
            gain.gain.setValueAtTime(0.08 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }

    playDropSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            // Authentic NES Tetris Soft Drop / Lock Click (95Hz square)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(95, now);
            gain.gain.setValueAtTime(0.15 * this.volume, now);
            gain.gain.setValueAtTime(0.001, now + 0.022);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.022);
        } else if (theme === 'zen') {
            // Wood block tap
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(210, now);
            osc.frequency.exponentialRampToValueAtTime(95, now + 0.035);
            gain.gain.setValueAtTime(0.15 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.035);
        } else if (theme === 'ocean') {
            // Submerged bubble pop
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);
            gain.gain.setValueAtTime(0.12 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (theme === 'spooky') {
            // Coffin knock
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.04);
            gain.gain.setValueAtTime(0.16 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        } else {
            // Modern/Cyberpunk land thud
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);
            gain.gain.setValueAtTime(0.08 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        }
    }

    playHardDropSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            // Authentic NES 8-bit Hard Drop Sweep (380Hz -> 70Hz)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.045);
            gain.gain.setValueAtTime(0.18 * this.volume, now);
            gain.gain.setValueAtTime(0.001, now + 0.045);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.045);
        } else if (theme === 'zen') {
            // Heavy timber impact
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.055);
            gain.gain.setValueAtTime(0.19 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.055);
        } else if (theme === 'ocean') {
            // Deep underwater plunge
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);
            gain.gain.setValueAtTime(0.17 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (theme === 'spooky') {
            // Dungeon door slam / lightning impact
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.065);
            gain.gain.setValueAtTime(0.20 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.065);
        } else {
            // Modern hard drop
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
            gain.gain.setValueAtTime(0.12 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }

    playScoreSound(linesCleared, isB2B = false) {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            // Authentic NES Tetris Line Clear Sound Effects
            const vol = 0.22 * this.volume;
            if (linesCleared === 1) {
                // 1 Line: G4 -> C5
                const notes = [392.00, 523.25];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now + i * 0.035);
                    gain.gain.setValueAtTime(vol, now + i * 0.035);
                    const dur = i === 1 ? 0.06 : 0.03;
                    gain.gain.setValueAtTime(0.001, now + i * 0.035 + dur);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.035);
                    osc.stop(now + i * 0.035 + dur);
                });
            } else if (linesCleared === 2) {
                // 2 Lines: G4 -> C5 -> E5
                const notes = [392.00, 523.25, 659.25];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now + i * 0.03);
                    gain.gain.setValueAtTime(vol, now + i * 0.03);
                    const dur = i === 2 ? 0.07 : 0.028;
                    gain.gain.setValueAtTime(0.001, now + i * 0.03 + dur);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.03);
                    osc.stop(now + i * 0.03 + dur);
                });
            } else if (linesCleared === 3) {
                // 3 Lines: G4 -> C5 -> E5 -> G5
                const notes = [392.00, 523.25, 659.25, 783.99];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now + i * 0.028);
                    gain.gain.setValueAtTime(vol, now + i * 0.028);
                    const dur = i === 3 ? 0.08 : 0.026;
                    gain.gain.setValueAtTime(0.001, now + i * 0.028 + dur);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.028);
                    osc.stop(now + i * 0.028 + dur);
                });
            } else if (linesCleared >= 4) {
                // TETRIS (4 Lines): Famous NES Tetris 2-Part Harmony Fanfare!
                // Dual Voice 3rds/Harmonies:
                const voice1 = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                const voice2 = [659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
                const stepDur = 0.055;

                voice1.forEach((f1, i) => {
                    const f2 = voice2[i];
                    const startTime = now + i * stepDur;
                    const isLast = i === voice1.length - 1;
                    const dur = isLast ? 0.28 : stepDur * 0.95;

                    // Voice 1
                    const osc1 = this.ctx.createOscillator();
                    const gain1 = this.ctx.createGain();
                    osc1.type = 'square';
                    osc1.frequency.setValueAtTime(f1, startTime);
                    gain1.gain.setValueAtTime(vol * 0.9, startTime);
                    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
                    osc1.connect(gain1);
                    gain1.connect(this.ctx.destination);
                    osc1.start(startTime);
                    osc1.stop(startTime + dur);

                    // Voice 2
                    const osc2 = this.ctx.createOscillator();
                    const gain2 = this.ctx.createGain();
                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(f2, startTime);
                    gain2.gain.setValueAtTime(vol * 0.9, startTime);
                    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
                    osc2.connect(gain2);
                    gain2.connect(this.ctx.destination);
                    osc2.start(startTime);
                    osc2.stop(startTime + dur);
                });

                // NES Triangle Bass Line (C3 -> E3 -> G3 -> C4 -> C4)
                const bassNotes = [130.81, 164.81, 196.00, 261.63, 261.63];
                bassNotes.forEach((freq, i) => {
                    const bOsc = this.ctx.createOscillator();
                    const bGain = this.ctx.createGain();
                    bOsc.type = 'triangle';
                    bOsc.frequency.setValueAtTime(freq, now + i * 0.065);
                    bGain.gain.setValueAtTime(vol * 1.4, now + i * 0.065);
                    const dur = i === bassNotes.length - 1 ? 0.25 : 0.06;
                    bGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + dur);
                    bOsc.connect(bGain);
                    bGain.connect(this.ctx.destination);
                    bOsc.start(now + i * 0.065);
                    bOsc.stop(now + i * 0.065 + dur);
                });
            }
            return;
        }

        if (theme === 'zen') {
            const vol = 0.20 * this.volume;
            if (linesCleared === 1) {
                // Kalimba tone: G4 -> C5
                const notes = [392.00, 523.25];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(vol, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.35);
                });
            } else if (linesCleared === 2) {
                // Bamboo Chime chord: C5 + E5 + G5
                const notes = [523.25, 659.25, 783.99];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.06);
                    gain.gain.setValueAtTime(vol * 0.9, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.45);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.45);
                });
            } else if (linesCleared === 3) {
                // Meditative Kalimba Pentatonic: C5 -> D5 -> G5 -> C6
                const notes = [523.25, 587.33, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.05);
                    gain.gain.setValueAtTime(vol * 0.9, now + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.55);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.05);
                    osc.stop(now + i * 0.05 + 0.55);
                });
            } else if (linesCleared >= 4) {
                // Zen Temple Singing Bowl / Bell Chime (Rich warm harmonics)
                const harmonics = [261.63, 523.25, 783.99, 1046.50, 1318.51];
                harmonics.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    const hVol = (vol * 1.1) / (idx + 1);
                    gain.gain.setValueAtTime(hVol, now);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 1.8);
                });
            }
            return;
        }

        if (theme === 'ocean') {
            const vol = 0.18 * this.volume;
            if (linesCleared < 4) {
                // Rising aquatic bubble cascade
                const count = linesCleared * 3 + 2;
                for (let i = 0; i < count; i++) {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    const startFreq = 400 + Math.random() * 300 + i * 80;
                    osc.frequency.setValueAtTime(startFreq, now + i * 0.04);
                    osc.frequency.exponentialRampToValueAtTime(startFreq + 280, now + i * 0.04 + 0.06);
                    gain.gain.setValueAtTime(vol * 0.8, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.06);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 0.06);
                }
            } else {
                // Grand Coral Reef Chime & Bioluminescent Bell Chord
                const chord = [349.23, 440.00, 523.25, 698.46, 880.00, 1046.50];
                chord.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.04);
                    gain.gain.setValueAtTime(vol * 0.9, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 1.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 1.2);
                });
            }
            return;
        }

        if (theme === 'spooky') {
            const vol = 0.20 * this.volume;
            if (linesCleared === 1) {
                // Eerie diminished interval (D4 -> Ab4)
                const notes = [293.66, 415.30];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + i * 0.06);
                    gain.gain.setValueAtTime(vol * 0.7, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.35);
                });
            } else if (linesCleared === 2) {
                // Spooky minor progression (D4 -> F4 -> Bb4)
                const notes = [293.66, 349.23, 466.16];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + i * 0.05);
                    gain.gain.setValueAtTime(vol * 0.7, now + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.05);
                    osc.stop(now + i * 0.05 + 0.4);
                });
            } else if (linesCleared === 3) {
                // Ghostly Theremin sweep
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(293.66, now);
                osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);
                osc.frequency.exponentialRampToValueAtTime(415.30, now + 0.35);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (linesCleared >= 4) {
                // Haunted Church Bell Toll & Gothic Pipe Organ Chord (D Minor: D3, F3, A3, D4)
                const organNotes = [146.83, 174.61, 220.00, 293.66, 349.23];
                organNotes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(vol * 0.75, now);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 1.4);
                });
            }
            return;
        }

        // Cyberpunk / Modern theme playScoreSound
        const volMultiplier = this.volume;
        const masterGain = this.ctx.createGain();
        const baseVol = (linesCleared >= 4 ? 0.18 : 0.08) * volMultiplier;
        const duration = linesCleared >= 4 ? 0.4 : linesCleared === 3 ? 0.25 : 0.15;

        masterGain.gain.setValueAtTime(baseVol, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(linesCleared >= 4 ? 2200 : 1600, now);
        filter.Q.setValueAtTime(1.2, now);

        masterGain.connect(filter);
        filter.connect(this.ctx.destination);

        if (linesCleared < 4) {
            const osc = this.ctx.createOscillator();
            osc.type = 'square';
            const startFreq = linesCleared === 1 ? 900 : linesCleared === 2 ? 1400 : 1800;
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.setValueAtTime(startFreq * 1.4, now + 0.025);
            osc.frequency.setValueAtTime(startFreq * 0.7, now + 0.055);
            if (linesCleared >= 2) {
                osc.frequency.setValueAtTime(startFreq * 2.1, now + 0.085);
            }
            if (linesCleared === 3) {
                osc.frequency.setValueAtTime(startFreq * 0.4, now + 0.12);
                osc.frequency.setValueAtTime(startFreq * 2.6, now + 0.16);
            }

            osc.start(now);
            osc.stop(now + duration);
            osc.connect(masterGain);
        } else {
            const bassOsc = this.ctx.createOscillator();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(isB2B ? 180 : 130, now);
            bassOsc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
            
            const bassGain = this.ctx.createGain();
            bassGain.gain.setValueAtTime(0.25 * volMultiplier, now);
            bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            
            bassOsc.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.35);

            const glitchOsc = this.ctx.createOscillator();
            glitchOsc.type = 'square';
            const glitchSteps = [2200, 1100, 3300, 880, 4400, 1600, 5000, 750];
            glitchSteps.forEach((f, i) => {
                glitchOsc.frequency.setValueAtTime(isB2B ? f * 1.25 : f, now + (i * 0.035));
            });

            glitchOsc.start(now);
            glitchOsc.stop(now + duration);
            glitchOsc.connect(masterGain);
        }
    }

    playLevelUpSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + i * 0.05);
                gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.05);
                const dur = i === notes.length - 1 ? 0.2 : 0.045;
                gain.gain.setValueAtTime(0.001, now + i * 0.05 + dur);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + dur);
            });
        } else {
            this.playScoreSound(4, true);
        }
    }

    playGameOverSound() {
        this.init();
        if (!this.ctx || this.volume <= 0) return;
        const theme = this.getTheme();
        const now = this.ctx.currentTime;

        if (theme === 'nes') {
            const notes = [523.25, 493.88, 466.16, 440.00, 415.30, 392.00, 311.13, 261.63];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);
                gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.07);
                const dur = i === notes.length - 1 ? 0.35 : 0.065;
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + dur);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.07);
                osc.stop(now + i * 0.07 + dur);
            });
        } else {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
            gain.gain.setValueAtTime(0.2 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    }
}
const cyberSFX = new CyberSFX();
