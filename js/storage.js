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
        try {
            const stored = localStorage.getItem(this.KEYS.SETTINGS);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (typeof parsed === 'object' && parsed !== null) {
                    return { ...this.DEFAULT_SETTINGS, ...parsed };
                }
            }
        } catch (e) {
            console.warn('Failed to parse settings from localStorage, using defaults:', e);
        }
        return { ...this.DEFAULT_SETTINGS };
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings to localStorage:', e);
        }
    },

    getScores() {
        try {
            const stored = localStorage.getItem(this.KEYS.SCORES);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to parse scores from localStorage, using empty list:', e);
        }
        return [];
    },

    saveScore(name, score, lines, level) {
        try {
            const scores = this.getScores();
            // Sanitize name: remove HTML tags, trim, max 10 chars, fallback to ANON
            let cleanName = (typeof name === 'string' ? name : '').replace(/[<>]/g, '').trim();
            if (!cleanName) cleanName = 'ANON';
            cleanName = cleanName.substring(0, 10);

            scores.push({
                name: cleanName,
                score: Math.max(0, parseInt(score, 10) || 0),
                lines: Math.max(0, parseInt(lines, 10) || 0),
                level: Math.max(1, parseInt(level, 10) || 1),
                date: new Date().toISOString()
            });
            scores.sort((a, b) => b.score - a.score);
            scores.splice(100); // Keep top 100
            localStorage.setItem(this.KEYS.SCORES, JSON.stringify(scores));
        } catch (e) {
            console.error('Failed to save score to localStorage:', e);
        }
    }
};
