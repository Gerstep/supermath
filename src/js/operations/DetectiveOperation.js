import BaseOperation from './BaseOperation.js';

class DetectiveOperation extends BaseOperation {
    constructor() {
        super('detective', '🕵️', 'text-yellow-500');
    }

    generate(settings) {
        const operations = ['addition', 'subtraction'];
        const operationType = operations[Math.floor(Math.random() * operations.length)];
        
        let num1, num2, correctAnswer, equation, visualHint;
        let missingPosition, result;

        if (operationType === 'addition') {
            // Generate two numbers for addition
            const operand1 = Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min;
            const operand2 = Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min;
            result = operand1 + operand2;

            // Randomly choose which part is missing (0, 1, or 2)
            const missingPart = Math.floor(Math.random() * 3);

            switch (missingPart) {
                case 0: // ? + B = C
                    num1 = null;
                    num2 = operand2;
                    correctAnswer = operand1;
                    equation = `? + ${num2} = ${result}`;
                    missingPosition = 'first';
                    visualHint = `What number plus ${num2} equals ${result}?`;
                    break;
                case 1: // A + ? = C
                    num1 = operand1;
                    num2 = null;
                    correctAnswer = operand2;
                    equation = `${num1} + ? = ${result}`;
                    missingPosition = 'second';
                    visualHint = `What number added to ${num1} makes ${result}?`;
                    break;
                default: // A + B = ?
                    num1 = operand1;
                    num2 = operand2;
                    correctAnswer = result;
                    equation = `${num1} + ${num2} = ?`;
                    missingPosition = 'result';
                    visualHint = `What is ${num1} plus ${num2}?`;
                    break;
            }
        } else { // subtraction
            // Generate numbers ensuring positive result
            const minuend = Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min + 5; // Add 5 to ensure positive results
            const subtrahend = Math.floor(Math.random() * Math.min(minuend - 1, settings.max)) + 1;
            result = minuend - subtrahend;

            // Randomly choose which part is missing
            const missingPart = Math.floor(Math.random() * 3);

            switch (missingPart) {
                case 0: // ? - B = C
                    num1 = null;
                    num2 = subtrahend;
                    correctAnswer = minuend;
                    equation = `? - ${num2} = ${result}`;
                    missingPosition = 'first';
                    visualHint = `What number minus ${num2} equals ${result}?`;
                    break;
                case 1: // A - ? = C
                    num1 = minuend;
                    num2 = null;
                    correctAnswer = subtrahend;
                    equation = `${num1} - ? = ${result}`;
                    missingPosition = 'second';
                    visualHint = `What number subtracted from ${num1} leaves ${result}?`;
                    break;
                default: // A - B = ?
                    num1 = minuend;
                    num2 = subtrahend;
                    correctAnswer = result;
                    equation = `${num1} - ${num2} = ?`;
                    missingPosition = 'result';
                    visualHint = `What is ${num1} minus ${num2}?`;
                    break;
            }
        }

        return {
            num1,
            num2,
            correctAnswer,
            operation: operationType === 'addition' ? '+' : '-',
            equation,
            expression: equation,
            result: result,
            missingPosition,
            visualHint,
            operationType: 'detective',
            isDetective: true
        };
    }

    getDifficultySettings(difficulty) {
        const settings = {
            easy: { min: 1, max: 20 },      // Focus on A + ? = C with numbers up to 20
            medium: { min: 5, max: 50 },    // Mix all variations with numbers up to 50
            hard: { min: 10, max: 99 }      // Complex problems with larger numbers
        };
        
        return settings[difficulty] || settings.medium;
    }

    getVisualHint() {
        return 'Look for clues in the blocks to solve the mystery!';
    }

    getExplanationPrompt(equation, visualHint) {
        return `Explain to a 7-year-old detective how to solve this mystery equation: ${equation}. Help them understand: ${visualHint}. Use simple words and think step-by-step like a detective finding clues.`;
    }

    getScoreMultiplier() {
        return 1.5; // Detective mode gives 50% bonus points
    }

    getCaseThemes() {
        return [
            "🕵️ The Case of the Missing Number",
            "🔍 Detective's Number Mystery", 
            "🎯 The Great Math Investigation",
            "🔎 Solving the Number Puzzle",
            "🕵️‍♀️ Detective Mode: Find the Clue!"
        ];
    }

    getRandomCaseTheme() {
        const themes = this.getCaseThemes();
        return themes[Math.floor(Math.random() * themes.length)];
    }

    // Helper method to determine what type of detective problem this is
    getProblemType(missingPosition, operation) {
        const types = {
            addition: {
                first: 'missing_addend_1',
                second: 'missing_addend_2', 
                result: 'missing_sum'
            },
            subtraction: {
                first: 'missing_minuend',
                second: 'missing_subtrahend',
                result: 'missing_difference'
            }
        };
        
        return types[operation]?.[missingPosition] || 'unknown';
    }
}

export default DetectiveOperation;