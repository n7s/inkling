// =============================================================================
// wordmaster/TextFitter.js
// =============================================================================

export class TextFitter {
  /**
   * Creates a new TextFitter instance
   * @param {Object} options - Configuration options
   * @param {number} options.padding - Padding to maintain from container edges
   */
  constructor(options = {}) {
    this.padding = options.padding || 40;
  }

  /**
   * Fits text element to container width
   * @param {HTMLElement} element - Text element to fit
   * @param {HTMLElement} container - Container element
   */
  fitText(element, container) {
    const containerWidth = container.offsetWidth - this.padding;
    const measureDiv = this.createMeasureDiv(element);

    const fontSize = this.calculateFontSize(measureDiv, containerWidth);
    element.style.fontSize = `${fontSize}px`;

    document.body.removeChild(measureDiv);
  }

  /**
   * Creates temporary div for measurement
   * @private
   */
  createMeasureDiv(element) {
    const measureDiv = document.createElement('div');
    measureDiv.style.visibility = 'hidden';
    measureDiv.style.position = 'absolute';
    measureDiv.style.fontFamily = element.style.fontFamily;
    measureDiv.style.fontFeatureSettings = element.style.fontFeatureSettings;
    measureDiv.style.fontVariationSettings = element.style.fontVariationSettings;
    measureDiv.style.whiteSpace = 'nowrap';
    measureDiv.textContent = element.textContent;
    document.body.appendChild(measureDiv);
    return measureDiv;
  }

  /**
   * Calculates optimal font size
   * @private
   */
  calculateFontSize(measureDiv, targetWidth) {
    const initialFontSize = 100;
    measureDiv.style.fontSize = `${initialFontSize}px`;
    const scale = targetWidth / measureDiv.offsetWidth;
    return Math.floor(initialFontSize * scale);
  }
}