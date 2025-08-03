class SoundService {
    constructor() {
        this.enabled = true;
        this.volume = 0.7;
        this.sounds = new Map();
        this.audioContext = null;
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
            correct: 'src/assets/sounds/correct.mp3',
            incorrect: 'src/assets/sounds/incorrect.mp3',
            achievement: 'src/assets/sounds/achievement.mp3',
            click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCkGopaWNbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCkGo',
            button: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCkGo'
        };

        Object.entries(soundFiles).forEach(([name, url]) => {
            this.loadSound(name, url);
        });
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

    getStatus() {
        return {
            enabled: this.enabled,
            volume: this.volume,
            audioContextState: this.audioContext?.state || 'not-available',
            soundsLoaded: this.sounds.size,
            sounds: Array.from(this.sounds.keys())
        };
    }
}

export default SoundService;