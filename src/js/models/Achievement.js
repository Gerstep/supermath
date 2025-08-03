class Achievement {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.category = data.category;
        this.requirement = data.requirement;
        this.points = data.points;
        this.medal = data.medal;
        this.icon = data.icon || null;
        this.isHidden = data.isHidden || false;
        this.unlockedAt = data.unlockedAt || null;
    }

    checkProgress(player) {
        const stats = player.operationStats[this.category];
        if (!stats) return 0;

        switch (this.category) {
            case 'addition':
            case 'subtraction':
            case 'multiplication':
            case 'division':
            case 'supermode':
                return stats.correctAnswers;
            case 'overall':
                return player.totalScore;
            case 'streak':
                return player.bestStreak;
            default:
                return 0;
        }
    }

    isUnlocked(player) {
        return this.checkProgress(player) >= this.requirement;
    }

    getProgressPercentage(player) {
        const progress = this.checkProgress(player);
        return Math.min(Math.round((progress / this.requirement) * 100), 100);
    }

    unlock() {
        this.unlockedAt = new Date().toISOString();
        return this;
    }

    getMedalColor() {
        const colors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2'
        };
        return colors[this.medal] || colors.bronze;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            requirement: this.requirement,
            points: this.points,
            medal: this.medal,
            icon: this.icon,
            isHidden: this.isHidden,
            unlockedAt: this.unlockedAt
        };
    }

    static fromJSON(data) {
        return new Achievement(data);
    }
}

const ACHIEVEMENT_DEFINITIONS = {
    addition: [
        { id: 'add_bronze', name: 'Addition Apprentice', description: 'Solve 50 addition problems correctly', requirement: 50, points: 50, medal: 'bronze', category: 'addition' },
        { id: 'add_silver', name: 'Addition Expert', description: 'Solve 200 addition problems correctly', requirement: 200, points: 200, medal: 'silver', category: 'addition' },
        { id: 'add_gold', name: 'Addition Master', description: 'Solve 500 addition problems correctly', requirement: 500, points: 500, medal: 'gold', category: 'addition' }
    ],
    subtraction: [
        { id: 'sub_bronze', name: 'Subtraction Starter', description: 'Solve 50 subtraction problems correctly', requirement: 50, points: 50, medal: 'bronze', category: 'subtraction' },
        { id: 'sub_silver', name: 'Subtraction Specialist', description: 'Solve 200 subtraction problems correctly', requirement: 200, points: 200, medal: 'silver', category: 'subtraction' },
        { id: 'sub_gold', name: 'Subtraction Champion', description: 'Solve 500 subtraction problems correctly', requirement: 500, points: 500, medal: 'gold', category: 'subtraction' }
    ],
    multiplication: [
        { id: 'mul_bronze', name: 'Multiplication Rookie', description: 'Solve 50 multiplication problems correctly', requirement: 50, points: 50, medal: 'bronze', category: 'multiplication' },
        { id: 'mul_silver', name: 'Multiplication Pro', description: 'Solve 200 multiplication problems correctly', requirement: 200, points: 200, medal: 'silver', category: 'multiplication' },
        { id: 'mul_gold', name: 'Multiplication Wizard', description: 'Solve 500 multiplication problems correctly', requirement: 500, points: 500, medal: 'gold', category: 'multiplication' }
    ],
    division: [
        { id: 'div_bronze', name: 'Division Beginner', description: 'Solve 50 division problems correctly', requirement: 50, points: 50, medal: 'bronze', category: 'division' },
        { id: 'div_silver', name: 'Division Expert', description: 'Solve 200 division problems correctly', requirement: 200, points: 200, medal: 'silver', category: 'division' },
        { id: 'div_gold', name: 'Division Master', description: 'Solve 500 division problems correctly', requirement: 500, points: 500, medal: 'gold', category: 'division' }
    ],
    special: [
        { id: 'super_bronze', name: 'Super Solver', description: 'Solve 25 Super Mode problems correctly', requirement: 25, points: 100, medal: 'bronze', category: 'supermode' },
        { id: 'super_silver', name: 'Super Expert', description: 'Solve 100 Super Mode problems correctly', requirement: 100, points: 300, medal: 'silver', category: 'supermode' },
        { id: 'super_gold', name: 'Super Champion', description: 'Solve 250 Super Mode problems correctly', requirement: 250, points: 750, medal: 'gold', category: 'supermode' },
        { id: 'streak_10', name: 'Perfect 10', description: 'Get 10 problems correct in a row', requirement: 10, points: 50, medal: 'bronze', category: 'streak' },
        { id: 'streak_25', name: 'Streak Master', description: 'Get 25 problems correct in a row', requirement: 25, points: 150, medal: 'silver', category: 'streak' },
        { id: 'streak_50', name: 'Unstoppable', description: 'Get 50 problems correct in a row', requirement: 50, points: 300, medal: 'gold', category: 'streak' }
    ]
};

export { Achievement, ACHIEVEMENT_DEFINITIONS };