class BaseOperation {
    constructor(name, symbol, color) {
        this.name = name;
        this.symbol = symbol;
        this.color = color;
    }

    generate(difficulty) {
        throw new Error('generate() must be implemented by subclass');
    }

    validate(answer, correctAnswer) {
        return parseInt(answer) === parseInt(correctAnswer);
    }

    getExplanationPrompt(num1, num2, operation) {
        return `Explain to a 7-year-old how to solve ${num1} ${operation} ${num2} step-by-step. Be very simple, encouraging, and use short sentences. Break it down into easy steps. Don't mention the wrong answer, just explain how to get the correct one.`;
    }

    getDifficultySettings(difficulty) {
        const settings = {
            easy: { min: 1, max: 10 },
            medium: { min: 1, max: 25 },
            hard: { min: 10, max: 99 }
        };
        
        return settings[difficulty] || settings.medium;
    }

    generateProblem(difficulty) {
        const settings = this.getDifficultySettings(difficulty);
        return this.generate(settings);
    }

    getVisualHint() {
        return `Use blocks to help visualize this ${this.name} problem.`;
    }
}

export default BaseOperation;