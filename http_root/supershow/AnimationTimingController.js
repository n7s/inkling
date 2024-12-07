// =============================================================================
// AnimationTimingController.js - Coordinated animation and word creation
// =============================================================================

export class AnimationTimingController {
  constructor() {
    this.BASE_DURATION = 15; // 15 seconds to cross screen
    this.CREATION_INTERVAL = 500; // Create word every 500ms
    this.lastWordTime = 0;

    this.settings = {
      animationDuration: this.BASE_DURATION,
      maxWords: 50,
      minWordSpacing: 5
    };
  }

  getSettings() {
    return { ...this.settings };
  }

  shouldCreateWord(timestamp) {
    if (timestamp - this.lastWordTime >= this.CREATION_INTERVAL) {
      this.lastWordTime = timestamp;
      return true;
    }
    return false;
  }

  setSpeed(speed) {
    // Simple linear relationship
    const newDuration = this.BASE_DURATION / (speed / 10);
    document.documentElement.style.setProperty('--animation-duration', `${newDuration}s`);
    // Adjust creation interval proportionally
    this.CREATION_INTERVAL = 500 * (speed / 10);
  }

  updateViewport() {
    // No need to adjust timing based on viewport
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