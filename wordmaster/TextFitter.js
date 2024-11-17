// =============================================================================
// wordmaster/TextFitter.js
// =============================================================================

export class TextFitter {
  constructor({ paddingPercentage = 10 } = {}) {
    this.paddingPercentage = paddingPercentage;
  }

  fitText(element, container) {
    if (!element || !container) return;

    // Store current font settings
    const currentFontFamily = element.style.fontFamily;
    const currentFeatureSettings = element.style.fontFeatureSettings;
    const currentVariationSettings = element.style.fontVariationSettings;

    // Reset everything
    element.style.cssText = '';

    // Restore font settings
    if (currentFontFamily) element.style.fontFamily = currentFontFamily;
    if (currentFeatureSettings) element.style.fontFeatureSettings = currentFeatureSettings;
    if (currentVariationSettings) element.style.fontVariationSettings = currentVariationSettings;

    // Set the base styles
    element.style.position = 'absolute';
    element.style.whiteSpace = 'nowrap';
    element.style.fontSize = '200px';  // Start bigger
    element.style.left = '50%';
    element.style.top = '50%';

    // Calculate available width with padding
    const containerWidth = container.offsetWidth;
    const paddingPixels = (containerWidth * this.paddingPercentage) / 100;
    const availableWidth = containerWidth - (paddingPixels * 2);

    // Get natural width at our base font size
    const naturalWidth = element.offsetWidth;

    // Calculate scale
    const scale = availableWidth / naturalWidth;

    // Apply transform
    element.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}