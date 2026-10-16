class InputManager {
    constructor() {
        this.settings = Storage.getSettings();
        this.keys = {};
        this.actions = {};
        
        window.addEventListener('keydown', (e) => {
            // Do not intercept or trigger game actions when user is typing in text inputs
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                return;
            }

            if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
                // If a button is focused, space/enter might trigger it. Let's blur it if it's not keybind listening.
                if (!document.querySelector('.keybind-btn.listening')) {
                    document.activeElement.blur();
                }
            }

            // Prevent default page scroll for mapped game keys or arrow/space keys when game is active or rebinding
            const gameScreen = document.getElementById('game-screen');
            const isGameActive = gameScreen && gameScreen.classList.contains('active');
            const isListeningKeybind = !!document.querySelector('.keybind-btn.listening');
            if (isGameActive || isListeningKeybind) {
                const isNavKey = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
                const isGameKey = Object.values(this.settings).includes(e.code);
                if (isNavKey || isGameKey) {
                    e.preventDefault();
                }
            }

            if (!this.keys[e.code]) { // Ignore OS auto-repeat
                this.keys[e.code] = true;
                this.handleAction(e.code, 'down');
            }
        });

        window.addEventListener('keyup', (e) => {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            this.keys[e.code] = false;
            this.handleAction(e.code, 'up');
        });

        // Reset all pressed keys when window loses focus to prevent runaway drops/moves
        window.addEventListener('blur', () => {
            this.keys = {};
        });

        this.onAction = null;
    }

    handleAction(code, state) {
        if (!this.onAction) return;

        // Map key code to action based on settings
        let triggeredAction = null;
        for (const [action, boundKey] of Object.entries(this.settings)) {
            if (boundKey === code) {
                triggeredAction = action;
                break;
            }
        }

        if (triggeredAction) {
            this.onAction(triggeredAction, state);
        }
    }

    updateSettings(newSettings) {
        this.settings = newSettings;
    }
}
const Input = new InputManager();
