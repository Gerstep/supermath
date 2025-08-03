import BaseOperation from './BaseOperation.js';

class SuperMode extends BaseOperation {
    constructor() {
        super('supermode', '±', 'text-gradient');
    }

    generate(settings) {
        const termCount = Math.floor(Math.random() * 3) + 2;
        const startNumber = Math.floor(Math.random() * 20) + 10;
        
        let equation = [startNumber];
        let result = startNumber;
        let expressionParts = [startNumber.toString()];
        
        for (let i = 1; i < termCount; i++) {
            const operation = Math.random() > 0.5 ? '+' : '-';
            const number = Math.floor(Math.random() * 15) + 1;
            
            equation.push({ operation, number });
            expressionParts.push(` ${operation} ${number}`);
            
            if (operation === '+') {
                result += number;
            } else {
                result -= number;
                if (result < 0) {
                    result += number * 2;
                    equation[equation.length - 1].operation = '+';
                    expressionParts[expressionParts.length - 1] = ` + ${number}`;
                }
            }
        }
        
        return {
            num1: null,
            num2: null,
            correctAnswer: result,
            operation: this.symbol,
            equation: equation,
            expression: expressionParts.join(''),
            isComplex: true
        };
    }

    getDifficultySettings(difficulty) {
        const settings = {
            easy: { min: 1, max: 10, terms: 2 },
            medium: { min: 1, max: 15, terms: 3 },
            hard: { min: 5, max: 25, terms: 4 }
        };
        
        return settings[difficulty] || settings.medium;
    }

    getVisualHint() {
        return 'Work through each operation step by step!';
    }

    getExplanationPrompt(expression) {
        return `Explain to a 7-year-old how to solve this step by step: ${expression}. Break it down into simple steps, working from left to right. Be very encouraging and use short sentences.`;
    }

    getScoreMultiplier() {
        return 2;
    }
}

export default SuperMode;