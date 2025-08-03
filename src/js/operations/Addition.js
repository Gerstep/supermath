import BaseOperation from './BaseOperation.js';

class Addition extends BaseOperation {
    constructor() {
        super('addition', '+', 'text-green-500');
    }

    generate(settings) {
        const num1 = Math.floor(Math.random() * settings.max) + settings.min;
        const num2 = Math.floor(Math.random() * settings.max) + settings.min;
        const correctAnswer = num1 + num2;
        
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
        return 'Count all the blocks together to find the sum!';
    }

    getExplanationPrompt(num1, num2) {
        return `Explain to a 7-year-old how to solve ${num1} + ${num2} step-by-step. Talk about counting blocks or using fingers. Be very simple, encouraging, and use short sentences. Break it down into easy steps.`;
    }
}

export default Addition;