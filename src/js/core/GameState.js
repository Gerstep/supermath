class GameState {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = {
            currentScreen: 'menu',
            player: null,
            currentQuestion: null,
            gameMode: null,
            difficulty: 'medium',
            settings: {
                soundEnabled: true,
                animationSpeed: 'normal'
            },
            isGameActive: false,
            level: 1
        };
        this.listeners = new Map();
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        this.notifyListeners(oldState, this.state);
        this.eventBus.emit('stateChanged', { 
            oldState, 
            newState: this.state, 
            changes: updates 
        });
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        return () => this.unsubscribe(key, callback);
    }

    unsubscribe(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(oldState, newState) {
        this.listeners.forEach((callbacks, key) => {
            const oldValue = this.getNestedValue(oldState, key);
            const newValue = this.getNestedValue(newState, key);
            
            if (oldValue !== newValue) {
                callbacks.forEach(callback => {
                    try {
                        callback(newValue, oldValue);
                    } catch (error) {
                        console.error(`Error in state listener for ${key}:`, error);
                    }
                });
            }
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    reset() {
        const defaultState = {
            currentScreen: 'menu',
            player: null,
            currentQuestion: null,
            gameMode: null,
            difficulty: this.state.difficulty,
            settings: this.state.settings,
            isGameActive: false,
            level: 1
        };
        
        this.setState(defaultState);
    }
}

export default GameState;