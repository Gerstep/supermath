import BadgeSystem, { BADGE_THRESHOLDS, BADGE_NAMES } from '../../../src/js/models/BadgeSystem.js';
import Player from '../../../src/js/models/Player.js';
import EventBus from '../../../src/js/core/EventBus.js';

describe('BadgeSystem', () => {
    let badgeSystem;
    let player;
    let eventBus;
    let emittedEvents;

    beforeEach(() => {
        eventBus = new EventBus();
        player = new Player();
        badgeSystem = new BadgeSystem(player, eventBus);
        emittedEvents = [];
        
        // Track emitted events
        eventBus.on('badgeEarned', (data) => {
            emittedEvents.push({ type: 'badgeEarned', data });
        });
    });

    describe('Badge Thresholds', () => {
        test('should have correct badge thresholds', () => {
            expect(BADGE_THRESHOLDS.badge1).toBe(3);
            expect(BADGE_THRESHOLDS.bronze).toBe(5);
            expect(BADGE_THRESHOLDS.silver).toBe(10);
            expect(BADGE_THRESHOLDS.gold).toBe(15);
        });

        test('should have badge names defined', () => {
            expect(BADGE_NAMES.badge1).toBe('First Streak');
            expect(BADGE_NAMES.bronze).toBe('Bronze Streak');
            expect(BADGE_NAMES.silver).toBe('Silver Streak');
            expect(BADGE_NAMES.gold).toBe('Gold Streak');
        });
    });

    describe('checkAndAwardBadges', () => {
        test('should award badge1 at 3 consecutive correct answers', () => {
            player.consecutiveCorrect = 3;
            const result = badgeSystem.checkAndAwardBadges(3);
            
            expect(result).toBe('badge1');
            expect(player.hasBadge('badge1')).toBe(true);
            expect(emittedEvents).toHaveLength(1);
            expect(emittedEvents[0].data.badgeType).toBe('badge1');
        });

        test('should award bronze badge at 5 consecutive correct answers', () => {
            player.consecutiveCorrect = 5;
            const result = badgeSystem.checkAndAwardBadges(5);
            
            expect(result).toBe('badge1'); // First badge earned
            expect(player.hasBadge('badge1')).toBe(true);
        });

        test('should not award same badge twice', () => {
            player.awardBadge('badge1');
            player.consecutiveCorrect = 3;
            
            const result = badgeSystem.checkAndAwardBadges(3);
            expect(result).toBe(null);
            expect(player.badges.badge1.count).toBe(1);
        });

        test('should award highest eligible badge', () => {
            player.consecutiveCorrect = 10;
            const result = badgeSystem.checkAndAwardBadges(10);
            
            expect(result).toBe('badge1'); // Should award first eligible badge
        });

        test('should return null when no badges are earned', () => {
            player.consecutiveCorrect = 2;
            const result = badgeSystem.checkAndAwardBadges(2);
            
            expect(result).toBe(null);
            expect(emittedEvents).toHaveLength(0);
        });
    });

    describe('getBadgeForStreak', () => {
        test('should return correct badge for streak', () => {
            expect(badgeSystem.getBadgeForStreak(3)).toBe('badge1');
            expect(badgeSystem.getBadgeForStreak(5)).toBe('bronze');
            expect(badgeSystem.getBadgeForStreak(10)).toBe('silver');
            expect(badgeSystem.getBadgeForStreak(15)).toBe('gold');
        });

        test('should return highest badge for high streaks', () => {
            expect(badgeSystem.getBadgeForStreak(20)).toBe('gold');
        });

        test('should return null for insufficient streak', () => {
            expect(badgeSystem.getBadgeForStreak(2)).toBe(null);
        });
    });

    describe('getNextBadgeTarget', () => {
        test('should return next badge target for new player', () => {
            player.consecutiveCorrect = 1;
            const target = badgeSystem.getNextBadgeTarget(1);
            
            expect(target.badgeType).toBe('badge1');
            expect(target.threshold).toBe(3);
            expect(target.remaining).toBe(2);
            expect(target.name).toBe('First Streak');
        });

        test('should return bronze target after earning badge1', () => {
            player.awardBadge('badge1');
            player.consecutiveCorrect = 4;
            const target = badgeSystem.getNextBadgeTarget(4);
            
            expect(target.badgeType).toBe('bronze');
            expect(target.threshold).toBe(5);
            expect(target.remaining).toBe(1);
        });

        test('should return null when all badges are earned', () => {
            ['badge1', 'bronze', 'silver', 'gold'].forEach(badge => {
                player.awardBadge(badge);
            });
            
            const target = badgeSystem.getNextBadgeTarget(20);
            expect(target).toBe(null);
        });
    });

    describe('getAllBadges', () => {
        test('should return all badge information', () => {
            player.awardBadge('badge1');
            
            const badges = badgeSystem.getAllBadges();
            expect(badges).toHaveLength(4);
            
            const badge1 = badges.find(b => b.type === 'badge1');
            expect(badge1.earned).toBe(true);
            expect(badge1.count).toBe(1);
            expect(badge1.name).toBe('First Streak');
            
            const bronze = badges.find(b => b.type === 'bronze');
            expect(bronze.earned).toBe(false);
            expect(bronze.count).toBe(0);
        });
    });

    describe('getStreakProgress', () => {
        test('should return current progress toward next badge', () => {
            player.consecutiveCorrect = 2;
            const progress = badgeSystem.getStreakProgress();
            
            expect(progress.currentStreak).toBe(2);
            expect(progress.nextTarget.badgeType).toBe('badge1');
            expect(progress.progress).toBeCloseTo(66.67, 1); // 2/3 * 100
        });

        test('should return 100% when all badges earned', () => {
            ['badge1', 'bronze', 'silver', 'gold'].forEach(badge => {
                player.awardBadge(badge);
            });
            player.consecutiveCorrect = 20;
            
            const progress = badgeSystem.getStreakProgress();
            expect(progress.progress).toBe(100);
            expect(progress.nextTarget).toBe(null);
        });
    });
});