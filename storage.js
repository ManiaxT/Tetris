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
        musicNext: 'Period'
    },

    getSettings() {
        const stored = localStorage.getItem(this.KEYS.SETTINGS);
        if (stored) {
            return { ...this.DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
        return this.DEFAULT_SETTINGS;
    },

    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    getScores() {
        const stored = localStorage.getItem(this.KEYS.SCORES);
        if (stored) {
            return JSON.parse(stored);
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
