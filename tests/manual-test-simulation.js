// Manual test simulation for Badge System
// This script simulates the badge system behavior

import Player from '../src/js/models/Player.js';
import BadgeSystem from '../src/js/models/BadgeSystem.js';
import EventBus from '../src/js/core/EventBus.js';

console.log('🎮 Badge System Manual Test Simulation');
console.log('=====================================\n');

// Create test instances
const eventBus = new EventBus();
const player = new Player();
const badgeSystem = new BadgeSystem(player, eventBus);

// Listen for badge events
eventBus.on('badgeEarned', (data) => {
    console.log(`🏆 BADGE EARNED: ${data.name} (${data.badgeType})`);
    console.log(`   Description: ${data.description}`);
    console.log(`   Streak: ${data.streak} correct answers`);
    console.log('');
});

console.log('Initial player state:');
console.log(`- Consecutive Correct: ${player.consecutiveCorrect}`);
console.log(`- Best Streak: ${player.bestStreak}`);
console.log(`- Badges Earned: ${Object.keys(player.badges).filter(badge => player.badges[badge].earned).length}`);
console.log('');

// Simulate answering questions correctly
console.log('Simulating correct answers...\n');

for (let i = 1; i <= 16; i++) {
    console.log(`Question ${i}: Correct! ✅`);
    
    // Record correct answer
    player.recordAnswer('addition', true, 10);
    
    // Check for badges
    const newBadge = badgeSystem.checkAndAwardBadges(player.consecutiveCorrect);
    
    console.log(`   Current streak: ${player.consecutiveCorrect}`);
    
    // Show progress to next badge
    const progress = badgeSystem.getStreakProgress();
    if (progress.nextTarget) {
        console.log(`   Next badge: ${progress.nextTarget.name} (${progress.nextTarget.remaining} more needed)`);
    } else {
        console.log(`   🎉 All badges earned!`);
    }
    
    console.log('');
    
    // Stop after earning all badges
    if (player.consecutiveCorrect >= 15 && player.hasBadge('gold')) {
        break;
    }
}

// Test wrong answer
console.log('Question 17: Wrong! ❌');
player.recordAnswer('addition', false, 0);
console.log(`   Streak reset to: ${player.consecutiveCorrect}\n`);

// Final summary
console.log('📊 Final Results:');
console.log(`- Best Streak Achieved: ${player.bestStreak}`);
console.log(`- Total Score: ${player.totalScore}`);
console.log('- Badges Earned:');

const allBadges = badgeSystem.getAllBadges();
allBadges.forEach(badge => {
    const status = badge.earned ? '✅' : '❌';
    const count = badge.count > 0 ? ` (x${badge.count})` : '';
    console.log(`  ${status} ${badge.name}: ${badge.description}${count}`);
});

console.log('\n🎯 Badge System Test Complete!');

export { player, badgeSystem, eventBus };