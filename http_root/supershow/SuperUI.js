// =============================================================================
// SuperUI.js - SuperShow-specific UI controls
// =============================================================================

import { UIControls } from '../shared/UIControls.js';

export class SuperUI {
  constructor({ onSpeedChange, onAngleChange, onColorChange }) {
    // Callbacks
    this.onSpeedChange = onSpeedChange;
    this.onAngleChange = onAngleChange;
    this.onColorChange = onColorChange;

    // Use existing UIControls for fullscreen and color scheme
    this.uiControls = new UIControls();

    // State
    this.foregroundColor = null;
    this.backgroundColor = null;

    // Initialize UI
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Animation speed control
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.querySelector('.speed-value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        speedValue.textContent = speed;
        this.onSpeedChange?.(speed);
      });
    }

    // Rotation control
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = rotationSlider?.parentElement.querySelector('.value');
    if (rotationSlider && rotationValue) {
      rotationSlider.addEventListener('input', (e) => {
        const angle = parseInt(e.target.value);
        rotationValue.textContent = `${angle}°`;
        this.onAngleChange?.(angle);
      });
    }

    // Color controls
    const foregroundSelect = document.getElementById('foreground-color');
    const backgroundSelect = document.getElementById('background-color');
    const swapButton = document.getElementById('background-toggle');

    if (foregroundSelect && backgroundSelect && swapButton) {
      // Initial colors
      this.foregroundColor = foregroundSelect.value;
      this.backgroundColor = backgroundSelect.value;
      this.onColorChange?.(this.foregroundColor, this.backgroundColor);

      // Color select handlers
      foregroundSelect.addEventListener('change', () => {
        this.foregroundColor = foregroundSelect.value;
        this.onColorChange?.(this.foregroundColor, this.backgroundColor);
      });

      backgroundSelect.addEventListener('change', () => {
        this.backgroundColor = backgroundSelect.value;
        this.onColorChange?.(this.foregroundColor, this.backgroundColor);
      });

      // Swap colors button
      swapButton.addEventListener('click', () => {
        // Store current values
        const tempFg = this.foregroundColor;
        const tempBg = this.backgroundColor;

        // Swap internal state
        this.foregroundColor = tempBg;
        this.backgroundColor = tempFg;

        // Update dropdowns
        for (let i = 0; i < foregroundSelect.options.length; i++) {
          if (foregroundSelect.options[i].value === this.foregroundColor) {
            foregroundSelect.selectedIndex = i;
          }
        }

        for (let i = 0; i < backgroundSelect.options.length; i++) {
          if (backgroundSelect.options[i].value === this.backgroundColor) {
            backgroundSelect.selectedIndex = i;
          }
        }

        // Notify of color change
        this.onColorChange?.(this.foregroundColor, this.backgroundColor);
      });
    }

    // Font info toggle
    const fontInfoToggle = document.getElementById('font-info-toggle');
    const fontInfo = document.getElementById('font-info');
    if (fontInfoToggle && fontInfo) {
      fontInfoToggle.addEventListener('click', () => {
        const isVisible = fontInfo.style.display !== 'none';
        fontInfo.style.display = isVisible ? 'none' : 'block';
        fontInfoToggle.textContent = isVisible ? 'Show font info' : 'Hide font info';
      });
    }

    // Fullscreen button
    const fullscreenButton = document.querySelector('#fullScreen button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        this.uiControls.toggleFullscreen();
      });
    }

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
      if (event.key === 'f') {
        this.uiControls.toggleFullscreen();
      }
    });
  }
}