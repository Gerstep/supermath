// DetectiveOperation tests using Jest
import DetectiveOperation from '../../../src/js/operations/DetectiveOperation.js';

describe('DetectiveOperation Tests', () => {
    let detective;

    beforeEach(() => {
        detective = new DetectiveOperation();
    });

    test('should create operation with correct properties', () => {
        expect(detective.name).toBe('detective');
        expect(detective.symbol).toBe('🕵️');
        expect(detective.color).toBe('text-yellow-500');
    });

    test('should generate problems with correct structure', () => {
        const settings = { min: 1, max: 20 };
        const problem = detective.generate(settings);

        expect(problem).toEqual(expect.objectContaining({
            correctAnswer: expect.any(Number),
            operation: expect.stringMatching(/[+\-]/),
            equation: expect.any(String),
            expression: expect.any(String),
            result: expect.any(Number),
            missingPosition: expect.stringMatching(/first|second|result/),
            visualHint: expect.any(String),
            operationType: 'detective',
            isDetective: true
        }));
    });

    test('should generate addition problems correctly', () => {
        // Run multiple times to test different variations
        const settings = { min: 1, max: 10 };
        
        for (let i = 0; i < 20; i++) {
            const problem = detective.generate(settings);
            
            if (problem.operation === '+') {
                // Verify the math is correct
                let num1 = problem.num1;
                let num2 = problem.num2;
                let result = problem.result;
                
                if (problem.missingPosition === 'first') {
                    expect(problem.correctAnswer + num2).toBe(result);
                    expect(num1).toBeNull();
                } else if (problem.missingPosition === 'second') {
                    expect(num1 + problem.correctAnswer).toBe(result);
                    expect(num2).toBeNull();
                } else { // result
                    expect(num1 + num2).toBe(problem.correctAnswer);
                }
            }
        }
    });

    test('should generate subtraction problems correctly', () => {
        const settings = { min: 1, max: 10 };
        
        for (let i = 0; i < 20; i++) {
            const problem = detective.generate(settings);
            
            if (problem.operation === '-') {
                // Verify the math is correct
                let num1 = problem.num1;
                let num2 = problem.num2;
                let result = problem.result;
                
                if (problem.missingPosition === 'first') {
                    expect(problem.correctAnswer - num2).toBe(result);
                    expect(num1).toBeNull();
                } else if (problem.missingPosition === 'second') {
                    expect(num1 - problem.correctAnswer).toBe(result);
                    expect(num2).toBeNull();
                } else { // result
                    expect(num1 - num2).toBe(problem.correctAnswer);
                }
            }
        }
    });

    test('should respect difficulty settings', () => {
        const easySettings = detective.getDifficultySettings('easy');
        const mediumSettings = detective.getDifficultySettings('medium');
        const hardSettings = detective.getDifficultySettings('hard');

        expect(easySettings).toEqual({ min: 1, max: 20 });
        expect(mediumSettings).toEqual({ min: 5, max: 50 });
        expect(hardSettings).toEqual({ min: 10, max: 99 });
        
        // Test with default
        const defaultSettings = detective.getDifficultySettings('unknown');
        expect(defaultSettings).toEqual(mediumSettings);
    });

    test('should provide case themes', () => {
        const themes = detective.getCaseThemes();
        expect(themes).toHaveLength(5);
        expect(themes).toContain('🕵️ The Case of the Missing Number');
        
        const randomTheme = detective.getRandomCaseTheme();
        expect(themes).toContain(randomTheme);
    });

    test('should have correct score multiplier', () => {
        expect(detective.getScoreMultiplier()).toBe(1.5);
    });

    test('should generate appropriate visual hints', () => {
        const settings = { min: 1, max: 10 };
        
        for (let i = 0; i < 10; i++) {
            const problem = detective.generate(settings);
            
            expect(problem.visualHint).toContain('What');
            expect(problem.visualHint).toMatch(/equals|makes|is|minus|plus|added|subtracted/i);
        }
    });

    test('should generate equations with question marks in correct positions', () => {
        const settings = { min: 1, max: 10 };
        
        for (let i = 0; i < 20; i++) {
            const problem = detective.generate(settings);
            
            if (problem.missingPosition === 'first') {
                expect(problem.equation).toMatch(/^\? [+\-] \d+ = \d+$/);
            } else if (problem.missingPosition === 'second') {
                expect(problem.equation).toMatch(/^\d+ [+\-] \? = \d+$/);
            } else { // result
                expect(problem.equation).toMatch(/^\d+ [+\-] \d+ = \?$/);
            }
        }
    });

    test('should provide explanation prompt', () => {
        const prompt = detective.getExplanationPrompt('12 + ? = 19', 'What number added to 12 makes 19?');
        
        expect(prompt).toContain('7-year-old detective');
        expect(prompt).toContain('12 + ? = 19');
        expect(prompt).toContain('What number added to 12 makes 19?');
        expect(prompt).toContain('step-by-step');
    });

    test('should determine problem types correctly', () => {
        expect(detective.getProblemType('first', 'addition')).toBe('missing_addend_1');
        expect(detective.getProblemType('second', 'addition')).toBe('missing_addend_2');
        expect(detective.getProblemType('result', 'addition')).toBe('missing_sum');
        
        expect(detective.getProblemType('first', 'subtraction')).toBe('missing_minuend');
        expect(detective.getProblemType('second', 'subtraction')).toBe('missing_subtrahend');
        expect(detective.getProblemType('result', 'subtraction')).toBe('missing_difference');
        
        expect(detective.getProblemType('unknown', 'unknown')).toBe('unknown');
    });

    test('should generate problems within reasonable range', () => {
        const settings = { min: 5, max: 15 };
        
        for (let i = 0; i < 20; i++) {
            const problem = detective.generate(settings);
            
            // Check that non-null operands are reasonable
            // Note: For subtraction, minuend might be slightly larger to ensure positive results
            if (problem.num1 !== null) {
                expect(problem.num1).toBeGreaterThanOrEqual(settings.min);
                expect(problem.num1).toBeLessThanOrEqual(settings.max + 10); // Allow some margin for subtraction
            }
            if (problem.num2 !== null) {
                expect(problem.num2).toBeGreaterThanOrEqual(1); // Should be at least 1
                if (problem.operation === '+') {
                    expect(problem.num2).toBeLessThanOrEqual(settings.max);
                }
            }
            
            // Result should always be positive
            expect(problem.result).toBeGreaterThan(0);
            expect(problem.correctAnswer).toBeGreaterThan(0);
        }
    });
});