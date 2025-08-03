export const BADGE_THRESHOLDS = {
    badge1: 3,
    bronze: 5,
    silver: 10,
    gold: 15
};

export const BADGE_NAMES = {
    badge1: 'First Streak',
    bronze: 'Bronze Streak',
    silver: 'Silver Streak',
    gold: 'Gold Streak'
};

export const BADGE_DESCRIPTIONS = {
    badge1: '3 correct answers in a row!',
    bronze: '5 correct answers in a row!',
    silver: '10 correct answers in a row!',
    gold: '15 correct answers in a row!'
};

export class BadgeSystem {
    constructor(player, eventBus) {
        this.player = player;
        this.eventBus = eventBus;
        this.thresholds = BADGE_THRESHOLDS;
    }

    checkAndAwardBadges(currentStreak) {
        const badgesToCheck = ['badge1', 'bronze', 'silver', 'gold'];
        let newBadge = null;

        for (const badgeType of badgesToCheck) {
            const threshold = this.thresholds[badgeType];
            
            // Check if player has reached threshold and hasn't earned this badge yet
            if (currentStreak >= threshold && !this.player.hasBadge(badgeType)) {
                this.player.awardBadge(badgeType);
                newBadge = badgeType;
                
                // Emit badge earned event
                this.eventBus.emit('badgeEarned', {
                    badgeType,
                    streak: currentStreak,
                    name: BADGE_NAMES[badgeType],
                    description: BADGE_DESCRIPTIONS[badgeType]
                });
                
                // Only award one badge at a time (highest achieved)
                break;
            }
        }

        return newBadge;
    }

    getBadgeForStreak(streak) {
        const badges = Object.keys(this.thresholds).sort((a, b) => 
            this.thresholds[b] - this.thresholds[a]
        );

        for (const badge of badges) {
            if (streak >= this.thresholds[badge]) {
                return badge;
            }
        }
        return null;
    }

    getNextBadgeTarget(currentStreak) {
        const badges = Object.keys(this.thresholds).sort((a, b) => 
            this.thresholds[a] - this.thresholds[b]
        );

        for (const badge of badges) {
            const threshold = this.thresholds[badge];
            if (currentStreak < threshold && !this.player.hasBadge(badge)) {
                return {
                    badgeType: badge,
                    threshold,
                    remaining: threshold - currentStreak,
                    name: BADGE_NAMES[badge]
                };
            }
        }
        
        return null; // All badges earned
    }

    getAllBadges() {
        return Object.keys(this.thresholds).map(badgeType => ({
            type: badgeType,
            name: BADGE_NAMES[badgeType],
            description: BADGE_DESCRIPTIONS[badgeType],
            threshold: this.thresholds[badgeType],
            earned: this.player.hasBadge(badgeType),
            count: this.player.badges[badgeType].count,
            lastEarned: this.player.badges[badgeType].lastEarned
        }));
    }

    getStreakProgress() {
        const currentStreak = this.player.consecutiveCorrect;
        const nextTarget = this.getNextBadgeTarget(currentStreak);
        
        return {
            currentStreak,
            nextTarget,
            progress: nextTarget ? (currentStreak / nextTarget.threshold) * 100 : 100
        };
    }

    resetProgress() {
        this.player.resetBadgeProgress();
        this.eventBus.emit('badgeProgressReset');
    }
}

export default BadgeSystem;