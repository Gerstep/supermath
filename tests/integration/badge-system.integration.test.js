import Game from '../../src/js/core/Game.js';
import { JSDOM } from 'jsdom';

describe('Badge System Integration', () => {
    let game;
    let dom;
    let document;

    beforeEach(async () => {
        // Set up DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="streak-counter" class="streak-counter hidden">Streak: 0</div>
                <div id="game-container">
                    <div id="mode-selection" class="hidden"></div>
                    <div id="game-area" class="hidden">
                        <div id="score">Score: 0</div>
                        <div id="num1-display"></div>
                        <div id="num2-display"></div>
                        <div id="operator-display"></div>
                        <div id="question-mark"></div>
                        <div id="answer-input" contenteditable="true"></div>
                        <input id="answer-input" type="text" />
                    </div>
                </div>
            </body>
            </html>
        `, {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        global.document = dom.window.document;
        global.window = dom.window;
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        global.fetch = jest.fn();

        document = dom.window.document;
        game = new Game();
        await game.initialize();
    });

    afterEach(() => {
        if (game) {
            game.destroy();
        }
        dom.window.close();
    });

    test('should initialize badge system with player', () => {
        expect(game.badgeSystem).toBeDefined();
        expect(game.player).toBeDefined();
        expect(game.player.badges).toBeDefined();
        expect(game.player.consecutiveCorrect).toBe(0);
    });

    test('should track consecutive correct answers', () => {
        // Start a game
        game.startGame('addition');
        
        // Simulate answering questions correctly
        game.player.recordAnswer('addition', true, 10);
        expect(game.player.consecutiveCorrect).toBe(1);
        
        game.player.recordAnswer('addition', true, 10);
        expect(game.player.consecutiveCorrect).toBe(2);
        
        game.player.recordAnswer('addition', true, 10);
        expect(game.player.consecutiveCorrect).toBe(3);
    });

    test('should award badge1 after 3 consecutive correct answers', () => {
        game.startGame('addition');
        
        // Setup event listener to catch badge earned event
        let badgeEarned = null;
        game.eventBus.on('badgeEarned', (data) => {
            badgeEarned = data;
        });

        // Answer 3 questions correctly
        for (let i = 0; i < 3; i++) {
            game.player.recordAnswer('addition', true, 10);
            game.badgeSystem.checkAndAwardBadges(game.player.consecutiveCorrect);
        }

        expect(badgeEarned).not.toBe(null);
        expect(badgeEarned.badgeType).toBe('badge1');
        expect(badgeEarned.streak).toBe(3);
        expect(game.player.hasBadge('badge1')).toBe(true);
    });

    test('should award bronze badge at 5 consecutive correct answers', () => {
        game.startGame('addition');
        
        let badgeEarned = null;
        game.eventBus.on('badgeEarned', (data) => {
            badgeEarned = data;
        });

        // Answer 5 questions correctly
        for (let i = 0; i < 5; i++) {
            game.player.recordAnswer('addition', true, 10);
            const badge = game.badgeSystem.checkAndAwardBadges(game.player.consecutiveCorrect);
            if (badge === 'bronze') {
                badgeEarned = { badgeType: 'bronze', streak: 5 };
            }
        }

        expect(game.player.consecutiveCorrect).toBe(5);
        expect(game.player.hasBadge('badge1')).toBe(true); // Should have earned badge1 first
    });

    test('should reset streak on wrong answer', () => {
        game.startGame('addition');
        
        // Build up a streak
        game.player.recordAnswer('addition', true, 10);
        game.player.recordAnswer('addition', true, 10);
        expect(game.player.consecutiveCorrect).toBe(2);

        // Answer incorrectly
        game.player.recordAnswer('addition', false, 0);
        expect(game.player.consecutiveCorrect).toBe(0);
    });

    test('should update streak display', () => {
        game.startGame('addition');
        
        const streakCounter = document.getElementById('streak-counter');
        expect(streakCounter).toBeDefined();

        // Update streak display
        game.player.consecutiveCorrect = 5;
        game.updateStreakDisplay();

        expect(streakCounter.textContent).toBe('Streak: 5');
        expect(streakCounter.classList.contains('hidden')).toBe(false);
    });

    test('should hide streak counter on main menu', () => {
        game.startGame('addition');
        const streakCounter = document.getElementById('streak-counter');
        
        // Streak counter should be visible during game
        game.updateStreakDisplay();
        expect(streakCounter.classList.contains('hidden')).toBe(false);

        // Should hide when returning to main menu
        game.showMainMenu();
        expect(streakCounter.classList.contains('hidden')).toBe(true);
    });

    test('should get next badge target correctly', () => {
        const progress = game.badgeSystem.getStreakProgress();
        
        expect(progress.currentStreak).toBe(0);
        expect(progress.nextTarget).toBeDefined();
        expect(progress.nextTarget.badgeType).toBe('badge1');
        expect(progress.nextTarget.threshold).toBe(3);
        expect(progress.nextTarget.remaining).toBe(3);
    });

    test('should calculate progress percentage correctly', () => {
        game.player.consecutiveCorrect = 2;
        const progress = game.badgeSystem.getStreakProgress();
        
        expect(progress.currentStreak).toBe(2);
        expect(progress.progress).toBeCloseTo(66.67, 1); // 2/3 * 100
    });
});