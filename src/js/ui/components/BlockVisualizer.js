class BlockVisualizer {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.animationDuration = 500;
        this.maxBlocksPerNumber = 99;
    }

    drawBlocks(number, container, colorClass, animated = false) {
        if (!container) {
            console.error('Container element not found');
            return Promise.resolve();
        }

        container.innerHTML = '';
        
        if (number > this.maxBlocksPerNumber) {
            this.drawLargeNumber(number, container, colorClass);
            return Promise.resolve();
        }

        const tens = Math.floor(number / 10);
        const ones = number % 10;
        const blocks = [];

        for (let i = 0; i < tens; i++) {
            const stack = this.createTenStack(colorClass, animated);
            blocks.push(...stack.children);
            container.appendChild(stack);
        }

        if (ones > 0) {
            const stack = this.createOnesStack(ones, colorClass, animated);
            blocks.push(...stack.children);
            container.appendChild(stack);
        }

        if (animated) {
            return this.animateBlocks(blocks);
        }

        return Promise.resolve();
    }

    createTenStack(colorClass, animated = false) {
        const stack = document.createElement('div');
        stack.className = 'ten-stack';
        
        for (let j = 0; j < 10; j++) {
            const block = this.createBlock(colorClass, animated);
            stack.appendChild(block);
        }
        
        return stack;
    }

    createOnesStack(count, colorClass, animated = false) {
        const stack = document.createElement('div');
        stack.className = 'ten-stack';
        
        for (let i = 0; i < count; i++) {
            const block = this.createBlock(colorClass, animated);
            stack.appendChild(block);
        }
        
        return stack;
    }

    createBlock(colorClass, animated = false) {
        const block = document.createElement('div');
        block.className = `block ${colorClass}`;
        
        if (animated) {
            block.style.opacity = '0';
            block.style.transform = 'scale(0)';
        }
        
        return block;
    }

    drawLargeNumber(number, container, colorClass) {
        container.innerHTML = `
            <div class="large-number-display">
                <div class="number-value ${colorClass.replace('bg-', 'text-')}">${number}</div>
                <div class="number-label">blocks</div>
            </div>
        `;
    }

    animateBlocks(blocks) {
        return new Promise((resolve) => {
            if (!blocks || blocks.length === 0) {
                resolve();
                return;
            }

            const delay = Math.min(50, this.animationDuration / blocks.length);
            let completedAnimations = 0;

            blocks.forEach((block, index) => {
                setTimeout(() => {
                    block.style.transition = `all ${this.animationDuration / 2}ms ease-out`;
                    block.style.opacity = '1';
                    block.style.transform = 'scale(1)';
                    
                    block.addEventListener('transitionend', () => {
                        completedAnimations++;
                        if (completedAnimations === blocks.length) {
                            resolve();
                        }
                    }, { once: true });
                }, index * delay);
            });

            // Fallback timeout
            setTimeout(resolve, this.animationDuration + blocks.length * delay + 100);
        });
    }

    async animateAddition(num1Container, num2Container, answerContainer, num1, num2, result) {
        await this.drawBlocks(num1, num1Container, 'bg-green-400', true);
        await this.delay(300);
        await this.drawBlocks(num2, num2Container, 'bg-yellow-400', true);
        await this.delay(500);
        
        const answerColorClass = 'bg-blue-400';
        await this.drawBlocks(result, answerContainer, answerColorClass, true);
        
        this.eventBus.emit('visualizationComplete', { operation: 'addition', result });
    }

    async animateSubtraction(num1Container, num2Container, answerContainer, num1, num2, result) {
        await this.drawBlocks(num1, num1Container, 'bg-green-400', true);
        await this.delay(300);
        await this.drawBlocks(num2, num2Container, 'bg-yellow-400', true);
        await this.delay(500);
        
        await this.animateRemoval(num1Container, num2);
        await this.delay(300);
        
        await this.drawBlocks(result, answerContainer, 'bg-blue-400', true);
        
        this.eventBus.emit('visualizationComplete', { operation: 'subtraction', result });
    }

    async animateMultiplication(num1Container, num2Container, answerContainer, num1, num2, result) {
        await this.drawBlocks(num1, num1Container, 'bg-green-400', true);
        await this.delay(300);
        await this.drawBlocks(num2, num2Container, 'bg-yellow-400', true);
        await this.delay(500);
        
        await this.animateGrouping(answerContainer, num1, num2, 'bg-blue-400');
        
        this.eventBus.emit('visualizationComplete', { operation: 'multiplication', result });
    }

    async animateDivision(num1Container, num2Container, answerContainer, dividend, divisor, quotient) {
        await this.drawBlocks(dividend, num1Container, 'bg-green-400', true);
        await this.delay(300);
        await this.drawBlocks(divisor, num2Container, 'bg-yellow-400', true);
        await this.delay(500);
        
        await this.animateDivisionGrouping(answerContainer, dividend, divisor, quotient);
        
        this.eventBus.emit('visualizationComplete', { operation: 'division', result: quotient });
    }

    async animateRemoval(container, removeCount) {
        const blocks = container.querySelectorAll('.block');
        const blocksToRemove = Array.from(blocks).slice(-removeCount);
        
        return new Promise((resolve) => {
            let removedCount = 0;
            
            blocksToRemove.forEach((block, index) => {
                setTimeout(() => {
                    block.style.transition = 'all 300ms ease-in';
                    block.style.opacity = '0';
                    block.style.transform = 'scale(0)';
                    
                    setTimeout(() => {
                        block.remove();
                        removedCount++;
                        if (removedCount === blocksToRemove.length) {
                            resolve();
                        }
                    }, 300);
                }, index * 50);
            });
            
            if (blocksToRemove.length === 0) resolve();
        });
    }

    async animateGrouping(container, groups, itemsPerGroup, colorClass) {
        container.innerHTML = '';
        
        const groupElements = [];
        for (let g = 0; g < groups; g++) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'multiplication-group';
            groupDiv.style.display = 'inline-block';
            groupDiv.style.margin = '0 0.25rem';
            groupDiv.style.padding = '0.25rem';
            groupDiv.style.border = '2px dashed #ccc';
            groupDiv.style.borderRadius = '4px';
            
            const groupBlocks = [];
            for (let i = 0; i < itemsPerGroup; i++) {
                const block = this.createBlock(colorClass, true);
                groupDiv.appendChild(block);
                groupBlocks.push(block);
            }
            
            container.appendChild(groupDiv);
            groupElements.push({ element: groupDiv, blocks: groupBlocks });
        }
        
        for (let g = 0; g < groupElements.length; g++) {
            await this.delay(200);
            await this.animateBlocks(groupElements[g].blocks);
        }
    }

    async animateDivisionGrouping(container, dividend, divisor, quotient) {
        container.innerHTML = '';
        
        const colors = ['bg-red-300', 'bg-blue-300', 'bg-green-300', 'bg-yellow-300', 'bg-purple-300'];
        const groupElements = [];
        
        for (let g = 0; g < divisor; g++) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'division-group';
            groupDiv.style.display = 'inline-block';
            groupDiv.style.margin = '0 0.25rem';
            groupDiv.style.padding = '0.25rem';
            groupDiv.style.border = `2px solid ${colors[g % colors.length].replace('bg-', '')}`;
            groupDiv.style.borderRadius = '4px';
            groupDiv.style.minHeight = '2rem';
            
            const groupLabel = document.createElement('div');
            groupLabel.textContent = `Group ${g + 1}`;
            groupLabel.style.fontSize = '0.75rem';
            groupLabel.style.marginBottom = '0.25rem';
            groupDiv.appendChild(groupLabel);
            
            container.appendChild(groupDiv);
            groupElements.push(groupDiv);
        }
        
        for (let i = 0; i < dividend; i++) {
            const groupIndex = i % divisor;
            const block = this.createBlock(colors[groupIndex % colors.length], false);
            groupElements[groupIndex].appendChild(block);
            
            block.style.opacity = '0';
            block.style.transform = 'scale(0)';
            
            await this.delay(100);
            
            block.style.transition = 'all 200ms ease-out';
            block.style.opacity = '1';
            block.style.transform = 'scale(1)';
        }
    }

    drawMysteryBox(container, colorClass = 'bg-yellow-200') {
        if (!container) {
            console.error('Container element not found');
            return;
        }

        container.innerHTML = '';
        
        const mysteryBox = document.createElement('div');
        mysteryBox.className = `mystery-box ${colorClass} border-2 border-dashed border-yellow-600`;
        mysteryBox.innerHTML = `
            <div class="mystery-content">
                <div class="mystery-symbol">?</div>
                <div class="mystery-label">Mystery Box</div>
            </div>
        `;
        
        container.appendChild(mysteryBox);
    }

    async animateDetectiveReveal(mysteryContainer, correctAnswer, colorClass = 'bg-blue-400') {
        const mysteryBox = mysteryContainer.querySelector('.mystery-box');
        if (!mysteryBox) return;

        // Animation: mystery box transforms into blocks
        mysteryBox.style.transition = 'all 500ms ease-out';
        mysteryBox.style.transform = 'scale(1.1)';
        mysteryBox.style.opacity = '0.8';
        
        await this.delay(300);
        
        // Replace mystery box with actual blocks
        await this.drawBlocks(correctAnswer, mysteryContainer, colorClass, true);
        
        // Add special "case closed" animation
        const blocks = mysteryContainer.querySelectorAll('.block');
        blocks.forEach((block, index) => {
            setTimeout(() => {
                block.style.animation = 'detective-reveal 600ms ease-out';
            }, index * 30);
        });
    }

    async animateDetectiveEquation(equation, containers, problem) {
        const { num1Container, operatorContainer, num2Container, equalsContainer, resultContainer } = containers;
        
        // Clear all containers
        [num1Container, num2Container, resultContainer].forEach(container => {
            if (container) this.clear(container);
        });

        // Set operator and equals symbols
        if (operatorContainer) operatorContainer.textContent = problem.operation;
        if (equalsContainer) equalsContainer.textContent = '=';

        // Draw known numbers and mystery boxes
        if (problem.num1 !== null) {
            await this.drawBlocks(problem.num1, num1Container, 'bg-green-400', true);
        } else {
            this.drawMysteryBox(num1Container);
        }

        await this.delay(300);

        if (problem.num2 !== null) {
            await this.drawBlocks(problem.num2, num2Container, 'bg-yellow-400', true);
        } else {
            this.drawMysteryBox(num2Container);
        }

        await this.delay(300);

        // Draw result (could be mystery box or actual number)
        if (problem.missingPosition === 'result') {
            this.drawMysteryBox(resultContainer);
        } else {
            await this.drawBlocks(problem.result, resultContainer, 'bg-purple-400', true);
        }

        this.eventBus.emit('visualizationComplete', { operation: 'detective', equation });
    }

    async revealDetectiveSolution(containers, problem, userAnswer) {
        const { num1Container, num2Container, resultContainer } = containers;
        
        // Find which container has the mystery box and reveal it
        if (problem.num1 === null) {
            await this.animateDetectiveReveal(num1Container, userAnswer, 'bg-green-400');
        } else if (problem.num2 === null) {
            await this.animateDetectiveReveal(num2Container, userAnswer, 'bg-yellow-400');
        } else if (problem.missingPosition === 'result') {
            await this.animateDetectiveReveal(resultContainer, userAnswer, 'bg-purple-400');
        }

        // Add special effects for case closed
        this.addCaseClosedEffect(containers);
    }

    addCaseClosedEffect(containers) {
        Object.values(containers).forEach(container => {
            if (!container) return;
            
            const effect = document.createElement('div');
            effect.className = 'case-closed-effect';
            effect.textContent = '🕵️ CASE CLOSED! 🎯';
            effect.style.cssText = `
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                color: #2d3748;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-weight: bold;
                font-size: 0.8rem;
                z-index: 10;
                animation: case-closed-popup 2s ease-out forwards;
                pointer-events: none;
            `;
            
            container.style.position = 'relative';
            container.appendChild(effect);
            
            // Remove effect after animation
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 2000);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setAnimationDuration(duration) {
        this.animationDuration = Math.max(100, Math.min(2000, duration));
    }

    getAnimationDuration() {
        return this.animationDuration;
    }

    clear(container) {
        if (container) {
            container.innerHTML = '';
        }
    }
}

export default BlockVisualizer;