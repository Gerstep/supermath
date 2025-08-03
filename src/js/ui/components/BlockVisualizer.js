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