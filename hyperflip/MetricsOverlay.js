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

    // Get vertical position from slider (0-100)
    const verticalPositionSlider = document.getElementById('vertical-position');
    const verticalPosition = verticalPositionSlider ?
      parseInt(verticalPositionSlider.value) / 100 : 0.5;

    // Calculate baseline position with the cap height offset correction
    const capHeightOffset = (font.tables.os2.sCapHeight * metricsScale) / 2;
    const baseline = glyphRect.top + (glyphRect.height * verticalPosition) + capHeightOffset;

    return {
      glyph,
      fontSize,
      metricsScale,
      glyphRect,
      containerCenter,
      advanceScale,
      baseline,
      // Calculate all other metrics normally relative to the corrected baseline
      ascender: baseline - (font.tables.os2.sTypoAscender * metricsScale),
      descender: baseline + (Math.abs(font.tables.os2.sTypoDescender) * metricsScale),
      capHeight: baseline - (font.tables.os2.sCapHeight * metricsScale),
      xHeight: baseline - (font.tables.os2.sxHeight * metricsScale)
    };
  }

  renderMetricLines(metrics) {
    const lines = [
      { pos: metrics.baseline, label: 'Baseline' },
      { pos: metrics.ascender, label: 'Ascender' },
      { pos: metrics.descender, label: 'Descender' },
      { pos: metrics.capHeight, label: 'Capital height' },
      { pos: metrics.xHeight, label: 'x-height' }
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