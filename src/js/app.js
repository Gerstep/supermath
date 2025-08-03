import Game from './core/Game.js';

class App {
    constructor() {
        this.game = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing Math Super Game...');
            
            this.setupGlobalErrorHandling();
            await this.waitForDOM();
            
            this.game = new Game();
            await this.game.initialize();
            
            this.setupGlobalEventListeners();
            this.isInitialized = true;
            
            console.log('Math Super Game initialized successfully!');
            
            this.game.eventBus.emit('appReady');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showInitializationError(error);
        }
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    setupGlobalEventListeners() {
        this.setupOperationButtons();
        this.setupGameControls();
        this.setupKeyboardShortcuts();
        this.setupTouchOptimizations();
        this.setupAccessibilityFeatures();
    }

    setupOperationButtons() {
        const operationButtons = [
            { id: 'addition-btn', operation: 'addition' },
            { id: 'subtraction-btn', operation: 'subtraction' },
            { id: 'multiplication-btn', operation: 'multiplication' },
            { id: 'division-btn', operation: 'division' },
            { id: 'supermode-btn', operation: 'supermode' }
        ];

        operationButtons.forEach(({ id, operation }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    this.game.soundService.resumeAudioContext();
                    this.game.startGame(operation);
                });
            }
        });

        const legacyButtons = document.querySelectorAll('[onclick*="startGame"]');
        legacyButtons.forEach(button => {
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/startGame\('(\w+)'\)/);
                if (match) {
                    const operation = match[1];
                    button.removeAttribute('onclick');
                    button.addEventListener('click', () => {
                        this.game.soundService.resumeAudioContext();
                        this.game.startGame(operation);
                    });
                }
            }
        });
    }

    setupGameControls() {
        const checkBtn = document.getElementById('check-btn');
        if (checkBtn) {
            checkBtn.removeAttribute('onclick');
            checkBtn.addEventListener('click', () => {
                this.game.checkAnswer();
            });
        }

        const changeModeBtn = document.querySelector('[onclick*="endGame"]');
        if (changeModeBtn) {
            changeModeBtn.removeAttribute('onclick');
            changeModeBtn.addEventListener('click', () => {
                this.game.showMainMenu();
            });
        }

        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.game.checkAnswer();
                }
            });

            answerInput.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value && !/^\d*$/.test(value)) {
                    e.target.value = value.replace(/\D/g, '');
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.game && this.game.isInitialized) {
                switch (e.key) {
                    case '1':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.game.startGame('addition');
                        }
                        break;
                    case '2':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.game.startGame('subtraction');
                        }
                        break;
                    case '3':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.game.startGame('multiplication');
                        }
                        break;
                    case '4':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.game.startGame('division');
                        }
                        break;
                    case '5':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.game.startGame('supermode');
                        }
                        break;
                    case 'Escape':
                        if (this.game.gameState.getState().currentScreen === 'game') {
                            this.game.showMainMenu();
                        }
                        break;
                    case 'h':
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            this.showHelpModal();
                        }
                        break;
                }
            }
        });
    }

    setupTouchOptimizations() {
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
            
            let touchStartTime = 0;
            document.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                this.game?.soundService.resumeAudioContext();
            });

            document.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                if (touchDuration > 500) {
                    e.target.classList.add('long-press');
                    setTimeout(() => {
                        e.target.classList.remove('long-press');
                    }, 200);
                }
            });

            const buttons = document.querySelectorAll('.btn, button');
            buttons.forEach(button => {
                button.addEventListener('touchstart', () => {
                    button.classList.add('touch-active');
                });
                
                button.addEventListener('touchend', () => {
                    setTimeout(() => {
                        button.classList.remove('touch-active');
                    }, 150);
                });
            });
        }
    }

    setupAccessibilityFeatures() {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach((element, index) => {
            if (!element.getAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }

            element.addEventListener('focus', () => {
                element.classList.add('focus-visible');
                this.announceForScreenReader(`Focused on ${this.getElementDescription(element)}`);
            });

            element.addEventListener('blur', () => {
                element.classList.remove('focus-visible');
            });
        });

        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.setAttribute('aria-label', 'Enter your answer');
            answerInput.setAttribute('aria-describedby', 'answer-hint');
            
            const hint = document.createElement('div');
            hint.id = 'answer-hint';
            hint.className = 'sr-only';
            hint.textContent = 'Enter a number and press Enter or click Check';
            answerInput.parentNode.appendChild(hint);
        }

        const scoreDisplay = document.getElementById('score');
        if (scoreDisplay) {
            scoreDisplay.setAttribute('aria-live', 'polite');
            scoreDisplay.setAttribute('aria-label', 'Current score');
        }
    }

    getElementDescription(element) {
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.trim() || element.value || element.alt || '';
        const ariaLabel = element.getAttribute('aria-label');
        
        return ariaLabel || text || `${tagName} element`;
    }

    announceForScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    handleGlobalError(error) {
        if (this.game && this.game.modalManager) {
            this.game.modalManager.create('global-error', {
                title: 'Oops! Something went wrong',
                content: `
                    <p class="mb-4">We encountered an unexpected error:</p>
                    <p class="text-sm text-gray-600 mb-4">${error.message || 'Unknown error'}</p>
                    <p>Don't worry, your progress has been saved. You can continue playing!</p>
                `,
                type: 'error',
                buttons: [
                    { text: 'Continue Playing', type: 'primary', action: 'continue' },
                    { text: 'Restart Game', type: 'secondary', action: 'restart' }
                ]
            });

            this.game.eventBus.on('modalButtonClick', (data) => {
                if (data.modalId === 'global-error') {
                    if (data.action === 'restart') {
                        this.restart();
                    } else {
                        this.game.modalManager.close('global-error');
                    }
                }
            });

            this.game.modalManager.show('global-error');
        } else {
            console.error('Cannot show error modal, falling back to alert');
            alert('An error occurred. Please refresh the page.');
        }
    }

    showInitializationError(error) {
        const errorContainer = document.createElement('div');
        errorContainer.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-2xl p-8 max-w-md text-center">
                    <h2 class="text-2xl font-bold text-red-600 mb-4">Initialization Error</h2>
                    <p class="mb-4">Failed to start the Math Super Game:</p>
                    <p class="text-sm text-gray-600 mb-6">${error.message}</p>
                    <button onclick="window.location.reload()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorContainer);
    }

    showHelpModal() {
        if (!this.game || !this.game.modalManager) return;

        this.game.modalManager.create('help', {
            title: '🎮 How to Play',
            content: `
                <div class="text-left space-y-4">
                    <div>
                        <h4 class="font-bold mb-2">🔢 Choose Your Operation:</h4>
                        <p class="text-sm text-gray-600">Pick Addition (+), Subtraction (-), Multiplication (×), Division (÷), or Super Mode (mixed operations).</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-2">👀 Look at the Blocks:</h4>
                        <p class="text-sm text-gray-600">Use the colorful blocks to help visualize the math problem.</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-2">✏️ Enter Your Answer:</h4>
                        <p class="text-sm text-gray-600">Type your answer in the box and press Enter or click Check.</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-2">🏆 Earn Points & Achievements:</h4>
                        <p class="text-sm text-gray-600">Get points for correct answers and unlock medals!</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-2">⌨️ Keyboard Shortcuts:</h4>
                        <p class="text-sm text-gray-600">
                            Ctrl+1: Addition | Ctrl+2: Subtraction | Ctrl+3: Multiplication<br>
                            Ctrl+4: Division | Ctrl+5: Super Mode | Escape: Main Menu
                        </p>
                    </div>
                </div>
            `,
            size: 'large',
            buttons: [
                { text: 'Got it!', type: 'primary', action: 'close' }
            ]
        });

        this.game.modalManager.show('help');
    }

    async restart() {
        try {
            if (this.game) {
                this.game.destroy();
            }
            
            this.game = new Game();
            await this.game.initialize();
            
            console.log('Game restarted successfully');
        } catch (error) {
            console.error('Failed to restart game:', error);
            window.location.reload();
        }
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            game: this.game ? this.game.getGameStatus() : null,
            timestamp: new Date().toISOString()
        };
    }
}

const app = new App();

window.addEventListener('load', () => {
    app.init().catch(console.error);
});

window.mathSuperGame = app;

export default app;