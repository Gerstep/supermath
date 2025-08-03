import EventBus from './EventBus.js';
import GameState from './GameState.js';
import Player from '../models/Player.js';
import Question from '../models/Question.js';
import { Achievement, ACHIEVEMENT_DEFINITIONS } from '../models/Achievement.js';
import StorageService from '../services/StorageService.js';
import APIService from '../services/APIService.js';
import SoundService from '../services/SoundService.js';
import BlockVisualizer from '../ui/components/BlockVisualizer.js';
import ModalManager from '../ui/components/ModalManager.js';
import ScoreDisplay from '../ui/components/ScoreDisplay.js';
import Addition from '../operations/Addition.js';
import Subtraction from '../operations/Subtraction.js';
import Multiplication from '../operations/Multiplication.js';
import Division from '../operations/Division.js';
import SuperMode from '../operations/SuperMode.js';
import DetectiveOperation from '../operations/DetectiveOperation.js';

class Game {
    constructor() {
        this.eventBus = new EventBus();
        this.gameState = new GameState(this.eventBus);
        this.storageService = new StorageService();
        this.apiService = new APIService();
        this.soundService = new SoundService();
        this.blockVisualizer = new BlockVisualizer(this.eventBus);
        this.modalManager = new ModalManager(this.eventBus);
        this.scoreDisplay = new ScoreDisplay(this.eventBus);
        
        this.operations = {
            addition: new Addition(),
            subtraction: new Subtraction(),
            multiplication: new Multiplication(),
            division: new Division(),
            supermode: new SuperMode(),
            detective: new DetectiveOperation()
        };

        this.achievements = new Map();
        this.player = null;
        this.currentQuestion = null;
        this.isInitialized = false;

        this.setupEventListeners();
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await this.loadPlayer();
            this.loadAchievements();
            this.applyPlayerSettings();
            this.setupUI();
            this.setupKeyboardListeners();
            
            this.isInitialized = true;
            this.eventBus.emit('gameInitialized');
            
            console.log('Math Super Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            this.handleInitializationError(error);
        }
    }

    setupEventListeners() {
        this.eventBus.on('stateChanged', (data) => {
            this.handleStateChange(data);
        });

        this.eventBus.on('visualizationComplete', (data) => {
            this.handleVisualizationComplete(data);
        });

        this.eventBus.on('modalButtonClick', (data) => {
            this.handleModalButtonClick(data);
        });

        this.eventBus.on('achievementUnlocked', (data) => {
            this.handleAchievementUnlocked(data);
        });
    }

    async loadPlayer() {
        const playerData = this.storageService.getPlayerData();
        
        if (playerData) {
            this.player = Player.fromJSON(playerData);
        } else {
            this.player = new Player();
            this.storageService.savePlayerData(this.player.toJSON());
        }

        this.gameState.setState({ player: this.player });
    }

    loadAchievements() {
        Object.values(ACHIEVEMENT_DEFINITIONS).flat().forEach(achievementData => {
            const achievement = new Achievement(achievementData);
            this.achievements.set(achievement.id, achievement);
        });
    }

    applyPlayerSettings() {
        if (!this.player) return;
        
        const settings = this.player.settings;
        
        // Apply sound settings
        if (settings.soundEnabled !== undefined) {
            this.soundService.setEnabled(settings.soundEnabled);
        }
        
        // Apply music settings
        if (settings.musicEnabled !== undefined) {
            this.soundService.setMusicEnabled(settings.musicEnabled);
            
            // Start background music if enabled
            if (settings.musicEnabled) {
                setTimeout(() => {
                    this.soundService.startBackgroundMusic();
                }, 1000); // Start after a short delay
            }
        }
        
        // Update UI controls to reflect current settings
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        if (!this.player) return;
        
        const settings = this.player.settings;
        
        // Update difficulty select
        const difficultySelect = document.getElementById('difficulty-select');
        if (difficultySelect && settings.difficulty) {
            difficultySelect.value = settings.difficulty;
        }
        
        // Update sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = settings.soundEnabled !== false;
        }
        
        // Update music toggle
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.checked = settings.musicEnabled !== false;
        }
    }

    setupUI() {
        this.scoreDisplay.register('score', 'total');
        this.scoreDisplay.register('level-display', 'level');
        this.scoreDisplay.register('streak-display', 'streak');

        this.updateScoreDisplay();
        this.showMainMenu();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState.getState().currentScreen === 'game') {
                if (e.key === 'Enter') {
                    const answerInput = document.getElementById('answer-input');
                    if (answerInput && document.activeElement === answerInput) {
                        this.checkAnswer();
                    }
                } else if (e.key === 'Escape') {
                    this.showMainMenu();
                }
            }
        });
    }

    showMainMenu() {
        this.gameState.setState({ 
            currentScreen: 'menu',
            isGameActive: false 
        });

        const modeSelection = document.getElementById('mode-selection');
        const gameArea = document.getElementById('game-area');
        
        if (modeSelection) modeSelection.classList.remove('hidden');
        if (gameArea) gameArea.classList.add('hidden');

        this.updateScoreDisplay();
        this.showPlayerStats();
    }

    showPlayerStats() {
        const playerStatsContainer = document.getElementById('player-stats');
        if (playerStatsContainer && this.player) {
            playerStatsContainer.innerHTML = this.scoreDisplay.createMiniScoreDisplay(
                this.player.totalScore,
                this.player.level,
                this.player.streak
            );
        }
    }

    startGame(operationType) {
        if (!this.operations[operationType]) {
            console.error(`Operation ${operationType} not found`);
            return;
        }

        this.gameState.setState({
            currentScreen: 'game',
            gameMode: operationType,
            isGameActive: true
        });

        const modeSelection = document.getElementById('mode-selection');
        const gameArea = document.getElementById('game-area');
        
        if (modeSelection) modeSelection.classList.add('hidden');
        if (gameArea) gameArea.classList.remove('hidden');

        this.soundService.playButton();
        this.generateQuestion();
    }

    generateQuestion() {
        const gameMode = this.gameState.getState().gameMode;
        const difficulty = this.player.settings.difficulty;
        const operation = this.operations[gameMode];

        if (!operation) {
            console.error(`Operation ${gameMode} not found`);
            return;
        }

        const problemData = operation.generateProblem(difficulty);
        
        this.currentQuestion = new Question({
            ...problemData,
            operationType: gameMode,
            difficulty: difficulty
        });

        this.gameState.setState({ currentQuestion: this.currentQuestion });
        this.displayQuestion();
    }

    displayQuestion() {
        if (!this.currentQuestion) return;

        const standardProblem = document.getElementById('standard-problem');
        const complexProblem = document.getElementById('complex-problem');
        const answerInput = document.getElementById('answer-input');

        if (this.currentQuestion.isComplex) {
            // Hide standard problem display and show complex problem display
            if (standardProblem) standardProblem.classList.add('hidden');
            if (complexProblem) complexProblem.classList.remove('hidden');
            
            this.displayComplexQuestion();
            return;
        }

        // Check if this is Detective Mode
        if (this.currentQuestion.operationType === 'detective' || this.currentQuestion.isDetective) {
            // Show standard problem display for detective mode
            if (standardProblem) standardProblem.classList.remove('hidden');
            if (complexProblem) complexProblem.classList.add('hidden');
            
            this.displayDetectiveQuestion();
            return;
        }

        // Show standard problem display and hide complex problem display
        if (standardProblem) standardProblem.classList.remove('hidden');
        if (complexProblem) complexProblem.classList.add('hidden');

        const num1Display = document.getElementById('num1-display');
        const num2Display = document.getElementById('num2-display');
        const operatorDisplay = document.getElementById('operator-display');
        const questionMark = document.getElementById('question-mark');
        const answerBlocks = document.getElementById('answer-blocks');

        if (num1Display) num1Display.textContent = this.currentQuestion.num1;
        if (num2Display) num2Display.textContent = this.currentQuestion.num2;
        if (operatorDisplay) {
            const operation = this.operations[this.currentQuestion.operationType];
            operatorDisplay.textContent = operation.symbol;
            operatorDisplay.className = `operator ${operation.color}`;
        }

        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }

        if (questionMark) questionMark.classList.remove('hidden');
        if (answerBlocks) {
            answerBlocks.classList.add('hidden');
            answerBlocks.innerHTML = '';
        }

        this.visualizeQuestion();
    }

    displayComplexQuestion() {
        const problemExpression = document.getElementById('problem-expression');
        const answerInput = document.getElementById('answer-input');
        
        if (problemExpression && this.currentQuestion.expression) {
            problemExpression.textContent = this.currentQuestion.expression;
        }

        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }

        console.log('Displaying complex question:', this.currentQuestion.expression);
    }

    displayDetectiveQuestion() {
        const num1Display = document.getElementById('num1-display');
        const num2Display = document.getElementById('num2-display');
        const operatorDisplay = document.getElementById('operator-display');
        const questionMark = document.getElementById('question-mark');
        const answerBlocks = document.getElementById('answer-blocks');
        const answerInput = document.getElementById('answer-input');

        // Display case theme
        const operation = this.operations[this.currentQuestion.operationType];
        if (operation.getRandomCaseTheme) {
            const theme = operation.getRandomCaseTheme();
            console.log('Detective Case:', theme);
        }

        // Show numbers or mystery boxes
        if (num1Display) {
            num1Display.textContent = this.currentQuestion.num1 !== null ? this.currentQuestion.num1 : '?';
            num1Display.className = this.currentQuestion.num1 !== null ? 'number-display text-green-500' : 'number-display text-yellow-500';
        }
        
        if (num2Display) {
            num2Display.textContent = this.currentQuestion.num2 !== null ? this.currentQuestion.num2 : '?';
            num2Display.className = this.currentQuestion.num2 !== null ? 'number-display text-yellow-500' : 'number-display text-yellow-500';
        }

        if (operatorDisplay) {
            operatorDisplay.textContent = this.currentQuestion.operation;
            operatorDisplay.className = 'operator text-yellow-500';
        }

        // Show result or question mark
        if (questionMark) {
            if (this.currentQuestion.missingPosition === 'result') {
                questionMark.classList.remove('hidden');
                questionMark.textContent = '?';
            } else {
                questionMark.classList.add('hidden');
            }
        }

        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }

        if (answerBlocks) {
            answerBlocks.classList.add('hidden');
            answerBlocks.innerHTML = '';
        }

        this.visualizeDetectiveQuestion();
    }

    async visualizeQuestion() {
        if (!this.currentQuestion || this.currentQuestion.isComplex) return;

        const num1Blocks = document.getElementById('num1-blocks');
        const num2Blocks = document.getElementById('num2-blocks');

        if (num1Blocks && num2Blocks) {
            await this.blockVisualizer.drawBlocks(
                this.currentQuestion.num1, 
                num1Blocks, 
                'bg-green-400', 
                true
            );
            
            setTimeout(async () => {
                await this.blockVisualizer.drawBlocks(
                    this.currentQuestion.num2, 
                    num2Blocks, 
                    'bg-yellow-400', 
                    true
                );
            }, 300);
        }
    }

    async visualizeDetectiveQuestion() {
        if (!this.currentQuestion) return;

        const containers = {
            num1Container: document.getElementById('num1-blocks'),
            operatorContainer: document.getElementById('operator-display'),
            num2Container: document.getElementById('num2-blocks'),
            equalsContainer: document.querySelector('.number-section .operator'),
            resultContainer: document.getElementById('answer-blocks')
        };

        // Show result container for detective mode
        if (containers.resultContainer) {
            containers.resultContainer.classList.remove('hidden');
        }

        await this.blockVisualizer.animateDetectiveEquation(
            this.currentQuestion.equation,
            containers,
            this.currentQuestion
        );
    }

    checkAnswer() {
        if (!this.currentQuestion) return;

        const answerInput = document.getElementById('answer-input');
        if (!answerInput) return;

        const userAnswer = answerInput.value.trim();
        if (!userAnswer) return;

        const isCorrect = this.currentQuestion.submitAnswer(userAnswer);
        const points = this.currentQuestion.getPoints() + this.currentQuestion.getDifficultyBonus();

        this.player.recordAnswer(
            this.currentQuestion.operationType, 
            isCorrect, 
            isCorrect ? points : 0
        );

        if (isCorrect) {
            // Play special sound for Detective Mode
            if (this.currentQuestion.operationType === 'detective' || this.currentQuestion.isDetective) {
                this.soundService.playCaseClosed();
            } else {
                this.soundService.playCorrect();
            }
            this.showAnswerVisualization();
        } else {
            this.soundService.playIncorrect();
        }

        this.updateScoreDisplay();
        this.checkAchievements();
        this.saveProgress();
        this.showFeedback(isCorrect);
    }

    async showAnswerVisualization() {
        if (!this.currentQuestion) return;

        if (this.currentQuestion.isComplex) {
            // For complex questions, just highlight the answer in the expression
            const problemExpression = document.getElementById('problem-expression');
            if (problemExpression) {
                const fullExpression = `${this.currentQuestion.expression} = ${this.currentQuestion.correctAnswer}`;
                problemExpression.textContent = fullExpression;
                problemExpression.classList.add('text-green-600');
                setTimeout(() => {
                    problemExpression.classList.remove('text-green-600');
                    problemExpression.classList.add('text-gray-700');
                }, 2000);
            }
            return;
        }

        // Detective Mode visualization
        if (this.currentQuestion.operationType === 'detective' || this.currentQuestion.isDetective) {
            const containers = {
                num1Container: document.getElementById('num1-blocks'),
                num2Container: document.getElementById('num2-blocks'),
                resultContainer: document.getElementById('answer-blocks')
            };

            const answerInput = document.getElementById('answer-input');
            const userAnswer = answerInput ? parseInt(answerInput.value) : this.currentQuestion.correctAnswer;

            await this.blockVisualizer.revealDetectiveSolution(containers, this.currentQuestion, userAnswer);
            return;
        }

        const questionMark = document.getElementById('question-mark');
        const answerBlocks = document.getElementById('answer-blocks');

        if (questionMark) questionMark.classList.add('hidden');
        if (answerBlocks) {
            answerBlocks.classList.remove('hidden');
            await this.blockVisualizer.drawBlocks(
                this.currentQuestion.correctAnswer,
                answerBlocks,
                'bg-blue-400',
                true
            );
        }
    }

    showFeedback(isCorrect) {
        const onNext = () => {
            this.modalManager.close('feedback');
            this.generateQuestion();
        };

        const onExplain = async () => {
            this.modalManager.showLoadingExplanation();
            const operation = this.operations[this.currentQuestion.operationType];
            let prompt;
            
            if (this.currentQuestion.isComplex) {
                prompt = operation.getExplanationPrompt(this.currentQuestion.expression);
            } else {
                prompt = operation.getExplanationPrompt(
                    this.currentQuestion.num1,
                    this.currentQuestion.num2
                );
            }

            try {
                const explanation = await this.apiService.generateExplanation(
                    prompt,
                    this.currentQuestion.operationType
                );
                this.modalManager.showExplanation(explanation);
                this.currentQuestion.requestExplanation();
            } catch (error) {
                console.error('Error getting explanation:', error);
                this.modalManager.showExplanation('Sorry, I had trouble getting an explanation. Please try the next question!');
            }
        };

        this.modalManager.showFeedbackModal(
            isCorrect,
            this.currentQuestion,
            onNext,
            !isCorrect ? onExplain : null
        );
    }

    checkAchievements() {
        const unlockedAchievements = [];

        this.achievements.forEach((achievement, id) => {
            if (!this.player.hasAchievement(id) && achievement.isUnlocked(this.player)) {
                this.player.addAchievement(id);
                unlockedAchievements.push(achievement);
                this.eventBus.emit('achievementUnlocked', { achievement });
            }
        });

        return unlockedAchievements;
    }

    handleAchievementUnlocked(data) {
        const { achievement } = data;
        this.soundService.playAchievement();
        this.scoreDisplay.animateAchievementScore(achievement.points);
        this.player.addScore(achievement.points);
        this.updateScoreDisplay();
        
        setTimeout(() => {
            this.showAchievementNotification(achievement);
        }, 500);
    }

    showAchievementNotification(achievement) {
        const modal = this.modalManager.create('achievement-notification', {
            title: '🏆 Achievement Unlocked!',
            content: `
                <div class="text-center">
                    <div class="text-4xl mb-4">${this.getAchievementIcon(achievement.medal)}</div>
                    <h3 class="text-2xl font-bold mb-2">${achievement.name}</h3>
                    <p class="text-gray-600 mb-4">${achievement.description}</p>
                    <p class="text-lg font-bold text-blue-600">+${achievement.points} bonus points!</p>
                </div>
            `,
            type: 'success',
            buttons: [
                { text: 'Awesome!', type: 'success', action: 'close' }
            ]
        });

        this.modalManager.show('achievement-notification');
    }

    getAchievementIcon(medal) {
        const icons = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            platinum: '🏆'
        };
        return icons[medal] || '🏆';
    }

    updateScoreDisplay() {
        if (!this.player) return;

        this.scoreDisplay.update('score', this.player.totalScore);
        
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            this.scoreDisplay.update('level-display', this.player.level);
        }

        const streakDisplay = document.getElementById('streak-display');
        if (streakDisplay) {
            this.scoreDisplay.update('streak-display', this.player.streak);
        }
    }

    saveProgress() {
        if (this.player) {
            this.storageService.savePlayerData(this.player.toJSON());
            
            if (this.currentQuestion) {
                this.storageService.saveGameHistory({
                    timestamp: new Date().toISOString(),
                    question: this.currentQuestion.toJSON(),
                    playerScore: this.player.totalScore,
                    playerLevel: this.player.level
                });
            }
        }
    }

    handleStateChange(data) {
        const { changes } = data;
        
        if (changes.currentScreen) {
            this.eventBus.emit('screenChanged', {
                from: data.oldState.currentScreen,
                to: data.newState.currentScreen
            });
        }
    }

    handleVisualizationComplete(data) {
        console.log(`Visualization complete for ${data.operation}: ${data.result}`);
    }

    handleModalButtonClick(data) {
        console.log(`Modal button clicked: ${data.action} in ${data.modalId}`);
    }

    handleInitializationError(error) {
        console.error('Game initialization failed:', error);
        
        const errorModal = this.modalManager.create('initialization-error', {
            title: 'Initialization Error',
            content: `
                <p class="mb-4">There was a problem starting the game:</p>
                <p class="text-sm text-gray-600 mb-4">${error.message}</p>
                <p>Please refresh the page to try again.</p>
            `,
            type: 'error',
            buttons: [
                { text: 'Refresh Page', type: 'primary', action: 'refresh' }
            ],
            closable: false
        });

        this.eventBus.on('modalButtonClick', (data) => {
            if (data.modalId === 'initialization-error' && data.action === 'refresh') {
                window.location.reload();
            }
        });

        this.modalManager.show('initialization-error');
    }

    setApiKey(apiKey) {
        this.apiService.setApiKey(apiKey);
    }

    setSoundEnabled(enabled) {
        this.soundService.setEnabled(enabled);
        this.player.updateSettings({ soundEnabled: enabled });
        this.saveProgress();
    }

    setMusicEnabled(enabled) {
        this.soundService.setMusicEnabled(enabled);
        this.player.updateSettings({ musicEnabled: enabled });
        this.saveProgress();
    }

    setDifficulty(difficulty) {
        this.player.updateSettings({ difficulty });
        this.saveProgress();
    }

    getGameStatus() {
        return {
            initialized: this.isInitialized,
            currentScreen: this.gameState.getState().currentScreen,
            gameMode: this.gameState.getState().gameMode,
            isGameActive: this.gameState.getState().isGameActive,
            player: this.player ? {
                score: this.player.totalScore,
                level: this.player.level,
                streak: this.player.streak
            } : null,
            services: {
                storage: this.storageService.getStorageInfo(),
                api: this.apiService.getStatus(),
                sound: this.soundService.getStatus()
            }
        };
    }

    destroy() {
        this.eventBus.clear();
        this.modalManager.closeAll();
        this.scoreDisplay.resetAll();
        this.isInitialized = false;
    }
}

export default Game;