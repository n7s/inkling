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

    this.renderMetricLines(metrics, font);
    this.renderBearingLines(metrics);
  }

  calculateMetrics(font, glyphElement, currentChar) {
    const glyphIndex = font.charToGlyphIndex(currentChar);
    const glyph = font.glyphs.get(glyphIndex);
    const fontSize = parseInt(getComputedStyle(glyphElement).fontSize);

    // Use the font's actual UPM value
    const unitsPerEm = font.unitsPerEm;
    const metricsScale = fontSize / unitsPerEm;

    // Get the glyph element's position
    const glyphRect = glyphElement.getBoundingClientRect();
    const verticalCenter = glyphRect.top + (glyphRect.height / 2);
    const horizontalCenter = glyphRect.left + (glyphRect.width / 2);

    // The total height in font units from descender to ascender
    const totalHeight = font.tables.os2.sTypoAscender - font.tables.os2.sTypoDescender;

    // Calculate how much of the total height is above the baseline (in font units)
    const baselineOffset = font.tables.os2.sTypoAscender;

    // Calculate where the baseline should be relative to the center
    // First, get the ratio of the baseline position within the total height
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
      // Calculate other metrics relative to the baseline using the metricsScale
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
    const scaledAdvanceWidth = metrics.glyph.advanceWidth * metrics.metricsScale;
    const leftPos = metrics.containerCenter - (scaledAdvanceWidth / 2);
    const rightPos = leftPos + scaledAdvanceWidth;

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