import BaseOperation from './BaseOperation.js';

class Subtraction extends BaseOperation {
    constructor() {
        super('subtraction', '-', 'text-yellow-500');
    }

    generate(settings) {
        const a = Math.floor(Math.random() * settings.max) + settings.min;
        const b = Math.floor(Math.random() * settings.max) + settings.min;
        const num1 = Math.max(a, b);
        const num2 = Math.min(a, b);
        const correctAnswer = num1 - num2;
        
        return {
            num1,
            num2,
            correctAnswer,
            operation: this.symbol
        };
    }

    getDifficultySettings(difficulty) {
        const settings = {
            easy: { min: 1, max: 10 },
            medium: { min: 1, max: 25 },
            hard: { min: 10, max: 99 }
        };
        
        return settings[difficulty] || settings.medium;
    }

    getVisualHint() {
        return 'Take away blocks from the first number to find the difference!';
    }

    getExplanationPrompt(num1, num2) {
        return `Explain to a 7-year-old how to solve ${num1} - ${num2} step-by-step. Talk about taking away blocks or counting backwards. Be very simple, encouraging, and use short sentences. Break it down into easy steps.`;
    }
}

export default Subtraction;