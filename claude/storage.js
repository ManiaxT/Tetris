const Storage = {
    KEYS: {
        SCORES: 'tetris_scores',
        SETTINGS: 'tetris_settings'
    },
    
    DEFAULT_SETTINGS: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        softDrop: 'ArrowDown',
        hardDrop: 'Space',
        rotateCW: 'ArrowUp',
        rotateCCW: 'KeyZ',
        hold: 'KeyC',
        theme: 'modern',
        musicPlayPause: 'KeyP',
        musicMode: 'KeyM',
        musicPrev: 'Comma',
        musicNext: 'Period',
        sfxVolume: 80,
        musicVolume: 80
    },

    getSettings() {
        const stored = localStorage.getItem(this.KEYS.SETTINGS);
        if (stored) {
            try {
                return { ...this.DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch (e) {
                console.error('Corrupt settings data in localStorage, falling back to defaults:', e);
                return { ...this.DEFAULT_SETTINGS };
            }
        }
        return { ...this.DEFAULT_SETTINGS };
    },

    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    getScores() {
        const stored = localStorage.getItem(this.KEYS.SCORES);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Corrupt scores data in localStorage, resetting:', e);
                return [];
            }
        }
        return [];
    },

    saveScore(name, score, lines, level) {
        const scores = this.getScores();
        scores.push({ name: name || 'ANON', score, lines, level, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        scores.splice(100); // Keep top 100
        localStorage.setItem(this.KEYS.SCORES, JSON.stringify(scores));
    }
};
