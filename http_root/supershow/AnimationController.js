// =============================================================================
// AnimationController.js - Movement and animation management
// =============================================================================

export class AnimationController {
  constructor(container) {
    this.container = container;
    this.animationFrame = null;
    this.isAnimating = false;

    // Animation state
    this.currentSpeed = 10;
    this.currentAngle = 90;
    this.onFrameCallback = null;

    // Bind methods
    this.animate = this.animate.bind(this);
  }

  start({ onFrame }) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.onFrameCallback = onFrame;
    this.updateRotation();
    this.animate();
  }

  stop() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  setSpeed(speed) {
    this.currentSpeed = speed;
  }

  setAngle(angle) {
    this.currentAngle = angle;
    this.updateRotation();
  }

  updateRotation() {
    if (this.container) {
      this.container.style.transform = `rotate(${this.currentAngle}deg)`;
    }
  }

  animate() {
    if (!this.isAnimating) return;

    // Move along baseline (always "right" relative to container rotation)
    const dx = this.currentSpeed;
    const dy = 0;

    // Apply movement to all words
    const words = Array.from(this.container.children);
    words.forEach(word => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(word).transform);
      const newX = transform.e + dx;
      const newY = transform.f + dy;

      word.style.transform = `translate(${newX}px, ${newY}px)`;
    });

    // Call frame callback for word management
    if (this.onFrameCallback) {
      this.onFrameCallback();
    }

    // Continue animation
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  // Helper method to check if an element is visible
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const margin = Math.max(window.innerWidth, window.innerHeight);

    return !(
      rect.right < -margin ||
      rect.left > window.innerWidth + margin ||
      rect.bottom < -margin ||
      rect.top > window.innerHeight + margin
    );
  }
}