// =============================================================================
// core/FontInfo.js
// =============================================================================

import { AXIS_NAMES } from './Types.js';
import { unicodeName } from "../shared/unicode-name.js";
import {  unicodeScript } from "../shared/unicode-script.js";
import {  unicodeBlock } from "../shared/unicode-block.js";

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
        Font family: ${info.fontFamily}<br>
        Full name: ${info.fullName}<br>

        <p><strong>Description</strong><br>
		${info.description}</p>

        <p><strong>Font file</strong><br>
        Filename: ${info.filename}<br>
        File format: ${info.format}<br>
        Units per Em: ${info.unitsPerEm}<br>
        Monospaced: ${info.isFixedPitch}<br>

        <p><strong>Version and dates</strong><br>
        Version: ${info.version}<br>
		Unique ID: ${info.uniqueID}<br>
        Created: ${info.created}<br>
        Modified: ${info.modified}<br></p>

        <p><strong>Foundry</strong><br>
		${info.manufacturer || ''} 
        <a href="${info.manufacturerURL || ''}" target="_blank">${info.manufacturerURL || ''}</a><br>
        Vendor ID:  ${info.vendorID}<br>
        Designer(s): ${info.designer} <a href="${info.designerurl || ''}" target="_blank"> ${info.designerurl || ''}</a>  </p>

        <p><strong>Copyright</strong><br>
        ${info.copyright}</p>

        <p><strong>License</strong><br>
        <a href="${info.licenseURL || ''} " target="_blank">${info.licenseURL}</a><br>

        <p><strong>Trademark</strong><br>
        ${info.trademark}</p>

        ${info.axes.length ? `
        <p><strong>Variable font axes</strong><br>
        ${info.axes.map(axis =>
            `${axis.name} (${axis.tag}) : ${axis.min} to ${axis.max}, default: ${axis.default}`
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
	const fullUniName = unicodeName(glyph);
	const uniScript = unicodeScript(glyph);
	const uniBlock = unicodeBlock(glyph);

	// const category  = unicode.getCategory(glyph.charCodeAt())

    container.innerHTML = `
    <div class="glyph-info-container">
      <div class="info-column">
        <span class="monospaced"> 
        <p>${glyphObj.name}</p>
		<p>${fullUniName}</p>
		<i>
		<p>Script: ${uniScript}</p>
		<p>Block: ${uniBlock}</p>
		<p>Hex: U+${glyphObj.unicode?.toString(16).toUpperCase().padStart(4, '0') || ''}</p>
		<p>#${glyphIndex} / ${font.glyphs.length} </i> </p> </span>
      </div>

      ${glyphObj.xMin !== undefined ? `
      ` : ''}
    </div>
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
  const fvar = font.tables.fvar;

  console.log('Font tables available:', {
    hasNames: !!names,
    hasOS2: !!os2,
    hasHead: !!head,
    hasFvar: !!fvar,
    fvarAxes: fvar?.axes
  });

  const info = {
    // Basic info
    filename,
    fontFamily: names.fontFamily?.en || '',
    fullName: names.fullName?.en || '',
    description: names.description?.en || '',
    version: names.version?.en || '',
	uniqueID: names.uniqueID?.en || '',

    // Author info
    copyright: names.copyright?.en || '',
    license: names.license?.en || '',
    licenseURL: names.licenseURL?.en || '',
    trademark: names.trademark?.en || '',
    manufacturer: names.manufacturer?.en || '',
    manufacturerURL: names.manufacturerURL?.en || '',
    designer: names.designer?.en || '',
    designerURL: names.designerURL?.en || '',
    vendorID: os2?.achVendID || '',

    // Technical details
    format: font.outlinesFormat,
    unitsPerEm: head?.unitsPerEm || '',
    created: head?.created ? new Date(head.created * 1000).toLocaleDateString() : '',
    modified: head?.modified ? new Date(head.modified * 1000).toLocaleDateString() : '',
    glyphCount: font.glyphs.length,

    // Features
    isFixedPitch: font.tables.post?.isFixedPitch ? 'Yes' : 'No',
    features: extractOpenTypeFeatures(font),

    // Variable font axes
    axes: extractVariableAxes(font)
  };

// Before returning the info object
console.log('Full font axes information:', {
  rawFvar: font.tables.fvar,
  extractedAxes: extractVariableAxes(font),
});

return info;
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
  if (!font.tables.fvar) {
    console.log('No fvar table found in font');
    return [];
  }

  console.log('Raw fvar axes:', font.tables.fvar.axes);

  const axes = font.tables.fvar.axes.map(axis => {
    const mappedAxis = {
      tag: axis.tag,
      name: AXIS_NAMES[axis.tag] || axis.tag,
      min: axis.minValue,
      max: axis.maxValue,
      default: axis.defaultValue
    };
    console.log('Mapped axis:', mappedAxis);
    return mappedAxis;
  });

  console.log('Final extracted axes:', axes);
  return axes;
}
