class ModalManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.activeModals = new Map();
        this.modalStack = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                const topModal = this.modalStack[this.modalStack.length - 1];
                if (topModal.closable !== false) {
                    this.close(topModal.id);
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                const modalId = e.target.dataset.modalId;
                const modal = this.activeModals.get(modalId);
                if (modal && modal.closable !== false) {
                    this.close(modalId);
                }
            }
        });
    }

    create(id, options = {}) {
        if (this.activeModals.has(id)) {
            console.warn(`Modal ${id} already exists`);
            return this.activeModals.get(id);
        }

        const modal = {
            id,
            title: options.title || '',
            content: options.content || '',
            type: options.type || 'default',
            size: options.size || 'medium',
            closable: options.closable !== false,
            showHeader: options.showHeader !== false,
            showFooter: options.showFooter !== false,
            buttons: options.buttons || [],
            onShow: options.onShow || null,
            onHide: options.onHide || null,
            onDestroy: options.onDestroy || null,
            className: options.className || '',
            element: null
        };

        const modalElement = this.createModalElement(modal);
        modal.element = modalElement;
        
        this.activeModals.set(id, modal);
        document.body.appendChild(modalElement);

        return modal;
    }

    createModalElement(modal) {
        const backdrop = document.createElement('div');
        backdrop.className = `modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 opacity-0 transition-opacity duration-300`;
        backdrop.dataset.modalId = modal.id;
        backdrop.style.visibility = 'hidden';

        const modalContent = document.createElement('div');
        modalContent.className = this.getModalSizeClass(modal.size, modal.type);
        modalContent.innerHTML = this.getModalHTML(modal);

        this.setupModalEventListeners(modalContent, modal);
        backdrop.appendChild(modalContent);

        return backdrop;
    }

    getModalSizeClass(size, type) {
        const baseClasses = 'bg-white rounded-2xl shadow-2xl transform scale-95 transition-transform duration-300 max-h-screen overflow-auto';
        const typeClasses = {
            success: 'bg-green-50',
            error: 'bg-red-50',
            warning: 'bg-yellow-50',
            info: 'bg-blue-50',
            default: 'bg-white'
        };

        const sizeClasses = {
            small: 'w-full max-w-sm',
            medium: 'w-full max-w-lg',
            large: 'w-full max-w-2xl',
            xlarge: 'w-full max-w-4xl',
            full: 'w-full h-full max-w-none'
        };

        return `${baseClasses} ${typeClasses[type] || typeClasses.default} ${sizeClasses[size] || sizeClasses.medium}`;
    }

    getModalHTML(modal) {
        let html = '';

        if (modal.showHeader) {
            html += `
                <div class="modal-header flex justify-between items-center p-6 border-b">
                    <h2 class="text-2xl font-bold ${this.getTypeColorClass(modal.type)}">${modal.title}</h2>
                    ${modal.closable ? '<button class="modal-close text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>' : ''}
                </div>
            `;
        }

        html += `
            <div class="modal-body p-6">
                ${modal.content}
            </div>
        `;

        if (modal.showFooter && modal.buttons.length > 0) {
            html += `
                <div class="modal-footer flex gap-3 justify-center p-6 border-t">
                    ${modal.buttons.map(button => this.getButtonHTML(button)).join('')}
                </div>
            `;
        }

        return html;
    }

    getTypeColorClass(type) {
        const colorClasses = {
            success: 'text-green-600',
            error: 'text-red-600',
            warning: 'text-yellow-600',
            info: 'text-blue-600',
            default: 'text-gray-800'
        };
        return colorClasses[type] || colorClasses.default;
    }

    getButtonHTML(button) {
        const baseClasses = 'px-6 py-3 rounded-xl font-bold text-lg transition-colors duration-200';
        const typeClasses = {
            primary: 'bg-blue-500 hover:bg-blue-600 text-white',
            success: 'bg-green-500 hover:bg-green-600 text-white',
            danger: 'bg-red-500 hover:bg-red-600 text-white',
            warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
            secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700'
        };

        const buttonClass = `${baseClasses} ${typeClasses[button.type] || typeClasses.secondary}`;
        return `<button class="modal-button ${buttonClass}" data-action="${button.action || ''}">${button.text}</button>`;
    }

    setupModalEventListeners(modalContent, modal) {
        if (modal.closable) {
            const closeBtn = modalContent.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close(modal.id));
            }
        }

        const buttons = modalContent.querySelectorAll('.modal-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleButtonClick(modal.id, action, e);
            });
        });
    }

    handleButtonClick(modalId, action, event) {
        this.eventBus.emit('modalButtonClick', { modalId, action, event });
        
        if (action === 'close') {
            this.close(modalId);
        }
    }

    show(id) {
        const modal = this.activeModals.get(id);
        if (!modal) {
            console.error(`Modal ${id} not found`);
            return false;
        }

        this.modalStack.push(modal);
        modal.element.style.visibility = 'visible';
        
        requestAnimationFrame(() => {
            modal.element.classList.remove('opacity-0');
            modal.element.classList.add('opacity-100');
            
            const content = modal.element.querySelector('div');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });

        if (modal.onShow) {
            modal.onShow(modal);
        }

        this.eventBus.emit('modalShown', { modalId: id });
        return true;
    }

    hide(id) {
        const modal = this.activeModals.get(id);
        if (!modal) {
            console.error(`Modal ${id} not found`);
            return false;
        }

        modal.element.classList.remove('opacity-100');
        modal.element.classList.add('opacity-0');
        
        const content = modal.element.querySelector('div');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');

        setTimeout(() => {
            modal.element.style.visibility = 'hidden';
        }, 300);

        this.modalStack = this.modalStack.filter(m => m.id !== id);

        if (modal.onHide) {
            modal.onHide(modal);
        }

        this.eventBus.emit('modalHidden', { modalId: id });
        return true;
    }

    close(id) {
        this.hide(id);
        setTimeout(() => this.destroy(id), 300);
    }

    destroy(id) {
        const modal = this.activeModals.get(id);
        if (!modal) return false;

        if (modal.element && modal.element.parentNode) {
            modal.element.parentNode.removeChild(modal.element);
        }

        if (modal.onDestroy) {
            modal.onDestroy(modal);
        }

        this.activeModals.delete(id);
        this.eventBus.emit('modalDestroyed', { modalId: id });
        return true;
    }

    updateContent(id, content) {
        const modal = this.activeModals.get(id);
        if (!modal) return false;

        const bodyElement = modal.element.querySelector('.modal-body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
            return true;
        }
        return false;
    }

    isOpen(id) {
        const modal = this.activeModals.get(id);
        return modal && this.modalStack.includes(modal);
    }

    closeAll() {
        const modalIds = Array.from(this.activeModals.keys());
        modalIds.forEach(id => this.close(id));
    }

    showFeedbackModal(isCorrect, questionData, onNext, onExplain) {
        const modalId = 'feedback';
        this.destroy(modalId);

        const buttons = [
            {
                text: 'Next Question',
                type: isCorrect ? 'success' : 'danger',
                action: 'next'
            }
        ];

        if (!isCorrect && onExplain) {
            buttons.push({
                text: '✨ Explain This For Me',
                type: 'warning',
                action: 'explain'
            });
        }

        const modal = this.create(modalId, {
            title: isCorrect ? 'Correct!' : 'Try Again!',
            content: this.getFeedbackContent(isCorrect, questionData),
            type: isCorrect ? 'success' : 'error',
            buttons: buttons,
            closable: false
        });

        this.eventBus.on('modalButtonClick', (data) => {
            if (data.modalId === modalId) {
                if (data.action === 'next' && onNext) {
                    onNext();
                } else if (data.action === 'explain' && onExplain) {
                    onExplain();
                }
            }
        });

        this.show(modalId);
        return modal;
    }

    getFeedbackContent(isCorrect, questionData) {
        const { num1, num2, operation, correctAnswer, expression } = questionData;
        
        if (isCorrect) {
            const problemText = expression || `${num1} ${operation} ${num2}`;
            return `<p class="text-xl mb-4">Great job! ${problemText} = ${correctAnswer}.</p>`;
        } else {
            const problemText = expression || `${num1} ${operation} ${num2}`;
            return `
                <p class="text-xl mb-4">Not quite. The correct answer was ${correctAnswer}. You'll get the next one!</p>
                <div id="explanation-container" class="bg-gray-100 p-4 rounded-lg mt-4 text-left text-base hidden">
                    <div id="explanation-loader" class="loader hidden"></div>
                    <div id="explanation-text"></div>
                </div>
            `;
        }
    }

    showExplanation(explanation) {
        const explanationContainer = document.getElementById('explanation-container');
        const explanationText = document.getElementById('explanation-text');
        const explanationLoader = document.getElementById('explanation-loader');
        
        if (explanationContainer && explanationText && explanationLoader) {
            explanationContainer.classList.remove('hidden');
            explanationLoader.classList.add('hidden');
            explanationText.innerHTML = explanation;
        }
    }

    showLoadingExplanation() {
        const explanationContainer = document.getElementById('explanation-container');
        const explanationText = document.getElementById('explanation-text');
        const explanationLoader = document.getElementById('explanation-loader');
        
        if (explanationContainer && explanationText && explanationLoader) {
            explanationContainer.classList.remove('hidden');
            explanationLoader.classList.remove('hidden');
            explanationText.innerHTML = '';
        }
    }
}

export default ModalManager;