class APIService {
    constructor() {
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';
        this.apiKey = '';
        this.timeout = 10000;
        this.maxRetries = 3;
        this.cache = new Map();
        this.rateLimit = {
            requests: 0,
            resetTime: Date.now() + 60000
        };
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    async generateExplanation(prompt, operation = null) {
        if (!this.apiKey) {
            return this.getFallbackExplanation(operation);
        }

        if (this.isRateLimited()) {
            console.warn('Rate limit exceeded, using fallback');
            return this.getFallbackExplanation(operation);
        }

        const cacheKey = this.getCacheKey(prompt);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let attempt = 0;
        while (attempt < this.maxRetries) {
            try {
                const response = await this.makeRequest(prompt);
                const explanation = this.parseResponse(response);
                
                this.cache.set(cacheKey, explanation);
                this.updateRateLimit();
                
                return explanation;
            } catch (error) {
                attempt++;
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                if (attempt >= this.maxRetries) {
                    return this.getFallbackExplanation(operation);
                }
                
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
    }

    async makeRequest(prompt) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    parseResponse(response) {
        try {
            if (response.candidates && 
                response.candidates.length > 0 && 
                response.candidates[0].content && 
                response.candidates[0].content.parts && 
                response.candidates[0].content.parts.length > 0) {
                
                let text = response.candidates[0].content.parts[0].text;
                return this.formatExplanation(text);
            }
        } catch (error) {
            console.error('Error parsing API response:', error);
        }
        
        return 'Sorry, I had trouble thinking of an explanation. Please try the next question!';
    }

    formatExplanation(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .trim();
    }

    getFallbackExplanation(operation) {
        const fallbacks = {
            addition: "Let's add step by step! Count all the blocks together. Start with the first number, then count up by the second number. For example, if you have 5 + 3, start at 5 and count: 6, 7, 8. The answer is 8!",
            subtraction: "Let's subtract step by step! Start with the bigger number and take away the smaller number. You can use your blocks - start with the first pile and remove the second number of blocks. Count what's left!",
            multiplication: "Let's multiply step by step! Multiplication is like making groups. If you have 3 × 4, make 3 groups with 4 blocks each, or 4 groups with 3 blocks each. Then count all the blocks together!",
            division: "Let's divide step by step! Division is like sharing equally. If you have 12 ÷ 3, take 12 blocks and share them into 3 equal groups. Count how many blocks are in each group - that's your answer!",
            supermode: "Let's solve this step by step! Work from left to right. Do each operation one at a time. Take your time and double-check each step!"
        };

        return fallbacks[operation] || "Break the problem into smaller steps. Take your time and think through each part. You can do this!";
    }

    getCacheKey(prompt) {
        return btoa(prompt).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }

    isRateLimited() {
        if (Date.now() > this.rateLimit.resetTime) {
            this.rateLimit.requests = 0;
            this.rateLimit.resetTime = Date.now() + 60000;
        }
        
        return this.rateLimit.requests >= 10;
    }

    updateRateLimit() {
        this.rateLimit.requests++;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearCache() {
        this.cache.clear();
    }

    getStatus() {
        return {
            hasApiKey: !!this.apiKey,
            cacheSize: this.cache.size,
            rateLimit: { ...this.rateLimit },
            isRateLimited: this.isRateLimited()
        };
    }
}

export default APIService;