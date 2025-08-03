# Math Super Game

A visual, interactive math learning game designed for children aged 7-8 years old. The game helps young learners understand mathematical operations through visual block representations and engaging gameplay.

## Features

### Current Functionality
- **Three Math Operations**: Addition, Subtraction, and Multiplication
- **Visual Learning**: Numbers are represented as blocks arranged in stacks of ten to aid understanding
- **Progressive Difficulty**: Levels increase automatically as the player scores points
- **Real-time Feedback**: Immediate visual and textual feedback for answers
- **AI-Powered Explanations**: Integration with Google's Gemini API to provide step-by-step explanations for incorrect answers
- **Responsive Design**: Works on desktop and mobile devices

### Game Modes
1. **Addition (+)**: Practice adding two numbers with visual block representation
2. **Subtraction (-)**: Learn subtraction with larger number minus smaller number
3. **Multiplication (×)**: Multiply numbers with visual feedback

## Technical Architecture

### Single-File Structure
The entire game is contained in a single `index.html` file using:
- **HTML5** for structure
- **Tailwind CSS** (CDN) for styling
- **Vanilla JavaScript** for game logic
- **Google Fonts** (Nunito) for typography
- **Google Gemini API** for AI explanations

### Key Components

#### Visual Block System
- Numbers are represented as visual blocks in stacks of 10
- Blocks are dynamically generated HTML div elements
- Color-coded by operation type (green for first number, yellow for second, blue for answer)
- Animations provide visual feedback during correct answers

#### Scoring System
- Players earn 10 points per correct answer
- Level increases every 50 points
- Higher levels generate more complex problems

#### AI Integration
- Uses Google Gemini 2.5 Flash Preview model
- Provides child-friendly explanations for incorrect answers
- Explanations are contextual and step-by-step

## Game Flow

1. **Mode Selection**: Player chooses from Addition, Subtraction, or Multiplication
2. **Problem Generation**: Random numbers are generated based on current level
3. **Visual Display**: Numbers appear as both digits and block representations
4. **Input**: Player enters their answer in a large, clear input field
5. **Feedback**: Immediate feedback with option for AI explanation if wrong
6. **Progression**: Automatic advancement to next question

## Code Structure

### Main Variables
- `currentMode`: Current operation type (addition/subtraction/multiplication)
- `num1`, `num2`: The two numbers in the current problem
- `correctAnswer`: The correct result
- `score`: Player's current score
- `level`: Current difficulty level

### Key Functions
- `startGame(mode)`: Initializes game with selected operation
- `nextQuestion()`: Generates new problem and updates display
- `drawBlocks(number, container, colorClass)`: Creates visual block representation
- `checkAnswer()`: Validates player input and provides feedback
- `showFeedback(isCorrect)`: Displays success/failure modal
- `getExplanation()`: Calls Gemini API for step-by-step explanation

### Difficulty Scaling
- **Addition/Subtraction**: Numbers range from 1 to (level × 5)
- **Multiplication**: Numbers range from 1 to min(level × 2, 10)

## Visual Design

### Color Palette
- **Primary Blue** (#3B82F6): Operators and branding
- **Green** (#10B981): Addition and correct feedback
- **Yellow** (#F59E0B): Subtraction
- **Red** (#EF4444): Multiplication and incorrect feedback
- **Purple** (#8B5CF6): Explanation button

### Typography
- **Nunito Font Family**: Friendly, rounded font appropriate for children
- **Large Text Sizes**: Easy reading for young learners
- **Bold Weights**: Clear visual hierarchy

## Browser Support
- Modern browsers with ES6+ support
- Mobile-responsive design
- Touch-friendly interface for tablets

## API Dependencies
- **Tailwind CSS CDN**: For styling framework
- **Google Fonts**: For Nunito font family
- **Google Gemini API**: For AI-powered explanations (requires API key)

## Installation & Setup

1. Clone or download the project
2. Open `index.html` in a web browser
3. For AI explanations to work, add your Google Gemini API key to line 311

## Educational Value

### Learning Objectives
- **Number Recognition**: Visual and numerical representation
- **Operation Understanding**: Clear visual demonstration of math operations
- **Problem Solving**: Immediate feedback and explanation system
- **Progressive Learning**: Automatic difficulty adjustment

### Teaching Methods
- **Visual-Spatial Learning**: Block representations help visualize quantities
- **Immediate Feedback**: Reinforcement learning principles
- **Scaffolding**: AI explanations provide guided support
- **Gamification**: Scoring system encourages continued engagement

## File Structure
```
supermath/
└── index.html (Complete single-file application)
```

The project follows a minimalist approach with all functionality contained in one file for easy deployment and maintenance.