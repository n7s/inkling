// =============================================================================
// SuperUI.js - SuperShow-specific UI controls
// =============================================================================

import { UIControls } from '../shared/UIControls.js';

export class SuperUI {
  constructor({ onSpeedChange, onAngleChange, onColorChange, onReset, onToggleFontInfo }) {
    // Store callbacks
    this.onSpeedChange = onSpeedChange;
    this.onAngleChange = onAngleChange;
    this.onColorChange = onColorChange;
    this.onReset = onReset;
    this.onToggleFontInfo = onToggleFontInfo;

    // Initialize state
    this.foregroundColor = 'var(--color-black)';
    this.backgroundColor = 'var(--color-white)';
    this.fontInfoVisible = false;

    // Initialize UI components
    this.uiControls = new UIControls();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Font info toggle
    const fontInfoBtn = document.getElementById('font-info-toggle');
    if (fontInfoBtn) {
      fontInfoBtn.addEventListener('click', () => {
        this.fontInfoVisible = !this.fontInfoVisible;
        fontInfoBtn.textContent = this.fontInfoVisible ? 'Hide font info' : 'Show font info';
        this.onToggleFontInfo?.(this.fontInfoVisible);
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-animation');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.onReset?.();
      });
    }

    // Color selects
    const fgSelect = document.getElementById('foreground-color');
    const bgSelect = document.getElementById('background-color');
    if (fgSelect && bgSelect) {
      fgSelect.addEventListener('change', (e) => {
        this.foregroundColor = e.target.value;
        this.onColorChange?.(this.foregroundColor, this.backgroundColor);
      });
      bgSelect.addEventListener('change', (e) => {
        this.backgroundColor = e.target.value;
        this.onColorChange?.(this.foregroundColor, this.backgroundColor);
      });
    }

    // Swap colors
    const swapBtn = document.getElementById('background-toggle');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        [this.foregroundColor, this.backgroundColor] = [this.backgroundColor, this.foregroundColor];
        if (fgSelect && bgSelect) {
          fgSelect.value = this.foregroundColor;
          bgSelect.value = this.backgroundColor;
        }
        this.onColorChange?.(this.foregroundColor, this.backgroundColor);
      });
    }

    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.querySelector('.speed-value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        speedValue.textContent = speed;
        this.onSpeedChange?.(speed);
      });
    }

    // Direction slider
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = rotationSlider?.parentElement.querySelector('.value');
    if (rotationSlider && rotationValue) {
      rotationSlider.addEventListener('input', (e) => {
        const angle = parseInt(e.target.value);
        rotationValue.textContent = `${angle}°`;
        this.onAngleChange?.(angle);
      });
    }

    // Fullscreen
    const fullscreenBtn = document.querySelector('#fullScreen button');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.uiControls.toggleFullscreen();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'f') {
        this.uiControls.toggleFullscreen();
      }
    });

    // Controls visibility
    const controls = document.getElementById('controls');
    if (controls) {
      controls.addEventListener('mouseenter', () => {
        controls.style.opacity = '1';
      });
      controls.addEventListener('mouseleave', () => {
        controls.style.opacity = '0';
      });
    }
  }

  // Utility methods to programmatically update UI
  setSpeed(speed) {
    const slider = document.getElementById('speed-slider');
    const value = document.querySelector('.speed-value');
    if (slider && value) {
      slider.value = speed;
      value.textContent = speed;
    }
  }

  setRotation(angle) {
    const slider = document.getElementById('rotation-slider');
    const value = slider?.parentElement.querySelector('.value');
    if (slider && value) {
      slider.value = angle;
      value.textContent = `${angle}°`;
    }
  }

  setColors(fg, bg) {
    const fgSelect = document.getElementById('foreground-color');
    const bgSelect = document.getElementById('background-color');
    if (fgSelect && bgSelect) {
      fgSelect.value = fg;
      bgSelect.value = bg;
      this.foregroundColor = fg;
      this.backgroundColor = bg;
    }
  }
}