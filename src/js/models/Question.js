class Question {
    constructor(data) {
        this.num1 = data.num1;
        this.num2 = data.num2;
        this.correctAnswer = data.correctAnswer;
        this.operation = data.operation;
        this.operationType = data.operationType;
        this.difficulty = data.difficulty;
        this.isComplex = data.isComplex || false;
        this.equation = data.equation || null;
        this.expression = data.expression || null;
        this.result = data.result || null;
        this.missingPosition = data.missingPosition || null;
        this.isDetective = data.isDetective || false;
        this.timeGenerated = new Date().toISOString();
        this.timeAnswered = null;
        this.userAnswer = null;
        this.isCorrect = null;
        this.hintsUsed = 0;
        this.explanationRequested = false;
        this.attempts = 0;
        this.maxAttempts = 2;
    }

    submitAnswer(answer, timeAnswered = new Date().toISOString()) {
        this.userAnswer = parseInt(answer);
        this.attempts++;
        this.timeAnswered = timeAnswered;
        this.isCorrect = this.userAnswer === this.correctAnswer;
        return this.isCorrect;
    }

    hasAttemptsLeft() {
        return this.attempts < this.maxAttempts;
    }

    isLastAttempt() {
        return this.attempts === this.maxAttempts - 1;
    }

    getResponseTime() {
        if (!this.timeAnswered) return null;
        
        const start = new Date(this.timeGenerated);
        const end = new Date(this.timeAnswered);
        return Math.round((end - start) / 1000);
    }

    useHint() {
        this.hintsUsed++;
    }

    requestExplanation() {
        this.explanationRequested = true;
    }

    getDisplayText() {
        if (this.isComplex && this.expression) {
            return `${this.expression} = ?`;
        }
        return `${this.num1} ${this.operation} ${this.num2} = ?`;
    }

    getPoints() {
        let basePoints = 10;
        
        if (this.operationType === 'supermode') {
            basePoints *= 2;
        }
        
        const responseTime = this.getResponseTime();
        if (responseTime && responseTime < 5) {
            basePoints += 5;
        }
        
        basePoints -= this.hintsUsed * 2;
        
        return Math.max(basePoints, 1);
    }

    getDifficultyBonus() {
        const bonuses = {
            easy: 0,
            medium: 2,
            hard: 5
        };
        return bonuses[this.difficulty] || 0;
    }

    toJSON() {
        return {
            num1: this.num1,
            num2: this.num2,
            correctAnswer: this.correctAnswer,
            operation: this.operation,
            operationType: this.operationType,
            difficulty: this.difficulty,
            isComplex: this.isComplex,
            equation: this.equation,
            expression: this.expression,
            result: this.result,
            missingPosition: this.missingPosition,
            isDetective: this.isDetective,
            timeGenerated: this.timeGenerated,
            timeAnswered: this.timeAnswered,
            userAnswer: this.userAnswer,
            isCorrect: this.isCorrect,
            hintsUsed: this.hintsUsed,
            explanationRequested: this.explanationRequested,
            attempts: this.attempts,
            maxAttempts: this.maxAttempts
        };
    }
}

export default Question;