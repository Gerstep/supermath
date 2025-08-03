class Player {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.totalScore = data.totalScore || 0;
        this.operationStats = data.operationStats || {
            addition: { score: 0, questionsAnswered: 0, correctAnswers: 0 },
            subtraction: { score: 0, questionsAnswered: 0, correctAnswers: 0 },
            multiplication: { score: 0, questionsAnswered: 0, correctAnswers: 0 },
            division: { score: 0, questionsAnswered: 0, correctAnswers: 0 },
            supermode: { score: 0, questionsAnswered: 0, correctAnswers: 0 }
        };
        this.achievements = data.achievements || [];
        this.settings = data.settings || {
            difficulty: 'medium',
            soundEnabled: true,
            animationSpeed: 'normal'
        };
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastPlayed = data.lastPlayed || new Date().toISOString();
        this.level = data.level || 1;
        this.streak = data.streak || 0;
        this.bestStreak = data.bestStreak || 0;
    }

    generateId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    recordAnswer(operation, isCorrect, points = 10) {
        if (!this.operationStats[operation]) {
            this.operationStats[operation] = { score: 0, questionsAnswered: 0, correctAnswers: 0 };
        }

        this.operationStats[operation].questionsAnswered++;
        
        if (isCorrect) {
            this.operationStats[operation].correctAnswers++;
            this.operationStats[operation].score += points;
            this.totalScore += points;
            this.streak++;
            
            if (this.streak > this.bestStreak) {
                this.bestStreak = this.streak;
            }
        } else {
            this.streak = 0;
        }

        this.lastPlayed = new Date().toISOString();
        
        if (this.totalScore >= this.level * 50) {
            this.level++;
        }
    }

    getAccuracy(operation) {
        const stats = this.operationStats[operation];
        if (!stats || stats.questionsAnswered === 0) return 0;
        
        return Math.round((stats.correctAnswers / stats.questionsAnswered) * 100 * 100) / 100;
    }

    getOverallAccuracy() {
        let totalCorrect = 0;
        let totalAnswered = 0;
        
        Object.values(this.operationStats).forEach(stats => {
            totalCorrect += stats.correctAnswers;
            totalAnswered += stats.questionsAnswered;
        });
        
        if (totalAnswered === 0) return 0;
        return Math.round((totalCorrect / totalAnswered) * 100 * 100) / 100;
    }

    addScore(points) {
        if (points < 0) {
            throw new Error('Score cannot be negative');
        }
        this.totalScore += points;
    }

    addAchievement(achievementId) {
        if (!this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            return true;
        }
        return false;
    }

    hasAchievement(achievementId) {
        return this.achievements.includes(achievementId);
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    toJSON() {
        return {
            id: this.id,
            totalScore: this.totalScore,
            operationStats: this.operationStats,
            achievements: this.achievements,
            settings: this.settings,
            createdAt: this.createdAt,
            lastPlayed: this.lastPlayed,
            level: this.level,
            streak: this.streak,
            bestStreak: this.bestStreak
        };
    }

    static fromJSON(data) {
        return new Player(data);
    }
}

export default Player;