// Player model tests using Jest
import Player from '../../../src/js/models/Player.js';

describe('Player Model Tests', () => {
    test('should create a new player with default values', () => {
        const player = new Player();
        
        expect(player.totalScore).toBe(0);
        expect(player.level).toBe(1);
        expect(player.streak).toBe(0);
        expect(player.achievements.length).toBe(0);
        expect(player.settings.musicEnabled).toBe(true);
        expect(player.operationStats.detective).toBeDefined();
    });

    test('should record correct answers and update score', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        
        expect(player.totalScore).toBe(10);
        expect(player.streak).toBe(1);
        expect(player.operationStats.addition.correctAnswers).toBe(1);
        expect(player.operationStats.addition.questionsAnswered).toBe(1);
    });

    test('should handle Detective Mode operations', () => {
        const player = new Player();
        
        player.recordAnswer('detective', true, 15); // Detective mode has 1.5x multiplier
        
        expect(player.totalScore).toBe(15);
        expect(player.operationStats.detective.correctAnswers).toBe(1);
        expect(player.operationStats.detective.questionsAnswered).toBe(1);
    });

    test('should handle incorrect answers', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', false, 0);
        
        expect(player.totalScore).toBe(10);
        expect(player.streak).toBe(0);
        expect(player.operationStats.addition.correctAnswers).toBe(1);
        expect(player.operationStats.addition.questionsAnswered).toBe(2);
    });

    test('should calculate accuracy correctly', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', false, 0);
        
        const accuracy = player.getAccuracy('addition');
        expect(Math.abs(accuracy - 66.67)).toBeLessThan(0.01);
    });

    test('should level up based on score', () => {
        const player = new Player();
        
        // Score enough points to reach level 2 (50+ points)
        for (let i = 0; i < 6; i++) {
            player.recordAnswer('addition', true, 10);
        }
        
        expect(player.level).toBe(2);
        expect(player.totalScore).toBe(60);
    });

    test('should track best streak', () => {
        const player = new Player();
        
        // Build up a streak
        for (let i = 0; i < 5; i++) {
            player.recordAnswer('addition', true, 10);
        }
        
        expect(player.streak).toBe(5);
        expect(player.bestStreak).toBe(5);
        
        // Break the streak
        player.recordAnswer('addition', false, 0);
        
        expect(player.streak).toBe(0);
        expect(player.bestStreak).toBe(5);
    });

    test('should add achievements', () => {
        const player = new Player();
        
        const added = player.addAchievement('test_achievement');
        expect(added).toBe(true);
        expect(player.achievements).toContain('test_achievement');
        
        const addedAgain = player.addAchievement('test_achievement');
        expect(addedAgain).toBe(false);
        expect(player.achievements.length).toBe(1);
    });

    test('should serialize and deserialize correctly', () => {
        const player = new Player();
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('detective', true, 15);
        player.addAchievement('test_achievement');
        
        const json = player.toJSON();
        const restored = Player.fromJSON(json);
        
        expect(restored.totalScore).toBe(player.totalScore);
        expect(restored.level).toBe(player.level);
        expect(restored.achievements.length).toBe(player.achievements.length);
        expect(restored.operationStats.addition.correctAnswers).toBe(1);
        expect(restored.operationStats.detective.correctAnswers).toBe(1);
        expect(restored.settings.musicEnabled).toBe(true);
    });

    test('should validate score additions', () => {
        const player = new Player();
        
        expect(() => {
            player.addScore(-10);
        }).toThrow('negative');
        
        player.addScore(25);
        expect(player.totalScore).toBe(25);
    });

    test('should update settings correctly', () => {
        const player = new Player();
        
        player.updateSettings({ musicEnabled: false, difficulty: 'hard' });
        
        expect(player.settings.musicEnabled).toBe(false);
        expect(player.settings.difficulty).toBe('hard');
        expect(player.settings.soundEnabled).toBe(true); // Should preserve existing settings
    });
});