// =============================================================================
// AnimationTimingController.js - Coordinated animation and word creation
// =============================================================================

export class AnimationTimingController {
  constructor() {
    // Animation constants
    this.VIEWPORT_WIDTH = window.innerWidth;
    this.BASE_SPEED = 50;
    this.BASE_DURATION = 15;
    this.wordSpacing = 100;

    // Current state
    this.currentSpeed = 10;  // Match slider's initial value of 10
    this.currentDuration = this.BASE_DURATION;
    this.lastWordTime = 0;

    this.updateTimings();

    // Add settings object as single source of truth
    this.settings = {
      wordCreationInterval: this.creationInterval,
      baseSpeed: this.BASE_SPEED,
      animationDuration: this.BASE_DURATION,
      minWordSpacing: this.wordSpacing
    };

    // Calculate initial creation interval
    this.updateTimings();

    // Handle viewport changes
    window.addEventListener('resize', () => {
      this.VIEWPORT_WIDTH = window.innerWidth;
      this.updateTimings();
    });
  }

  getSettings() {
    return { ...this.settings };
  }

  updateTimings() {
    // Reduce the scaling factor from 5 to a smaller number
    const scaledSpeed = this.currentSpeed * 0.5;  // Now 1-100 becomes 0.5-50

    // Calculate how long it takes for a word to cross viewport
    this.currentDuration = this.BASE_DURATION * (this.BASE_SPEED / scaledSpeed);

    // Adjust word creation interval
    this.creationInterval = Math.max(100, (this.currentDuration / 50) * 100);
  }

  setSpeed(speed) {
    console.log('Setting speed to:', speed);  // Add this line
    this.currentSpeed = speed;
    this.updateTimings();
    document.documentElement.style.setProperty(
      '--animation-duration',
      `${this.currentDuration}s`
    );
}

  shouldCreateWord(timestamp) {
    if (timestamp - this.lastWordTime >= this.creationInterval) {
      this.lastWordTime = timestamp;
      return true;
    }
    return false;
  }

  // Get current timings for debugging
  getDebugInfo() {
    return {
      speed: this.currentSpeed,
      duration: this.currentDuration,
      interval: this.creationInterval,
      pixelsPerSecond: this.VIEWPORT_WIDTH / this.currentDuration
    };
  }
}