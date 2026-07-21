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
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playMode = 0; // 0: Loop All, 1: Loop One, 2: Shuffle
        this.db = new AudioDB();

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

    async initDB() {
        try {
            await this.db.init();
            const savedTracks = await this.db.getAllTracks();
            if (savedTracks.length > 0) {
                this.playlist = savedTracks;
                this.updatePlaylistUI();
                this.currentIndex = 0;
                this.updatePlayerUI();
                
                this.audio.src = URL.createObjectURL(this.playlist[0]);
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

    async addFiles(fileList) {
        let added = 0;
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.type.startsWith('audio/')) {
                try {
                    await this.db.saveTrack(file);
                } catch(e) {
                    console.error("Failed to save track to DB:", e);
                }
                this.playlist.push(file);
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
        const url = URL.createObjectURL(file);
        
        this.audio.src = url;
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
                this.audio.src = URL.createObjectURL(this.playlist[this.currentIndex]);
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
        
        let modeIcon = '[ALL]';
        let modeTitle = 'Loop All';
        if (this.playMode === 1) { modeIcon = '[ONE]'; modeTitle = 'Loop One'; }
        if (this.playMode === 2) { modeIcon = '[RND]'; modeTitle = 'Shuffle'; }
        
        titleEls.forEach(titleEl => {
            if (this.playlist.length > 0) {
                titleEl.innerText = this.playlist[this.currentIndex].name || "Unknown Track";
            } else {
                titleEl.innerText = "No Song";
            }
        });
        
        playBtns.forEach(playBtn => {
            playBtn.innerText = this.isPlaying ? 'PAUSE' : 'PLAY';
        });
        
        modeBtns.forEach(modeBtn => {
            modeBtn.innerText = modeIcon;
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
