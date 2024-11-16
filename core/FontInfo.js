// =============================================================================
// core/FontInfo.js
// =============================================================================

import { AXIS_NAMES } from './Types.js';

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

/**
 * Extracts OpenType feature information
 * @param {Object} font - OpenType.js font object
 * @returns {Array} Array of feature objects
 */
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

/**
 * Extracts variable font axis information
 * @param {Object} font - OpenType.js font object
 * @returns {Array<AxisDefinition>} Array of axis definitions
 */
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