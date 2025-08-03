// Basic Node.js test for Player model
const fs = require('fs');
const path = require('path');

// Simple test framework
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function describe(description, tests) {
    console.log(`\n📋 ${description}`);
    tests();
}

function test(name, testFn) {
    try {
        testFn();
        console.log(`  ✅ ${name}`);
    } catch (error) {
        console.log(`  ❌ ${name}: ${error.message}`);
    }
}

// Mock ES6 import/export for Node.js
function loadPlayerClass() {
    const playerPath = path.join(__dirname, '../../../src/js/models/Player.js');
    let content = fs.readFileSync(playerPath, 'utf8');
    
    // Remove ES6 imports/exports for Node.js compatibility
    content = content.replace(/import.*from.*;\n?/g, '');
    content = content.replace(/export default Player;/, '');
    
    // Evaluate the Player class
    eval(content);
    return Player;
}

const Player = loadPlayerClass();

describe('Player Model Tests', () => {
    test('should create a new player with default values', () => {
        const player = new Player();
        
        assert(player.totalScore === 0, 'Initial score should be 0');
        assert(player.level === 1, 'Initial level should be 1');
        assert(player.streak === 0, 'Initial streak should be 0');
        assert(player.achievements.length === 0, 'Should have no achievements initially');
    });

    test('should record correct answers and update score', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        
        assert(player.totalScore === 10, 'Score should be 10 after correct answer');
        assert(player.streak === 1, 'Streak should be 1');
        assert(player.operationStats.addition.correctAnswers === 1, 'Should have 1 correct addition answer');
        assert(player.operationStats.addition.questionsAnswered === 1, 'Should have 1 addition question answered');
    });

    test('should handle incorrect answers', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', false, 0);
        
        assert(player.totalScore === 10, 'Score should remain 10 after incorrect answer');
        assert(player.streak === 0, 'Streak should reset to 0');
        assert(player.operationStats.addition.correctAnswers === 1, 'Should still have 1 correct answer');
        assert(player.operationStats.addition.questionsAnswered === 2, 'Should have 2 questions answered');
    });

    test('should calculate accuracy correctly', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', false, 0);
        
        const accuracy = player.getAccuracy('addition');
        assert(Math.abs(accuracy - 66.67) < 0.01, `Accuracy should be ~66.67%, got ${accuracy}`);
    });

    test('should level up based on score', () => {
        const player = new Player();
        
        // Score enough points to reach level 2 (50+ points)
        for (let i = 0; i < 6; i++) {
            player.recordAnswer('addition', true, 10);
        }
        
        assert(player.level === 2, `Should be level 2, got level ${player.level}`);
        assert(player.totalScore === 60, `Should have 60 points, got ${player.totalScore}`);
    });

    test('should track best streak', () => {
        const player = new Player();
        
        // Build up a streak
        for (let i = 0; i < 5; i++) {
            player.recordAnswer('addition', true, 10);
        }
        
        assert(player.streak === 5, 'Current streak should be 5');
        assert(player.bestStreak === 5, 'Best streak should be 5');
        
        // Break the streak
        player.recordAnswer('addition', false, 0);
        
        assert(player.streak === 0, 'Current streak should reset to 0');
        assert(player.bestStreak === 5, 'Best streak should remain 5');
    });

    test('should add achievements', () => {
        const player = new Player();
        
        const added = player.addAchievement('test_achievement');
        assert(added === true, 'Should return true when adding new achievement');
        assert(player.achievements.includes('test_achievement'), 'Should contain the achievement');
        
        const addedAgain = player.addAchievement('test_achievement');
        assert(addedAgain === false, 'Should return false when adding duplicate achievement');
        assert(player.achievements.length === 1, 'Should still have only one achievement');
    });

    test('should serialize and deserialize correctly', () => {
        const player = new Player();
        player.recordAnswer('addition', true, 10);
        player.addAchievement('test_achievement');
        
        const json = player.toJSON();
        const restored = Player.fromJSON(json);
        
        assert(restored.totalScore === player.totalScore, 'Total score should match');
        assert(restored.level === player.level, 'Level should match');
        assert(restored.achievements.length === player.achievements.length, 'Achievements count should match');
        assert(restored.operationStats.addition.correctAnswers === 1, 'Operation stats should be preserved');
    });

    test('should validate score additions', () => {
        const player = new Player();
        
        try {
            player.addScore(-10);
            assert(false, 'Should throw error for negative score');
        } catch (error) {
            assert(error.message.includes('negative'), 'Error should mention negative score');
        }
        
        player.addScore(25);
        assert(player.totalScore === 25, 'Should add positive score correctly');
    });
});

console.log('\n🧪 Running Player Model Tests...');
describe('Player Model Tests', () => {
    test('should create a new player with default values', () => {
        const player = new Player();
        
        assert(player.totalScore === 0, 'Initial score should be 0');
        assert(player.level === 1, 'Initial level should be 1');
        assert(player.streak === 0, 'Initial streak should be 0');
        assert(player.achievements.length === 0, 'Should have no achievements initially');
    });

    test('should record correct answers and update score', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        
        assert(player.totalScore === 10, 'Score should be 10 after correct answer');
        assert(player.streak === 1, 'Streak should be 1');
        assert(player.operationStats.addition.correctAnswers === 1, 'Should have 1 correct addition answer');
        assert(player.operationStats.addition.questionsAnswered === 1, 'Should have 1 addition question answered');
    });

    test('should handle incorrect answers', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', false, 0);
        
        assert(player.totalScore === 10, 'Score should remain 10 after incorrect answer');
        assert(player.streak === 0, 'Streak should reset to 0');
        assert(player.operationStats.addition.correctAnswers === 1, 'Should still have 1 correct answer');
        assert(player.operationStats.addition.questionsAnswered === 2, 'Should have 2 questions answered');
    });

    test('should calculate accuracy correctly', () => {
        const player = new Player();
        
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', true, 10);
        player.recordAnswer('addition', false, 0);
        
        const accuracy = player.getAccuracy('addition');
        assert(Math.abs(accuracy - 66.67) < 0.01, `Accuracy should be ~66.67%, got ${accuracy}`);
    });

    test('should serialize and deserialize correctly', () => {
        const player = new Player();
        player.recordAnswer('addition', true, 10);
        player.addAchievement('test_achievement');
        
        const json = player.toJSON();
        const restored = Player.fromJSON(json);
        
        assert(restored.totalScore === player.totalScore, 'Total score should match');
        assert(restored.level === player.level, 'Level should match');
        assert(restored.achievements.length === player.achievements.length, 'Achievements count should match');
        assert(restored.operationStats.addition.correctAnswers === 1, 'Operation stats should be preserved');
    });
});

console.log('\n✅ Player model tests completed!');