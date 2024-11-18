// =============================================================================
// hyperflip/MetricsOverlay.js
// =============================================================================

export class MetricsOverlay {
  constructor(overlayElement) {
    this.overlay = overlayElement;
    this.isVisible = false;
  }

  render(font, glyphElement) {
    if (!this.isVisible || !glyphElement) return;

    this.overlay.innerHTML = '';

    const currentChar = glyphElement.textContent;
    if (!currentChar) return;

    const metrics = this.calculateMetrics(font, glyphElement, currentChar);
    this.renderMetricLines(metrics, font);
    this.renderBearingLines(metrics);
  }

  calculateMetrics(font, glyphElement, currentChar) {
    const computedStyle = getComputedStyle(glyphElement);
    const fontSize = parseInt(computedStyle.fontSize);
    const unitsPerEm = font.unitsPerEm;

    // Basic metrics scale based on font size
    const metricsScale = fontSize / unitsPerEm;

    // Get the glyph element's metrics
    const glyphRect = glyphElement.getBoundingClientRect();
    const renderedWidth = glyphRect.width;
    const verticalCenter = glyphRect.top + (glyphRect.height / 2);
    const horizontalCenter = glyphRect.left + (glyphRect.width / 2);

    // Get glyph info
    const glyphIndex = font.charToGlyphIndex(currentChar);
    const glyph = font.glyphs.get(glyphIndex);

    // The total height in font units from descender to ascender
    const totalHeight = font.tables.os2.sTypoAscender - font.tables.os2.sTypoDescender;

    // Calculate how much of the total height is above the baseline (in font units)
    const baselineOffset = font.tables.os2.sTypoAscender;

    // Calculate where the baseline should be relative to the center
    const baselineRatio = baselineOffset / totalHeight;

    // Scale the total height to pixels
    const totalPixelHeight = (totalHeight / unitsPerEm) * fontSize;

    // Position the baseline
    const baseline = verticalCenter - (totalPixelHeight / 2) + (baselineRatio * totalPixelHeight);

    return {
      glyph,
      fontSize,
      metricsScale,
      glyphRect,
      containerCenter: horizontalCenter,
      baseline,
      renderedWidth,
      ascender: baseline - (font.tables.os2.sTypoAscender * metricsScale),
      descender: baseline - (font.tables.os2.sTypoDescender * metricsScale),
      capHeight: baseline - (font.tables.os2.sCapHeight * metricsScale),
      xHeight: baseline - (font.tables.os2.sxHeight * metricsScale)
    };
  }

  renderMetricLines(metrics, font) {
    const lines = [
      { pos: metrics.baseline, label: 'Baseline' },
      { pos: metrics.ascender, label: 'Ascender' },
      { pos: metrics.descender, label: 'Descender' },
      { pos: metrics.capHeight, label: 'Capital height' },
      { pos: metrics.xHeight, label: 'x-height' }
    ];

    if (font.tables.os2.sSmallCapHeight) {
      lines.push({
        pos: metrics.baseline - (font.tables.os2.sSmallCapHeight * metrics.metricsScale),
        label: 'Small Caps'
      });
    }

    lines.forEach(({ pos, label }) => {
      if (isFinite(pos)) {
        const line = document.createElement('div');
        line.className = 'metric-line';
        line.style.top = `${pos}px`;

        const legend = document.createElement('div');
        legend.className = 'legend';
        legend.style.top = `${pos - 21}px`;
        legend.textContent = label;

        this.overlay.appendChild(line);
        this.overlay.appendChild(legend);
      }
    });
  }

  renderBearingLines(metrics) {
    if (!metrics.glyph) return;

    // Use the rendered width for sidebearings, which takes into account both
    // font size and any active variation settings
    const leftPos = metrics.containerCenter - (metrics.renderedWidth / 2);
    const rightPos = leftPos + metrics.renderedWidth;

    [leftPos, rightPos].forEach(pos => {
      if (isFinite(pos)) {
        const line = document.createElement('div');
        line.className = 'side-bearing-line';
        line.style.left = `${pos}px`;
        this.overlay.appendChild(line);
      }
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.overlay.style.display = this.isVisible ? 'block' : 'none';
  }
}