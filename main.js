const screens = {
    mainMenu: document.getElementById('main-menu'),
    settingsMenu: document.getElementById('settings-menu'),
    scoreboardMenu: document.getElementById('scoreboard-menu'),
    gameScreen: document.getElementById('game-screen')
};

let game = null;
let animFrame = null;

// Apply Theme on Load
function applyTheme() {
    const settings = Storage.getSettings();
    document.body.setAttribute('data-theme', settings.theme);
}
applyTheme();

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
    if (screenId === 'mainMenu') {
        updateMainLeaderboard();
    }
}

// Menu Buttons
document.getElementById('btn-play').addEventListener('click', () => {
    showScreen('gameScreen');
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    if (!game) {
        game = new Game();
    } else {
        game.reset();
    }
    
    if (animFrame) cancelAnimationFrame(animFrame);
    game.lastTime = performance.now();
    function loop(time) {
        game.update(time);
        animFrame = requestAnimationFrame(loop);
    }
    loop(performance.now());
});

document.getElementById('btn-settings').addEventListener('click', () => {
    showScreen('settingsMenu');
    loadSettingsUI();
});

document.getElementById('btn-scoreboard').addEventListener('click', () => {
    showScreen('scoreboardMenu');
    loadScoreboardUI();
});

// Back Buttons
document.getElementById('btn-settings-back').addEventListener('click', () => {
    showScreen('mainMenu');
});

document.getElementById('btn-scoreboard-back').addEventListener('click', () => {
    showScreen('mainMenu');
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('game-screen').classList.contains('active')) {
        if(game && !game.isGameOver) {
            game.isPaused = !game.isPaused;
            if(game.isPaused) {
                document.getElementById('pause-overlay').classList.remove('hidden');
            } else {
                document.getElementById('pause-overlay').classList.add('hidden');
                game.lastTime = performance.now();
            }
        }
    }
});

// Game Buttons
document.getElementById('btn-resume').addEventListener('click', () => {
    if(game) {
        game.isPaused = false;
        document.getElementById('pause-overlay').classList.add('hidden');
        game.lastTime = performance.now();
    }
});

document.getElementById('btn-quit').addEventListener('click', () => {
    if (animFrame) cancelAnimationFrame(animFrame);
    showScreen('mainMenu');
});

document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('game-over-overlay').classList.add('hidden');
    game.reset();
    game.lastTime = performance.now();
});

document.getElementById('btn-menu').addEventListener('click', () => {
    if (animFrame) cancelAnimationFrame(animFrame);
    showScreen('mainMenu');
});

document.getElementById('btn-save-score').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim().substring(0, 10);
    Storage.saveScore(name, game.score, game.lines, game.level);
    
    document.getElementById('name-input-container').classList.add('hidden');
    document.getElementById('game-over-buttons').classList.remove('hidden');
});

// Theme Button Logic
document.getElementById('btn-toggle-theme').addEventListener('click', (e) => {
    const settings = Storage.getSettings();
    settings.theme = settings.theme === 'cyberpunk' ? 'modern' : 'cyberpunk';
    Storage.saveSettings(settings);
    applyTheme();
    e.target.innerText = settings.theme === 'cyberpunk' ? 'Cyberpunk' : 'Modern';
});

// Settings Logic
let listeningForBind = null;

function loadSettingsUI() {
    const settings = Storage.getSettings();
    
    // Set Theme button text
    const themeBtn = document.getElementById('btn-toggle-theme');
    themeBtn.innerText = settings.theme === 'cyberpunk' ? 'Cyberpunk' : 'Modern';

    document.querySelectorAll('.keybind-btn:not(#btn-toggle-theme)').forEach(btn => {
        const action = btn.dataset.action;
        btn.innerText = settings[action] || 'Unbound';
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', () => {
            document.querySelectorAll('.keybind-btn:not(#btn-toggle-theme)').forEach(b => b.classList.remove('listening'));
            newBtn.classList.add('listening');
            newBtn.innerText = 'Press a key...';
            listeningForBind = { action, btn: newBtn };
        });
    });
}

window.addEventListener('keydown', (e) => {
    if (listeningForBind) {
        e.preventDefault();
        const { action, btn } = listeningForBind;
        const settings = Storage.getSettings();
        settings[action] = e.code;
        Storage.saveSettings(settings);
        Input.updateSettings(settings);
        btn.innerText = e.code;
        btn.classList.remove('listening');
        listeningForBind = null;
    }
});

// Top 3 Logic
function updateMainLeaderboard() {
    const scores = Storage.getScores();
    const list = document.getElementById('main-leaderboard-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (scores.length === 0) {
        list.innerHTML = '<li>No scores yet</li>';
        return;
    }
    
    scores.forEach((s, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${idx + 1} ${s.name}</span> <span style="float:right">${s.score}</span>`;
        list.appendChild(li);
    });
}

// Scoreboard Logic
function loadScoreboardUI() {
    const tbody = document.querySelector('#scores-table tbody');
    tbody.innerHTML = '';
    const scores = Storage.getScores();
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No scores yet!</td></tr>';
        return;
    }
    
    scores.forEach((s, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>#${idx + 1}</td>
                <td>${s.name}</td>
                <td>${s.score}</td>
                <td>${s.lines}</td>
                <td>${s.level}</td>
            </tr>
        `;
    });
}

// Audio UI Hookups
document.getElementById('btn-add-song').addEventListener('click', () => {
    document.getElementById('file-add-song').click();
});

document.getElementById('file-add-song').addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        audioPlayer.addFiles(e.target.files);
    }
});

document.querySelectorAll('.btn-player-playpause').forEach(btn => {
    btn.addEventListener('click', () => audioPlayer.togglePlayPause());
});

document.querySelectorAll('.btn-player-next').forEach(btn => {
    btn.addEventListener('click', () => audioPlayer.playNext());
});

document.querySelectorAll('.btn-player-prev').forEach(btn => {
    btn.addEventListener('click', () => audioPlayer.playPrev());
});

document.querySelectorAll('.btn-player-mode').forEach(btn => {
    btn.addEventListener('click', () => audioPlayer.toggleMode());
});

// Input Hook for Game Actions
Input.onAction = (action, state) => {
    // Global Music Hotkeys
    if (state === 'down') {
        if (action === 'musicPlayPause') { audioPlayer.togglePlayPause(); return; }
        if (action === 'musicMode') { audioPlayer.toggleMode(); return; }
        if (action === 'musicPrev') { audioPlayer.playPrev(); return; }
        if (action === 'musicNext') { audioPlayer.playNext(); return; }
    }

    if (!game || game.isPaused || game.isGameOver) return;
    
    if (state === 'down') {
        switch (action) {
            case 'left':
                game.move(-1, 0);
                game.resetLockDelayIfTouching();
                break;
            case 'right':
                game.move(1, 0);
                game.resetLockDelayIfTouching();
                break;
            case 'rotateCW':
                game.rotate(1);
                break;
            case 'rotateCCW':
                game.rotate(-1);
                break;
            case 'hardDrop':
                game.hardDrop();
                break;
            case 'hold':
                game.hold();
                break;
        }
        game.draw(); 
    }
};
