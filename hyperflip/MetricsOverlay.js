// =============================================================================
// hyperflip/MetricsOverlay.js
// =============================================================================

export class MetricsOverlay {
  constructor(overlayElement) {
    this.overlay = overlayElement;
    this.isVisible = false;
  }

  render(font, glyphElement) {
    if (!this.isVisible) return;

    this.overlay.innerHTML = '';
    const currentChar = glyphElement.textContent;
    const metrics = this.calculateMetrics(font, glyphElement, currentChar);

    this.renderMetricLines(metrics);
    this.renderBearingLines(metrics);
  }

  calculateMetrics(font, glyphElement, currentChar) {
    const glyphIndex = font.charToGlyphIndex(currentChar);
    const glyph = font.glyphs.get(glyphIndex);
    const fontSize = parseInt(getComputedStyle(glyphElement).fontSize);
    const metricsScale = fontSize / font.unitsPerEm;

    const glyphRect = glyphElement.getBoundingClientRect();
    const containerCenter = glyphRect.left + (glyphRect.width / 2);
    const advanceScale = glyphRect.width / glyph.advanceWidth;

    // Calculate baseline position
    const baseline = glyphRect.top + (font.tables.os2.sTypoAscender * metricsScale);

    return {
      glyph,
      fontSize,
      metricsScale,
      glyphRect,
      containerCenter,
      advanceScale,
      baselineOffset: font.tables.os2.sTypoAscender * metricsScale,
      baseline: baseline,
      // Key change: Descender should be ADDED to baseline because sTypoDescender is negative
      descender: baseline - (font.tables.os2.sTypoDescender * metricsScale)
    };
  }

  renderMetricLines(metrics) {
    const lines = [
      { pos: metrics.baseline, label: 'Baseline' },
      { pos: metrics.baseline - metrics.baselineOffset, label: 'Ascender' },
      { pos: metrics.descender, label: 'Descender' }
    ];

    lines.forEach(({ pos, label }) => {
      const line = document.createElement('div');
      line.className = 'metric-line';
      line.style.top = `${pos}px`;

      const legend = document.createElement('div');
      legend.className = 'legend';
      legend.style.top = `${pos - 21}px`;
      legend.textContent = label;

      this.overlay.appendChild(line);
      this.overlay.appendChild(legend);
    });
  }

  renderBearingLines(metrics) {
    const scaledAdvanceWidth = metrics.glyph.advanceWidth * metrics.advanceScale;
    const leftPos = metrics.containerCenter - (scaledAdvanceWidth / 2);
    const rightPos = leftPos + scaledAdvanceWidth;

    [leftPos, rightPos].forEach(pos => {
      const line = document.createElement('div');
      line.className = 'side-bearing-line';
      line.style.left = `${pos}px`;
      this.overlay.appendChild(line);
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.overlay.style.display = this.isVisible ? 'block' : 'none';
  }
}