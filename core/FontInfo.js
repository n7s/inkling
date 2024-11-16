// =============================================================================
// core/FontInfo.js
// =============================================================================

import { AXIS_NAMES } from './Types.js';

export class FontInfoRenderer {
  /**
   * Renders font information into a specified container
   * @param {HTMLElement} container - Container element to render into
   * @param {Object} info - Font information object
   */
  static renderFontInfo(container, info) {
    if (!container || !info) return;

    container.innerHTML = `
        <p><strong>Names</strong><br>
        Font family &rarr; ${info.fontFamily}<br>
        Full name &rarr; ${info.fullName}</p>

        <p><strong>Font file</strong><br>
        Filename &rarr; ${info.filename}<br>
        File format &rarr; ${info.format}<br>
        Units per Em &rarr; ${info.unitsPerEm}<br>
        Glyph count &rarr; ${info.glyphCount}<br>
        Monospaced &rarr; ${info.isFixedPitch}</p>

        <p><strong>Version and dates</strong><br>
        Version &rarr; ${info.version}<br>
        Created &rarr; ${info.created}<br>
        Modified &rarr; ${info.modified}</p>

        <p><strong>Foundry</strong><br>
        Manufacturer &rarr; ${info.manufacturer}<br>
        Designer &rarr; ${info.designer}<br>
        Vendor ID &rarr; ${info.vendorID}</p>

        <p><strong>Copyright</strong><br>
        ${info.copyright}</p>

        ${info.axes.length ? `
        <p><strong>Variable font axes</strong><br>
        ${info.axes.map(axis =>
            `${axis.name} (${axis.tag}) &rarr; ${axis.min} to ${axis.max}, default &rarr; ${axis.default}`
            ).join('<br>')}</p>` : ''}
    `;
  }

  /**
   * Renders glyph information into a specified container
   * @param {HTMLElement} container - Container element to render into
   * @param {Object} font - OpenType.js font object
   * @param {string} glyph - Current glyph character
   */
  static renderGlyphInfo(container, font, glyph) {
    if (!container) return;

    if (!font || !glyph) {
      container.innerHTML = '<p>No glyph selected</p>';
      return;
    }

    const glyphIndex = font.charToGlyphIndex(glyph);
    const glyphObj = font.glyphs.get(glyphIndex);

    container.innerHTML = `
      <p><strong>Glyph information</strong><br>
      Character &rarr; ${glyph}<br>
      Name &rarr; <span class="monospaced">${glyphObj.name}</span><br>
      Unicode &rarr; <span class="monospaced">U+${glyphObj.unicode?.toString(16).toUpperCase().padStart(4, '0') || 'N/A'}</span><br>
      Index &rarr; <span class="monospaced">${glyphIndex}</span><br>
      Advance Width &rarr; <span class="monospaced">${glyphObj.advanceWidth}</span></p>
      ${glyphObj.xMin !== undefined ? `
      <p><strong>Bounds</strong><br>
      xMin &rarr; <span class="monospaced">${glyphObj.xMin}</span><br>
      xMax &rarr; <span class="monospaced">${glyphObj.xMax}</span><br>
      yMin &rarr; <span class="monospaced">${glyphObj.yMin}</span><br>
      yMax &rarr; <span class="monospaced">${glyphObj.yMax}</span></p>
      ` : ''}
    `;
  }
}

/**
 * Extracts comprehensive information about a font
 * @param {Object} font - OpenType.js font object
 * @param {string} filename - Original font filename
 * @returns {Object} Detailed font information
 */
export function getFontInformation(font, filename) {
  const names = font.names;
  const os2 = font.tables.os2;
  const head = font.tables.head;

  return {
    // Basic info
    filename,
    fontFamily: names.fontFamily?.en || 'Unknown',
    fullName: names.fullName?.en || 'Unknown',
    version: names.version?.en || 'Unknown',

    // Author info
    copyright: names.copyright?.en || 'Unknown',
    manufacturer: names.manufacturer?.en || 'Unknown',
    designer: names.designer?.en || 'Unknown',
    vendorID: os2?.achVendID || 'Unknown',

    // Technical details
    format: font.outlinesFormat,
    unitsPerEm: head?.unitsPerEm || 'Unknown',
    created: head?.created ? new Date(head.created * 1000).toLocaleDateString() : 'Unknown',
    modified: head?.modified ? new Date(head.modified * 1000).toLocaleDateString() : 'Unknown',
    glyphCount: font.glyphs.length,

    // Features
    isFixedPitch: font.tables.post?.isFixedPitch ? 'Yes' : 'No',
    features: extractOpenTypeFeatures(font),

    // Variable font axes
    axes: extractVariableAxes(font)
  };
}

// Helper functions remain the same
function extractOpenTypeFeatures(font) {
  const features = [];
  if (font.tables.gsub) {
    font.tables.gsub.features.forEach(feature => {
      features.push({
        tag: feature.tag,
        scripts: feature.feature.lookupListIndexes
      });
    });
  }
  return features;
}

function extractVariableAxes(font) {
  if (!font.tables.fvar) return [];

  return font.tables.fvar.axes.map(axis => ({
    tag: axis.tag,
    name: AXIS_NAMES[axis.tag] || axis.tag,
    min: axis.minValue,
    max: axis.maxValue,
    default: axis.defaultValue
  }));
}