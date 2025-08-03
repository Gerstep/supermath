# Math Super Game - Enhanced Implementation Plan v2

This document has been updated to include two major feature enhancements:
1.  **Background Music:** Providing an immersive audio experience.
2.  **Detective Mode:** A new game mode for developing pre-algebraic thinking.

---

## Feature 1: Background Music Addition

### Overview
This section outlines the implementation plan for adding background music functionality to the Math Super Game. The enhancement includes looping background music during gameplay with a toggle button to turn the music on/off, providing an improved audio experience while maintaining user control.

### New Feature Requirements

#### Requirements
- Continuous background music during gameplay
- Music loops seamlessly using `assets/sounds/bg-music.mp3`
- Volume control (not too loud - approximately 30% of max volume)
- Music toggle button (on/off)
- Persistent music preference setting
- Smooth fade in/out transitions
- Music pauses during modal explanations to avoid distraction

_... (The rest of the Background Music plan remains the same as you provided) ..._

---
---

## Feature 2: "Detective Mode" (Find the Missing Number)

### Overview
This new game mode reframes standard math problems into puzzles that encourage pre-algebraic thinking by asking the child to find a missing part of an equation. It transforms practice into a fun "mystery-solving" activity.

### Core Concept & Educational Value
-   **Goal:** Instead of solving `A + B = ?`, the child solves problems like `A + ? = C` or `? x B = C`.
-   **Benefit:** This teaches flexible thinking about the relationship between numbers and introduces the foundational concepts of variables and balancing equations.
-   **Theme:** The child acts as a "Math Detective," and the missing number is the "clue" needed to solve the case.

### Gameplay Loop & Problem Variations
1.  **The Case:** The game presents an equation with a missing number, framed as a "case file."
    *   `12 + ? = 19` (Find the missing addend)
    *   `? + 5 = 22` (Find the missing addend)
    *   `15 - ? = 8` (Find the missing subtrahend)
    *   `? - 6 = 10` (Find the missing minuend)
2.  **The Clues (Visualizer):** The block visualizer provides visual hints. For `12 + ? = 19`, it would display:
    *   A group of 12 blocks.
    *   A plus sign.
    *   A "mystery box" icon (`?`) or an outlined, empty area.
    *   An equals sign.
    *   A group of 19 blocks on the other side of the equation.
3.  **The Solution:** The child enters their answer (7).
4.  **Case Closed:** The "mystery box" animates, filling with 7 blocks, and the full equation is shown. A satisfying "case closed" or "clue found" sound effect plays.

### Technical Implementation

#### 1. New Operation Class (`DetectiveOperation.js`)
A new class will extend `BaseOperation.js` to handle the unique logic of generating and visualizing these puzzle-like problems.

```javascript
// src/js/operations/DetectiveOperation.js
import { BaseOperation } from './BaseOperation.js';

class DetectiveOperation extends BaseOperation {
    constructor() {
        super('Detective', '?', 'text-yellow-500'); // Name, Symbol, Color
    }

    generate(difficulty) {
        const operationType = Math.random() > 0.5 ? 'addition' : 'subtraction';
        const { min, max } = difficulty.addition; // Use addition/subtraction difficulty ranges

        let num1, num2, correctAnswer, equation;

        const operand1 = Math.floor(Math.random() * (max - min + 1)) + min;
        const operand2 = Math.floor(Math.random() * (max - min + 1)) + min;
        const result = operand1 + operand2;

        const missingPart = Math.floor(Math.random() * 3); // 0, 1, or 2 to decide which part is missing

        if (operationType === 'addition') {
            switch (missingPart) {
                case 0: // ? + B = C
                    num1 = null; num2 = operand2; correctAnswer = operand1;
                    equation = `? + ${num2} = ${result}`;
                    break;
                case 1: // A + ? = C
                    num1 = operand1; num2 = null; correctAnswer = operand2;
                    equation = `${num1} + ? = ${result}`;
                    break;
                default: // A + B = ?
                    num1 = operand1; num2 = operand2; correctAnswer = result;
                    equation = `${num1} + ${num2} = ?`;
                    break;
            }
        } else { // Subtraction
            // Similar logic for subtraction to create ? - B = C, A - ? = C, etc.
        }

        return { num1, num2, correctAnswer, equation, operation: this.symbol };
    }

    getExplanationPrompt(num1, num2, result, equation) {
        return `Explain to a 7-year-old how to find the missing number in the equation ${equation}`;
    }
}
```

#### 2. UI and Game Flow Integration
-   **Add "Detective Mode" Button:** A new button will be added to the main menu screen alongside the existing operations.
-   **Update `Game.js`:** The main game controller will need to handle the new `DetectiveOperation`.
-   **Enhance `BlockVisualizer.js`:** The visualizer will be updated to render the "mystery box" for the `null` number in the `Question` object. It will need to show blocks for both sides of the equation.

```javascript
// src/js/ui/components/BlockVisualizer.js - Conceptual change
function render(question) {
    // If question.num1 is null, render a mystery box.
    // If question.num2 is null, render a mystery box.
    // Also render the result on the other side of the equals sign.
}
```

#### 3. New Sound Effect
-   **File:** `assets/sounds/case-closed.mp3`
-   **Action:** Plays upon correctly solving a Detective Mode problem.
-   **Integration:** The `SoundService` will be updated to include this new sound.

### Difficulty Scaling
The `difficultySettings` object will be referenced to control the complexity:
-   **Easy:** Focus on `A + ? = C` with numbers up to 20.
-   **Medium:** Mix all addition and subtraction variations with numbers up to 50.
-   **Hard:** Introduce missing number problems for multiplication and division (`5 x ? = 20`) using their respective difficulty settings.

### Implementation Tasks Breakdown

#### Phase 1: Core Logic & UI (2-3 hours)
1.  **Create `DetectiveOperation.js`:** Implement the problem generation logic for all addition and subtraction variations.
2.  **Update `Game.js`:** Add "Detective" to the list of available modes.
3.  **Add UI Button:** Create the "Detective Mode" button on the main menu.
4.  **New Audio:** Add `case-closed.mp3` to `SoundService`.

#### Phase 2: Visualization and Polish (2-3 hours)
1.  **Enhance `BlockVisualizer.js`:** Implement the logic to display the equation with a missing element and the result.
2.  **Add Animations:** Create the "Case Closed" animation where the mystery box fills with the correct number of blocks.
3.  **Refine Difficulty:** Implement the full difficulty scaling, including multiplication and division for the "Hard" level.

#### Phase 3: Testing (1-2 hours)
1.  **Unit Tests:** Create `tests/unit/operations/DetectiveOperation.test.js` to verify problem generation logic.
2.  **Integration Tests:** Ensure the full game loop (select mode -> solve -> get feedback) works correctly.
3.  **E2E Tests:** Add a test case to simulate a user playing through a full session of Detective Mode.

### Success Metrics
-   **Educational Value:** Users demonstrate improved ability to solve for unknown variables in subsequent sessions.
-   **Engagement:** "Detective Mode" achieves a session duration comparable to or higher than other individual operation modes.
-   **Technical Quality:** The feature is implemented with zero new bugs and maintains high performance.
