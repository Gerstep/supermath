class SoundService {
    constructor() {
        this.enabled = true;
        this.volume = 0.7;
        this.sounds = new Map();
        this.audioContext = null;
        this.backgroundMusic = null;
        this.musicEnabled = true;
        this.musicVolume = 0.3;
        this.fadeInDuration = 1000;
        this.fadeOutDuration = 500;
        this.initAudioContext();
        this.preloadSounds();
    }

    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (error) {
            console.warn('Web Audio API not supported, falling back to HTML5 audio');
            this.audioContext = null;
        }
    }

    preloadSounds() {
        const soundFiles = {
            correct: 'assets/sounds/correct.mp3',
            incorrect: 'assets/sounds/incorrect.mp3',
            achievement: 'assets/sounds/achievement.mp3',
            caseClosed: 'assets/sounds/case-closed.mp3',
            click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCkGo',
            button: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCkGo'
        };

        Object.entries(soundFiles).forEach(([name, url]) => {
            this.loadSound(name, url);
        });

        // Load background music separately
        this.loadBackgroundMusic('assets/sounds/bg-music.mp3');
    }

    async loadSound(name, url) {
        try {
            if (url.startsWith('data:')) {
                const audio = new Audio(url);
                this.sounds.set(name, { audio, type: 'data' });
                return;
            }

            const response = await fetch(url);
            if (!response.ok) {
                this.createFallbackSound(name);
                return;
            }

            if (this.audioContext) {
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds.set(name, { buffer: audioBuffer, type: 'web-audio' });
            } else {
                const audio = new Audio(url);
                this.sounds.set(name, { audio, type: 'html5' });
            }
        } catch (error) {
            console.warn(`Failed to load sound ${name}:`, error);
            this.createFallbackSound(name);
        }
    }

    createFallbackSound(name) {
        const frequencies = {
            correct: [523.25, 659.25, 783.99],
            incorrect: [220, 185, 146.83],
            achievement: [523.25, 659.25, 783.99, 1046.50],
            click: [800],
            button: [600]
        };

        const freq = frequencies[name] || [440];
        this.sounds.set(name, { frequencies: freq, type: 'generated' });
    }

    play(soundName, options = {}) {
        if (!this.enabled) return;

        const sound = this.sounds.get(soundName);
        if (!sound) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }

        const volume = options.volume !== undefined ? options.volume : this.volume;
        const playbackRate = options.playbackRate || 1;

        try {
            switch (sound.type) {
                case 'web-audio':
                    this.playWebAudio(sound.buffer, volume, playbackRate);
                    break;
                case 'html5':
                case 'data':
                    this.playHTML5Audio(sound.audio, volume, playbackRate);
                    break;
                case 'generated':
                    this.playGeneratedSound(sound.frequencies, volume);
                    break;
            }
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }

    playWebAudio(buffer, volume, playbackRate) {
        if (!this.audioContext) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();
    }

    playHTML5Audio(audio, volume, playbackRate) {
        const audioClone = audio.cloneNode();
        audioClone.volume = volume;
        audioClone.playbackRate = playbackRate;
        
        const playPromise = audioClone.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('HTML5 audio play failed:', error);
            });
        }
    }

    playGeneratedSound(frequencies, volume) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequencies[0], this.audioContext.currentTime);
        
        if (frequencies.length > 1) {
            const noteDuration = 0.15;
            frequencies.forEach((freq, index) => {
                const time = this.audioContext.currentTime + (index * noteDuration);
                oscillator.frequency.setValueAtTime(freq, time);
            });
        }

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    playCorrect() {
        this.play('correct');
    }

    playIncorrect() {
        this.play('incorrect');
    }

    playAchievement() {
        this.play('achievement');
    }

    playClick() {
        this.play('click', { volume: 0.3 });
    }

    playButton() {
        this.play('button', { volume: 0.5 });
    }

    playCaseClosed() {
        this.play('caseClosed');
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    getVolume() {
        return this.volume;
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    async loadBackgroundMusic(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn('Background music file not found, creating fallback');
                this.createFallbackMusic();
                return;
            }

            const audio = new Audio(url);
            audio.loop = true;
            audio.volume = 0;
            audio.preload = 'auto';
            
            this.backgroundMusic = audio;
            
            // Handle loading errors
            audio.addEventListener('error', () => {
                console.warn('Error loading background music, creating fallback');
                this.createFallbackMusic();
            });
            
        } catch (error) {
            console.warn('Failed to load background music:', error);
            this.createFallbackMusic();
        }
    }

    createFallbackMusic() {
        // Create a simple looping tone as fallback
        if (!this.audioContext) return;
        
        this.backgroundMusic = {
            isPlaying: false,
            oscillator: null,
            gainNode: null,
            type: 'generated'
        };
    }

    async startBackgroundMusic() {
        if (!this.musicEnabled || !this.backgroundMusic) return;

        try {
            if (this.backgroundMusic.type === 'generated') {
                this.startGeneratedMusic();
            } else {
                await this.startAudioMusic();
            }
        } catch (error) {
            console.warn('Error starting background music:', error);
        }
    }

    async startAudioMusic() {
        if (!this.backgroundMusic || this.backgroundMusic.type === 'generated') return;

        try {
            // Reset to beginning
            this.backgroundMusic.currentTime = 0;
            
            // Start playing
            const playPromise = this.backgroundMusic.play();
            if (playPromise !== undefined) {
                await playPromise;
                
                // Fade in
                this.fadeInMusic();
            }
        } catch (error) {
            console.warn('Error starting audio music:', error);
        }
    }

    startGeneratedMusic() {
        if (!this.audioContext || !this.backgroundMusic || this.backgroundMusic.isPlaying) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Create a simple pleasant chord progression
        oscillator.frequency.setValueAtTime(261.63, this.audioContext.currentTime); // C4
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.3, this.audioContext.currentTime + 1);

        oscillator.start();
        
        this.backgroundMusic.oscillator = oscillator;
        this.backgroundMusic.gainNode = gainNode;
        this.backgroundMusic.isPlaying = true;
    }

    stopBackgroundMusic() {
        if (!this.backgroundMusic) return;

        try {
            if (this.backgroundMusic.type === 'generated') {
                this.stopGeneratedMusic();
            } else {
                this.stopAudioMusic();
            }
        } catch (error) {
            console.warn('Error stopping background music:', error);
        }
    }

    stopAudioMusic() {
        if (!this.backgroundMusic || this.backgroundMusic.type === 'generated') return;

        this.fadeOutMusic(() => {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        });
    }

    stopGeneratedMusic() {
        if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) return;

        if (this.backgroundMusic.gainNode) {
            this.backgroundMusic.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        }
        
        if (this.backgroundMusic.oscillator) {
            setTimeout(() => {
                this.backgroundMusic.oscillator.stop();
                this.backgroundMusic.isPlaying = false;
            }, 500);
        }
    }

    pauseBackgroundMusic() {
        if (!this.backgroundMusic) return;

        if (this.backgroundMusic.type === 'generated') {
            this.stopGeneratedMusic();
        } else if (!this.backgroundMusic.paused) {
            this.fadeOutMusic(() => {
                this.backgroundMusic.pause();
            });
        }
    }

    resumeBackgroundMusic() {
        if (!this.backgroundMusic || !this.musicEnabled) return;

        if (this.backgroundMusic.type === 'generated') {
            this.startGeneratedMusic();
        } else if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().then(() => {
                this.fadeInMusic();
            }).catch(console.warn);
        }
    }

    fadeInMusic() {
        if (!this.backgroundMusic || this.backgroundMusic.type === 'generated') return;

        this.backgroundMusic.volume = 0;
        
        const fadeIn = () => {
            if (this.backgroundMusic.volume < this.musicVolume) {
                this.backgroundMusic.volume = Math.min(this.backgroundMusic.volume + 0.02, this.musicVolume);
                setTimeout(fadeIn, 50);
            }
        };
        
        fadeIn();
    }

    fadeOutMusic(callback) {
        if (!this.backgroundMusic || this.backgroundMusic.type === 'generated') {
            if (callback) callback();
            return;
        }

        const fadeOut = () => {
            if (this.backgroundMusic.volume > 0) {
                this.backgroundMusic.volume = Math.max(this.backgroundMusic.volume - 0.04, 0);
                setTimeout(fadeOut, 25);
            } else if (callback) {
                callback();
            }
        };
        
        fadeOut();
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        
        if (enabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }

    isMusicEnabled() {
        return this.musicEnabled;
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.backgroundMusic && this.backgroundMusic.type !== 'generated') {
            this.backgroundMusic.volume = this.musicVolume;
        }
    }

    getMusicVolume() {
        return this.musicVolume;
    }

    getStatus() {
        return {
            enabled: this.enabled,
            volume: this.volume,
            musicEnabled: this.musicEnabled,
            musicVolume: this.musicVolume,
            musicPlaying: this.backgroundMusic ? 
                (this.backgroundMusic.type === 'generated' ? this.backgroundMusic.isPlaying : !this.backgroundMusic.paused) 
                : false,
            audioContextState: this.audioContext?.state || 'not-available',
            soundsLoaded: this.sounds.size,
            sounds: Array.from(this.sounds.keys())
        };
    }
}

export default SoundService;