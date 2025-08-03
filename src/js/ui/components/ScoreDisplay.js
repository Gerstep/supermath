class ScoreDisplay {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.elements = new Map();
        this.animationQueue = [];
        this.isAnimating = false;
    }

    register(elementId, type = 'total') {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Score display element ${elementId} not found`);
            return false;
        }

        this.elements.set(elementId, {
            element,
            type,
            lastValue: 0,
            animationDuration: 800
        });

        return true;
    }

    update(elementId, value, animated = true) {
        const scoreElement = this.elements.get(elementId);
        if (!scoreElement) {
            console.error(`Score element ${elementId} not registered`);
            return;
        }

        if (animated && value !== scoreElement.lastValue) {
            this.animateScoreChange(elementId, scoreElement.lastValue, value);
        } else {
            this.setDisplayValue(scoreElement, value);
        }

        scoreElement.lastValue = value;
    }

    animateScoreChange(elementId, fromValue, toValue) {
        this.animationQueue.push({
            elementId,
            fromValue,
            toValue,
            startTime: null
        });

        if (!this.isAnimating) {
            this.processAnimationQueue();
        }
    }

    processAnimationQueue() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        const animation = this.animationQueue.shift();
        const scoreElement = this.elements.get(animation.elementId);

        if (!scoreElement) {
            this.processAnimationQueue();
            return;
        }

        const startTime = performance.now();
        const duration = scoreElement.animationDuration;
        const difference = animation.toValue - animation.fromValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(animation.fromValue + (difference * easeOutQuart));
            
            this.setDisplayValue(scoreElement, currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.setDisplayValue(scoreElement, animation.toValue);
                
                this.addScoreChangeEffect(scoreElement.element, difference);
                
                setTimeout(() => {
                    this.processAnimationQueue();
                }, 100);
            }
        };

        requestAnimationFrame(animate);
    }

    setDisplayValue(scoreElement, value) {
        const displayText = this.formatScore(value, scoreElement.type);
        scoreElement.element.textContent = displayText;
        
        this.eventBus.emit('scoreDisplayUpdated', {
            elementId: Array.from(this.elements.entries())
                .find(([_, el]) => el === scoreElement)?.[0],
            value,
            type: scoreElement.type
        });
    }

    formatScore(value, type) {
        switch (type) {
            case 'total':
                return `Score: ${value.toLocaleString()}`;
            case 'level':
                return `Level: ${value}`;
            case 'streak':
                return `Streak: ${value}`;
            case 'accuracy':
                return `Accuracy: ${value}%`;
            case 'operation':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    }

    addScoreChangeEffect(element, difference) {
        if (difference <= 0) return;

        const effectElement = document.createElement('div');
        effectElement.className = 'score-change-effect';
        effectElement.textContent = `+${difference}`;
        effectElement.style.cssText = `
            position: absolute;
            top: -20px;
            right: 0;
            color: #10B981;
            font-weight: bold;
            font-size: 1.2em;
            pointer-events: none;
            opacity: 1;
            transform: translateY(0);
            transition: all 1s ease-out;
            z-index: 10;
        `;

        const rect = element.getBoundingClientRect();
        effectElement.style.left = `${rect.right - 50}px`;
        effectElement.style.top = `${rect.top - 20}px`;
        effectElement.style.position = 'fixed';

        document.body.appendChild(effectElement);

        requestAnimationFrame(() => {
            effectElement.style.opacity = '0';
            effectElement.style.transform = 'translateY(-30px)';
        });

        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 1000);
    }

    createScoreBoard(player) {
        const operations = ['addition', 'subtraction', 'multiplication', 'division', 'supermode'];
        
        let html = `
            <div class="score-board bg-white rounded-lg p-6 shadow-lg">
                <h3 class="text-2xl font-bold mb-4 text-center">Score Summary</h3>
                <div class="total-score text-center mb-6">
                    <div class="text-4xl font-black text-blue-600">${player.totalScore.toLocaleString()}</div>
                    <div class="text-gray-600">Total Points</div>
                </div>
                <div class="level-info text-center mb-6">
                    <div class="text-2xl font-bold text-purple-600">Level ${player.level}</div>
                    <div class="text-sm text-gray-600">Streak: ${player.streak} | Best: ${player.bestStreak}</div>
                </div>
                <div class="operation-breakdown">
                    <h4 class="font-bold mb-3">By Operation:</h4>
        `;

        operations.forEach(operation => {
            const stats = player.operationStats[operation];
            const accuracy = player.getAccuracy(operation);
            const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
            
            html += `
                <div class="operation-row flex justify-between items-center mb-2 p-2 bg-gray-50 rounded">
                    <span class="font-medium">${operationName}</span>
                    <div class="text-right">
                        <div class="text-lg font-bold text-blue-600">${stats.score}</div>
                        <div class="text-xs text-gray-600">${stats.correctAnswers}/${stats.questionsAnswered} (${accuracy}%)</div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    createMiniScoreDisplay(score, level, streak) {
        return `
            <div class="mini-score-display flex items-center gap-4 text-sm">
                <div class="score-item">
                    <span class="label text-gray-600">Score:</span>
                    <span class="value font-bold text-blue-600">${score.toLocaleString()}</span>
                </div>
                <div class="score-item">
                    <span class="label text-gray-600">Level:</span>
                    <span class="value font-bold text-purple-600">${level}</span>
                </div>
                <div class="score-item">
                    <span class="label text-gray-600">Streak:</span>
                    <span class="value font-bold text-green-600">${streak}</span>
                </div>
            </div>
        `;
    }

    animateAchievementScore(points) {
        const achievementScore = document.createElement('div');
        achievementScore.className = 'achievement-score-popup';
        achievementScore.innerHTML = `
            <div class="text-center p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg">
                <div class="text-2xl font-bold text-yellow-600 mb-2">🏆 Achievement!</div>
                <div class="text-lg font-bold text-yellow-700">+${points} bonus points!</div>
            </div>
        `;
        
        achievementScore.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            z-index: 1000;
            transition: all 0.5s ease-out;
        `;

        document.body.appendChild(achievementScore);

        requestAnimationFrame(() => {
            achievementScore.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        setTimeout(() => {
            achievementScore.style.opacity = '0';
            achievementScore.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }, 2000);

        setTimeout(() => {
            if (achievementScore.parentNode) {
                achievementScore.parentNode.removeChild(achievementScore);
            }
        }, 2500);
    }

    setAnimationDuration(elementId, duration) {
        const scoreElement = this.elements.get(elementId);
        if (scoreElement) {
            scoreElement.animationDuration = Math.max(200, Math.min(2000, duration));
        }
    }

    reset(elementId) {
        const scoreElement = this.elements.get(elementId);
        if (scoreElement) {
            scoreElement.lastValue = 0;
            this.setDisplayValue(scoreElement, 0);
        }
    }

    resetAll() {
        this.elements.forEach((scoreElement, elementId) => {
            this.reset(elementId);
        });
        this.animationQueue = [];
        this.isAnimating = false;
    }
}

export default ScoreDisplay;