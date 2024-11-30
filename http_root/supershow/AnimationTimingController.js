// =============================================================================
// AnimationTimingController.js - Coordinated animation and word creation
// =============================================================================

export class AnimationTimingController {
  constructor() {
    // Animation constants
    this.VIEWPORT_WIDTH = window.innerWidth;
    this.BASE_SPEED = 500;
    this.BASE_DURATION = 15; // seconds to cross viewport at base speed
    this.wordSpacing = 100; // minimum pixels between words

    // Current state
    this.currentSpeed = this.BASE_SPEED;
    this.currentDuration = this.BASE_DURATION;
    this.lastWordTime = 0;

    // Calculate initial creation interval
    this.updateTimings();

    // Handle viewport changes
    window.addEventListener('resize', () => {
      this.VIEWPORT_WIDTH = window.innerWidth;
      this.updateTimings();
    });
  }

  updateTimings() {
    // Calculate how long it takes for a word to cross viewport at current speed
    this.currentDuration = this.BASE_DURATION * (this.BASE_SPEED / this.currentSpeed);

    // Make creation interval proportional to duration
    this.creationInterval = (this.currentDuration / 15) * 1000;
  }

  setSpeed(speed) {
    this.currentSpeed = speed;
    this.updateTimings();

    // Update CSS animation duration
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