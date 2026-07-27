class InputManager {
    constructor() {
        this.settings = Storage.getSettings();
        this.keys = {};
        this.actions = {};
        
        window.addEventListener('keydown', (e) => {
            // Don't intercept keystrokes while the user is typing into a text field
            // (e.g. entering their name on the game-over screen). Without this, letters
            // like P/M or Comma/Period would trigger music hotkeys mid-typing.
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                return;
            }

            if(document.activeElement.tagName === 'BUTTON') {
                // If a button is focused, space/enter might trigger it. Let's blur it if it's not keybind listening.
                if(!document.querySelector('.keybind-btn.listening')) {
                    document.activeElement.blur();
                }
            }
            if (!this.keys[e.code]) { // Ignore OS auto-repeat
                this.keys[e.code] = true;
                this.handleAction(e.code, 'down');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleAction(e.code, 'up');
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
