import BaseOperation from './BaseOperation.js';

class Multiplication extends BaseOperation {
    constructor() {
        super('multiplication', '×', 'text-red-500');
    }

    generate(settings) {
        const maxFactor = Math.min(settings.max, 12);
        const num1 = Math.floor(Math.random() * maxFactor) + 1;
        const num2 = Math.floor(Math.random() * maxFactor) + 1;
        const correctAnswer = num1 * num2;
        
        return {
            num1,
            num2,
            correctAnswer,
            operation: this.symbol
        };
    }

    getDifficultySettings(difficulty) {
        const settings = {
            easy: { min: 1, max: 5 },
            medium: { min: 1, max: 10 },
            hard: { min: 5, max: 15 }
        };
        
        return settings[difficulty] || settings.medium;
    }

    getVisualHint() {
        return 'Think of groups of blocks - how many blocks in total?';
    }

    getExplanationPrompt(num1, num2) {
        return `Explain to a 7-year-old how to solve ${num1} × ${num2} step-by-step. Talk about making groups of blocks or repeated addition. Be very simple, encouraging, and use short sentences. Break it down into easy steps.`;
    }
}

export default Multiplication;