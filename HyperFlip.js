// =============================================================================
// HyperFlip.js
// =============================================================================

import { FontLoader } from './core/FontLoader.js';
import { GlyphAnimator } from './hyperflip/GlyphAnimator.js';
import { MetricsOverlay } from './hyperflip/MetricsOverlay.js';
import { VariationAxes } from './hyperflip/VariationAxes.js';
import { UIControls } from './shared/UIControls.js';
import { DragAndDrop } from './shared/DragAndDrop.js';

class FontViewer {
  constructor() {
    this.initializeComponents();
    this.setupEventListeners();
  }

  initializeComponents() {
    // Initialize core components
    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this),
      onError: this.handleError.bind(this)
    });

    // Initialize UI components
    this.glyphAnimator = new GlyphAnimator({
      displayElement: document.querySelector('.glyph-buffer'),
      onGlyphChange: this.handleGlyphChange.bind(this)
    });

    this.metricsOverlay = new MetricsOverlay(
      document.getElementById('font-metrics-overlay')
    );

    this.variationAxes = new VariationAxes({
      container: document.getElementById('controls'),
      onChange: this.handleAxesChange.bind(this)
    });

    this.uiControls = new UIControls();

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });
  }

  setupEventListeners() {
    // Add keyboard controls
    document.addEventListener('keydown', this.handleKeyPress.bind(this));

    // Add UI control listeners
    document.getElementById('metrics-toggle')
      ?.addEventListener('click', () => this.metricsOverlay.toggle());

    document.getElementById('background-toggle')
      ?.addEventListener('click', () => this.uiControls.toggleColorScheme());
  }

  async handleFontDrop(buffer, filename) {
    try {
      const { font, fontInfo, fontFamily } = await this.fontLoader.loadFont(buffer, filename);
      this.handleFontLoaded({ font, fontInfo, fontFamily });
    } catch (error) {
      this.handleError(error);
    }
  }

  handleFontLoaded({ font, fontInfo, fontFamily }) {
    // Update display settings
    const display = document.querySelector('.glyph-buffer');
    display.style.fontFamily = fontFamily;

    // Setup variable font axes
    if (fontInfo.axes.length > 0) {
      this.variationAxes.createAxesControls(fontInfo.axes);
    }

    // Start glyph animation
    this.glyphAnimator.setGlyphs(font.glyphs);
    this.glyphAnimator.start(100);
  }

  handleError(error) {
    console.error('Font loading error:', error);
    alert(`Error loading font: ${error.message}`);
  }

  handleGlyphChange(glyph) {
    // Update metrics overlay if visible
    this.metricsOverlay.render(this.fontLoader.currentFont, this.glyphAnimator.displayElement);
  }

  handleAxesChange(settings) {
    document.querySelector('.glyph-buffer').style.fontVariationSettings = settings;
  }

  handleKeyPress(event) {
    // Add keyboard shortcuts
    switch(event.key) {
      case ' ':
        event.preventDefault();
        this.glyphAnimator.isAnimating ?
          this.glyphAnimator.stop() :
          this.glyphAnimator.start(100);
        break;
      case 'f':
        this.uiControls.toggleFullscreen();
        break;
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new FontViewer();
});