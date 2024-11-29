// =============================================================================
// AnimationController.js - Animation management
// =============================================================================

export class AnimationController {
  constructor(container) {
    this.container = container;
    this.currentSpeed = 500;
    this.currentAngle = 0;
    this.baseInterval = 300; // Base interval between word creation in ms
    this.baseSpeed = 500;    // Reference speed value

    // Initialize viewport dimensions
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
    });
  }

  setSpeed(speed) {
    this.currentSpeed = speed;

    // Calculate animation duration - inverse relationship with speed
    const duration = 30 - ((speed - 1) / (1000 - 1)) * (30 - 1);
    document.documentElement.style.setProperty('--animation-duration', `${duration}s`);

    // Update creation interval in SuperShow
    if (this.onIntervalUpdate) {
      // Interval stays constant regardless of speed
      this.onIntervalUpdate(this.baseInterval);
    }
  }

  setAngle(angle) {
    this.currentAngle = angle;
    if (this.container) {
      this.container.style.transform = `rotate(${angle}deg)`;
    }
  }

  // Method to set callback for interval updates
  setIntervalCallback(callback) {
    this.onIntervalUpdate = callback;
  }
}