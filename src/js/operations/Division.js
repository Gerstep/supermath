import BaseOperation from './BaseOperation.js';

class Division extends BaseOperation {
    constructor() {
        super('division', '÷', 'text-purple-500');
    }

    generate(settings) {
        const maxQuotient = Math.min(settings.maxResult || 20, 20);
        const maxDivisor = Math.min(settings.max, 12);
        
        const quotient = Math.floor(Math.random() * maxQuotient) + 1;
        const divisor = Math.floor(Math.random() * maxDivisor) + 1;
        const dividend = divisor * quotient;
        
        return {
            num1: dividend,
            num2: divisor,
            correctAnswer: quotient,
            operation: this.symbol
        };
    }

    getDifficultySettings(difficulty) {
        const settings = {
            easy: { min: 1, max: 5, maxResult: 10 },
            medium: { min: 1, max: 10, maxResult: 50 },
            hard: { min: 2, max: 15, maxResult: 100 }
        };
        
        return settings[difficulty] || settings.medium;
    }

    getVisualHint() {
        return 'Share the blocks equally into groups!';
    }

    getExplanationPrompt(num1, num2) {
        return `Explain to a 7-year-old how to solve ${num1} ÷ ${num2} step-by-step. Talk about sharing blocks equally into groups or repeated subtraction. Be very simple, encouraging, and use short sentences. Break it down into easy steps.`;
    }

    getVisualMode() {
        return 'grouping';
    }
}

export default Division;