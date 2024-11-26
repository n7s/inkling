// =============================================================================
// AnimationController.js - Optimized animation management
// =============================================================================

export class AnimationController {
  constructor(container) {
    this.container = container;
    this.animationFrame = null;
    this.isAnimating = false;
    this.currentSpeed = 10;
    this.currentAngle = 90;
    this.onFrameCallback = null;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / 30;  // Target 30fps instead of 60fps
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
      // Use transform3d for hardware acceleration
      this.container.style.transform = `rotate3d(0,0,1,${this.currentAngle}deg)`;
    }
  }

  animate(timestamp) {
    if (!this.isAnimating) return;

    // Throttle frame rate
    if (timestamp - this.lastFrameTime < this.frameInterval) {
      this.animationFrame = requestAnimationFrame((t) => this.animate(t));
      return;
    }

    this.lastFrameTime = timestamp;

    // Calculate movement based on time delta
    const dx = (this.currentSpeed / this.frameInterval) * 16; // Normalize speed

    // Update positions using transform3d
    const words = Array.from(this.container.children);
    words.forEach(word => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(word).transform);
      const newX = transform.e + dx;
      word.style.transform = `translate3d(${newX}px, ${transform.f}px, 0)`;
    });

    // Call frame callback for word management
    if (this.onFrameCallback) {
      this.onFrameCallback();
    }

    this.animationFrame = requestAnimationFrame((t) => this.animate(t));
  }
}