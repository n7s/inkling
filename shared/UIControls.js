// =============================================================================
// shared/UIControls.js
// =============================================================================

export class UIControls {
  /**
   * Creates a new UIControls instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.isDarkMode = false;
    this.isFullscreen = false;
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for UI controls
   * @private
   */
  setupEventListeners() {
    // Fullscreen controls
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
  }

  /**
   * Toggles fullscreen mode
   */
  toggleFullscreen() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  /**
   * Enters fullscreen mode
   * @private
   */
  enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  /**
   * Exits fullscreen mode
   * @private
   */
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  /**
   * Toggles dark/light mode
   */
  toggleColorScheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.style.setProperty(
      '--white',
      this.isDarkMode ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)'
    );
    document.documentElement.style.setProperty(
      '--black',
      this.isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'
    );
  }

  /**
   * Handles fullscreen change events
   * @private
   */
  handleFullscreenChange() {
    this.isFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
}