// =============================================================================
// core/Types.js
// =============================================================================

/**
 * @typedef {Object} FontMetrics
 * @property {number} ascender
 * @property {number} descender
 * @property {number} xHeight
 * @property {number} capHeight
 * @property {number} unitsPerEm
 */

/**
 * @typedef {Object} AxisDefinition
 * @property {string} tag
 * @property {string} name
 * @property {number} min
 * @property {number} max
 * @property {number} default
 */

export const AXIS_NAMES = {
  'wght': 'Weight',
  'wdth': 'Width',
  'ital': 'Italic',
  'slnt': 'Slant',
  'opsz': 'Optical Size',
};
