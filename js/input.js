class InputManager {
    constructor() {
        this.settings = Storage.getSettings();
        this.keys = {};
        this.actions = {};
        
        window.addEventListener('keydown', (e) => {
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
