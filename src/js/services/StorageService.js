class StorageService {
    constructor() {
        this.prefix = 'supermath_';
        this.version = '2.0';
        this.initStorage();
    }

    initStorage() {
        try {
            if (!this.isLocalStorageAvailable()) {
                console.warn('localStorage not available, using memory storage');
                this.memoryStorage = new Map();
            }
            
            this.migrateData();
        } catch (error) {
            console.error('Error initializing storage:', error);
            this.memoryStorage = new Map();
        }
    }

    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    migrateData() {
        const versionKey = this.getKey('version');
        const currentVersion = this.get('version', '1.0');
        
        if (currentVersion !== this.version) {
            this.performMigration(currentVersion, this.version);
            this.set('version', this.version);
        }
    }

    performMigration(fromVersion, toVersion) {
        console.log(`Migrating storage from ${fromVersion} to ${toVersion}`);
        
        if (fromVersion === '1.0') {
            const oldScore = localStorage.getItem('mathScore');
            if (oldScore) {
                const playerData = {
                    totalScore: parseInt(oldScore) || 0,
                    operationStats: {
                        addition: { score: parseInt(oldScore) || 0, questionsAnswered: 0, correctAnswers: 0 },
                        subtraction: { score: 0, questionsAnswered: 0, correctAnswers: 0 },
                        multiplication: { score: 0, questionsAnswered: 0, correctAnswers: 0 },
                        division: { score: 0, questionsAnswered: 0, correctAnswers: 0 }
                    },
                    achievements: [],
                    settings: { difficulty: 'medium', soundEnabled: true }
                };
                this.savePlayerData(playerData);
                localStorage.removeItem('mathScore');
            }
        }
    }

    getKey(key) {
        return `${this.prefix}${key}`;
    }

    get(key, defaultValue = null) {
        try {
            if (this.memoryStorage) {
                return this.memoryStorage.get(key) ?? defaultValue;
            }
            
            const value = localStorage.getItem(this.getKey(key));
            if (value === null) return defaultValue;
            
            return JSON.parse(value);
        } catch (error) {
            console.error('Error getting from storage:', error);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            if (this.memoryStorage) {
                this.memoryStorage.set(key, value);
                return true;
            }
            
            localStorage.setItem(this.getKey(key), JSON.stringify(value));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
            console.error('Error setting storage:', error);
            return false;
        }
    }

    remove(key) {
        try {
            if (this.memoryStorage) {
                return this.memoryStorage.delete(key);
            }
            
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    clear() {
        try {
            if (this.memoryStorage) {
                this.memoryStorage.clear();
                return true;
            }
            
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    handleQuotaExceeded() {
        console.warn('Storage quota exceeded, attempting cleanup');
        
        const oldDataKeys = Object.keys(localStorage).filter(key => 
            key.startsWith(this.prefix) && 
            key.includes('backup_') &&
            Date.now() - parseInt(key.split('_').pop()) > 7 * 24 * 60 * 60 * 1000
        );
        
        oldDataKeys.forEach(key => localStorage.removeItem(key));
    }

    savePlayerData(playerData) {
        const success = this.set('player', playerData);
        if (success) {
            this.set('lastSaved', new Date().toISOString());
            
            const backupKey = `backup_${Date.now()}`;
            this.set(backupKey, playerData);
        }
        return success;
    }

    getPlayerData() {
        return this.get('player', null);
    }

    saveGameHistory(gameSession) {
        const history = this.getGameHistory();
        history.push(gameSession);
        
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        
        return this.set('gameHistory', history);
    }

    getGameHistory() {
        return this.get('gameHistory', []);
    }

    getStorageInfo() {
        if (this.memoryStorage) {
            return {
                type: 'memory',
                size: this.memoryStorage.size,
                available: true
            };
        }
        
        try {
            let totalSize = 0;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    totalSize += localStorage.getItem(key).length;
                }
            });
            
            return {
                type: 'localStorage',
                usedBytes: totalSize,
                available: this.isLocalStorageAvailable()
            };
        } catch (error) {
            return {
                type: 'unknown',
                error: error.message,
                available: false
            };
        }
    }

    exportData() {
        try {
            const data = {};
            
            if (this.memoryStorage) {
                this.memoryStorage.forEach((value, key) => {
                    data[key] = value;
                });
            } else {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        const cleanKey = key.replace(this.prefix, '');
                        data[cleanKey] = JSON.parse(localStorage.getItem(key));
                    }
                });
            }
            
            return {
                version: this.version,
                exportedAt: new Date().toISOString(),
                data: data
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(exportedData) {
        try {
            if (!exportedData || !exportedData.data) {
                throw new Error('Invalid export data');
            }
            
            Object.entries(exportedData.data).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

export default StorageService;