const controls = document.getElementById('controls');
const frontBuffer = document.getElementById('glyph-display');
let animationInterval;
let currentGlyphs = [];
let currentVariationSettings = {};
let isAnimating = false;
let isDarkMode = false;
let currentFont = null;
let isRandomOrder = false;
let sequentialGlyphs = [];
let currentIndex = 0;  // Added to track current position

// Fullscreen button
// Get the documentElement (<html>) to display the page in fullscreen
const elem = document.documentElement;

// Set initial state
let fullScreen = false;

// Set button text as a variable
let fullscreenButton = document.getElementById("fullscreenButton");

// Set fullscreen function
function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
    fullScreen = true;
    fullscreenButton.innerHTML = "Windowed";
}

// Close fullscreen function
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
    fullScreen = false;
    fullscreenButton.innerHTML = "Fullscreen";
}

// Toggle function
function fullscreenToggle() {
    if (fullScreen) {
        closeFullscreen();
    } else {
        openFullscreen();
    }
}

// Listen for exiting fullScreen mode via `escape` key
document.addEventListener('fullscreenchange', exitHandler);
document.addEventListener('webkitfullscreenchange', exitHandler);
document.addEventListener('mozfullscreenchange', exitHandler);
document.addEventListener('MSFullscreenChange', exitHandler);

function exitHandler() {
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        closeFullscreen();
    }
}

// Add keyboard event listener
window.addEventListener('keydown', handleKeyPress);

// Handle keypresses
function handleKeyPress(event) {
  const { key } = event;

  // Prevent default behavior for control keys
  if (['Space', 'ArrowLeft', 'ArrowRight', 'h', 'j', 'k', 'l'].includes(key)) {
    event.preventDefault();
  }

  switch (key) {
    case ' ':
    // Toggle animation without resetting currentIndex
    isAnimating = !isAnimating;
    if (isAnimating) {
      const interval = parseInt(speedSlider.value);
      // Use the existing currentIndex when resuming
      animate(currentGlyphs, interval);
    } else if (animationInterval) {
      clearTimeout(animationInterval);
    }
    break;
    case 'ArrowLeft':
    case 'h':
    // Move back 10 glyphs
    isAnimating = false;
    if (animationInterval) clearTimeout(animationInterval);
    currentIndex = Math.max(0, currentIndex - 10);
    displayCurrentGlyph();
    break;
    case 'j':
    case 'ArrowDown':
    // Move back 1 glyph
    isAnimating = false;
    if (animationInterval) clearTimeout(animationInterval);
    currentIndex = Math.max(0, currentIndex - 1);
    displayCurrentGlyph();
    break;
    case 'ArrowRight':
    case 'l':
    // Move forward 10 glyphs
    isAnimating = false;
    if (animationInterval) clearTimeout(animationInterval);
    currentIndex = Math.min(currentGlyphs.length - 1, currentIndex + 10);
    displayCurrentGlyph();
    break;
    case 'k':
    case 'ArrowUp':
    // Move forward 1 glyph
    isAnimating = false;
    if (animationInterval) clearTimeout(animationInterval);
    currentIndex = Math.min(currentGlyphs.length - 1, currentIndex + 1);
    displayCurrentGlyph();
    break;
  }
}

// Helper function to display current glyph
function displayCurrentGlyph() {
  if (currentGlyphs.length === 0) return;
  const currentChar = currentGlyphs[currentIndex];
  frontBuffer.textContent = currentChar;
  updateGlyphInfo(currentChar);
}

// Modified animation functions
function animate(glyphs, interval) {
  if (!glyphs || glyphs.length === 0) {
    console.error('No glyphs available for animation');
    return;
  }

  const nextFrame = () => {
    if (!isAnimating) return;
    const currentChar = glyphs[currentIndex];
    frontBuffer.textContent = currentChar;
    updateGlyphInfo(currentChar);
    currentIndex = (currentIndex + 1) % glyphs.length;
    animationInterval = setTimeout(nextFrame, interval);
  };

  nextFrame();
}

// Modified cleanup function to reset index
function cleanupCurrentFont() {
  isAnimating = false;
  if (animationInterval) {
    clearTimeout(animationInterval);
  }

  currentGlyphs = [];
  sequentialGlyphs = [];
  currentVariationSettings = {};
  currentIndex = 0;  // Reset the index

  if (currentFont) {
    const currentFontFamily = frontBuffer.style.fontFamily;
    document.fonts.forEach(font => {
      if (font.family === currentFontFamily) {
        document.fonts.delete(font);
      }
    });
  }

  frontBuffer.textContent = '';
}

// Font information
function getFontInformation(font, filename) {  // Add filename parameter
  const names = font.names;
  const os2 = font.tables.os2;
  const head = font.tables.head;

  return {
    filename: filename,  // Add filename to the info object
    fontFamily: names.fontFamily?.en || 'Unknown',
    fullName: names.fullName?.en || 'Unknown',
    version: names.version?.en || 'Unknown',
    copyright: names.copyright?.en || 'Unknown',
    manufacturer: names.manufacturer?.en || 'Unknown',
    designer: names.designer?.en || 'Unknown',
    vendorID: os2?.achVendID || 'Unknown',
    format: font.outlinesFormat,
    unitsPerEm: head?.unitsPerEm || 'Unknown',
    created: head?.created ? new Date(head.created * 1000).toLocaleDateString() : 'Unknown',
    modified: head?.modified ? new Date(head.modified * 1000).toLocaleDateString() : 'Unknown',
    glyphCount: font.glyphs.length,
    isFixedPitch: font.tables.post?.isFixedPitch ? 'Yes' : 'No',
    axes: font.tables.fvar ? font.tables.fvar.axes.map(axis => ({
      tag: axis.tag,
      name: getAxisName(axis.tag),
      min: axis.minValue,
      max: axis.maxValue,
      default: axis.defaultValue
    })) : []
  };
}

function updateFontInfo(font, filename) {  // Add filename parameter
  const info = getFontInformation(font, filename);
  const content = document.getElementById('font-info-content');

  content.innerHTML = `
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

// Glyph information
function updateGlyphInfo(char) {
  if (!currentFont) return;

  const glyphIndex = currentFont.charToGlyphIndex(char);
  const glyph = currentFont.glyphs.get(glyphIndex);
  const unicode = char.codePointAt(0);

  const content = document.getElementById('glyph-info-content');
  content.innerHTML = `
            Name &rarr; ${glyph.name || 'Unknown'}<br>
            Unicode &rarr; <span class="monospaced">U+${unicode.toString(16).toUpperCase().padStart(4, '0')}</span><br>
            Index &rarr; <span class="monospaced">${glyphIndex}</span>
        `;
}

// Modified renderFontMetricsOverlay function with corrected side bearing calculations
function renderFontMetricsOverlay(font) {
  const overlay = document.getElementById('font-metrics-overlay');
  const glyphDisplay = document.querySelector('.glyph-buffer');
  overlay.innerHTML = '';

  // Get current glyph
  const currentChar = glyphDisplay.textContent;
  const glyphIndex = font.charToGlyphIndex(currentChar);
  const glyph = font.glyphs.get(glyphIndex);

  // Get font size for metrics scaling
  const fontSize = parseInt(getComputedStyle(glyphDisplay).fontSize);
  const metricsScale = fontSize / font.unitsPerEm;

  // Get rendered glyph dimensions and calculate advance width scaling
  const glyphRect = glyphDisplay.getBoundingClientRect();
  const containerCenter = glyphRect.left + (glyphRect.width / 2);
  const advanceScale = glyphRect.width / glyph.advanceWidth;

  // Calculate baseline position
  const baselineOffset = (font.tables.os2.sTypoAscender * metricsScale);
  const baseline = glyphRect.top + baselineOffset;

  // Create metric lines helper function
  function createMetricLine(yPosition, label) {
    const line = document.createElement('div');
    line.className = 'metric-line';
    line.style.top = `${yPosition}px`;

    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.style.top = `${yPosition - 21}px`;
    legend.innerText = label;

    overlay.appendChild(line);
    overlay.appendChild(legend);
  }

  // Add standard metric lines
  createMetricLine(baseline, 'Baseline');
  createMetricLine(baseline - (font.tables.os2.sTypoAscender * metricsScale), 'Ascender');
  createMetricLine(baseline + -(font.tables.os2.sTypoDescender * metricsScale), 'Descender');
  createMetricLine(baseline - (font.tables.os2.sxHeight * metricsScale), 'x-Height');
  createMetricLine(baseline - (font.tables.os2.sCapHeight * metricsScale), 'Cap Height');

  if (font.tables.os2.sSmallCapHeight) {
    createMetricLine(baseline - (font.tables.os2.sSmallCapHeight * metricsScale), 'Small Caps');
  }

  // Calculate side bearing positions using advance width scaling
  const scaledAdvanceWidth = glyph.advanceWidth * advanceScale;
  const leftBearingPosition = containerCenter - (scaledAdvanceWidth / 2);
  const rightBearingPosition = leftBearingPosition + scaledAdvanceWidth;

  // Create bearing lines
  const leftLine = document.createElement('div');
  leftLine.className = 'side-bearing-line';
  leftLine.style.left = `${leftBearingPosition}px`;
  overlay.appendChild(leftLine);

  const rightLine = document.createElement('div');
  rightLine.className = 'side-bearing-line';
  rightLine.style.left = `${rightBearingPosition}px`;
  overlay.appendChild(rightLine);
}

// Call renderFontMetricsOverlay whenever the glyph changes
function updateGlyphInfo(char) {
  if (!currentFont) return;

  const glyphIndex = currentFont.charToGlyphIndex(char);
  const glyph = currentFont.glyphs.get(glyphIndex);
  const unicode = char.codePointAt(0);

  const content = document.getElementById('glyph-info-content');
  content.innerHTML = `
        Name &rarr; ${glyph.name || 'Unknown'}<br>
        Unicode &rarr; <span class="monospaced">U+${unicode.toString(16).toUpperCase().padStart(4, '0')}</span><br>
        Index &rarr; <span class="monospaced">${glyphIndex}</span>
    `;

  // Update metrics overlay if visible
  if (document.getElementById('font-metrics-overlay').style.display !== 'none') {
    renderFontMetricsOverlay(currentFont);
  }
}

// Initial overlay setup (hidden by default)
document.getElementById('font-metrics-overlay').style.display = 'none';

// Slider elements
const fontSizeSlider = document.getElementById('font-size');
const speedSlider = document.getElementById('animation-dalay');
const verticalPositionSlider = document.getElementById('vertical-position');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Handle drag and drop styling
['dragenter', 'dragover'].forEach(eventName => {
  document.body.addEventListener(eventName, () => document.body.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, () => document.body.classList.remove('dragover'), false);
});

// Handle font size slider
fontSizeSlider.addEventListener('input', (e) => {
  const newSize = e.target.value;
  frontBuffer.style.fontSize = `${newSize}px`;
  e.target.nextElementSibling.textContent = `${newSize}px`;
});

// Handle animation speed slider
speedSlider.addEventListener('input', (e) => {
  const newInterval = parseInt(e.target.value);
  e.target.nextElementSibling.textContent = `${newInterval}ms`;

  if (animationInterval) {
    clearTimeout(animationInterval);
    isAnimating = false;
  }

  isAnimating = true;
  startAnimation(currentGlyphs, newInterval);
});

// Handle vertical position slider
verticalPositionSlider.addEventListener('input', (e) => {
  const reversedPosition = e.target.max - e.target.value;
  frontBuffer.style.top = `${reversedPosition - 50}%`;
  e.target.nextElementSibling.textContent = `${reversedPosition}%`;
});

// Toggle background color
document.getElementById('background-toggle').addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    document.documentElement.style.setProperty('--white', 'rgb(0, 0, 0)');
    document.documentElement.style.setProperty('--black', 'rgb(255, 255, 255)');
  } else {
    document.documentElement.style.setProperty('--white', 'rgb(255, 255, 255)');
    document.documentElement.style.setProperty('--black', 'rgb(0, 0, 0)');
  }
});

// Initialize font handling
async function initializeFont(buffer, filename) {  // Add filename parameter
  // 1. Parse and load the font
  currentFont = opentype.parse(buffer);
  updateFontInfo(currentFont, filename);  // Pass filename to updateFontInfo
  const uniqueFontName = `UploadedFont_${Date.now()}`;
  const fontFace = new FontFace(uniqueFontName, buffer);
  await fontFace.load();
  document.fonts.add(fontFace);

  // 2. Reset the display buffer
  frontBuffer.style.fontFamily = `"${uniqueFontName}"`;
  frontBuffer.style.fontSize = `${fontSizeSlider.value}px`;
  frontBuffer.style.top = '0';

  // 3. Reset all controls to default values
  // fontSizeSlider.value = 600;
  // fontSizeSlider.nextElementSibling.textContent = '600px';

  // speedSlider.value = 100;
  // speedSlider.nextElementSibling.textContent = '100ms';

  // verticalPositionSlider.value = 50;
  // verticalPositionSlider.nextElementSibling.textContent = '50%';

  // 4. Reset animation state
  isAnimating = false;
  if (animationInterval) {
    clearTimeout(animationInterval);
  }

  // 5. Reset and recreate variable font axes
  currentVariationSettings = {};
  frontBuffer.style.fontVariationSettings = 'normal';
  clearAxisSliders();
  if (currentFont.tables.fvar) {
    currentFont.tables.fvar.axes.forEach(axis => {
      createAxisSlider(axis.tag, {
        name: getAxisName(axis.tag),
        min: axis.minValue,
        max: axis.maxValue,
        default: axis.defaultValue
      });
    });
  }

  // 6. Reset glyph order state
  isRandomOrder = false;
  const randomizeButton = document.getElementById('randomize-button');
  randomizeButton.textContent = "Randomize glyph order";

  // 7. Load new glyphs and start animation
  currentGlyphs = await getGlyphs();
  sequentialGlyphs = [...currentGlyphs]; // Store original order

  const initialInterval = parseInt(speedSlider.value);
  isAnimating = true;
  startAnimation(currentGlyphs, initialInterval);
}

// Handle file drop
async function handleDrop(e) {
  const dt = e.dataTransfer;
  const file = dt.files[0];

  // Remove drop text if it exists
  const dropText = document.getElementById('drop-text');
  if (dropText) {
    dropText.remove();
  }

  if (!file.name.match(/\.(ttf|otf)$/i)) {
    alert('Please drop a valid font file (.ttf or .otf)');
    return;
  }

  // Clean up current font
  cleanupCurrentFont();

  try {
    const buffer = await file.arrayBuffer();
    await initializeFont(buffer, file.name);  // Pass filename to initializeFont
  } catch (error) {
    console.error('Error loading font:', error);
    alert(`Error loading font: ${error.message}`);
    frontBuffer.textContent = '';
  }
}

function cleanupCurrentFont() {
  // Stop animation
  isAnimating = false;
  if (animationInterval) {
    clearTimeout(animationInterval);
  }

  // Clear current font data
  currentGlyphs = [];
  sequentialGlyphs = [];
  currentVariationSettings = {};

  // Remove the current font from the font registry if it exists
  if (currentFont) {
    const currentFontFamily = frontBuffer.style.fontFamily;
    document.fonts.forEach(font => {
      if (font.family === currentFontFamily) {
        document.fonts.delete(font);
      }
    });
  }

  // Clear the display
  frontBuffer.textContent = '';
}

// Generate glyphs for display
async function getGlyphs() {
  if (!currentFont) {
    throw new Error('No font currently loaded');
  }

  const chars = [];
  for (let i = 0; i < currentFont.glyphs.length; i++) {
    const glyph = currentFont.glyphs.get(i);
    if (glyph.name === '.notdef' || glyph.unicode === undefined) {
      continue;
    }
    const char = String.fromCodePoint(glyph.unicode);
    chars.push(char);
  }
  return chars;
}

// Update the startAnimation function to use the new animate function
async function startAnimation(glyphs, interval) {
  if (!glyphs || glyphs.length === 0) {
    console.error('No glyphs available for animation');
    return;
  }

  isAnimating = true;
  animate(glyphs, interval);
}

// Create sliders for variable font axes
function createAxisSlider(tag, settings) {
  const container = document.createElement('div');
  container.className = 'slider-container variation-axis';

  const label = document.createElement('label');
  label.textContent = `${settings.name} (${tag})`;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = settings.min;
  slider.max = settings.max;
  slider.value = settings.default;
  slider.step = (settings.max - settings.min) / 1000;

  const value = document.createElement('span');
  value.className = 'value';
  value.textContent = settings.default;

  slider.addEventListener('input', (e) => {
    updateVariationSettings(tag, e.target.value);
    if (isNaN(currentVariationSettings[tag])) {
      delete currentVariationSettings[tag];
      return;
    }
    const settingsString = Object.entries(currentVariationSettings)
    .filter(([_, val]) => !isNaN(val))
    .map(([tag, val]) => `"${tag}" ${val}`)
    .join(', ');
    frontBuffer.style.fontVariationSettings = settingsString || 'normal';
    value.textContent = parseFloat(e.target.value).toFixed(1);
  });

  container.appendChild(label);
  container.appendChild(slider);
  container.appendChild(value);
  controls.appendChild(container);

  slider.addEventListener('input', (e) => {
    currentVariationSettings[tag] = parseFloat(e.target.value);
    if (isNaN(currentVariationSettings[tag])) {
      delete currentVariationSettings[tag];
      return;
    }
    const settingsString = Object.entries(currentVariationSettings)
    .filter(([_, val]) => !isNaN(val))
    .map(([tag, val]) => `"${tag}" ${val}`)
    .join(', ');
    frontBuffer.style.fontVariationSettings = settingsString || 'normal';
    value.textContent = parseFloat(e.target.value).toFixed(1);

    // Update metrics when axis changes
    if (document.getElementById('font-metrics-overlay').style.display !== 'none') {
      renderFontMetricsOverlay(currentFont);
    }
  });
}

// Helper to get axis names
function getAxisName(tag) {
  const axisNames = {
    'wght': 'Weight',
    'wdth': 'Width',
    'ital': 'Italic',
    'slnt': 'Slant',
    'opsz': 'Optical Size',
  };
  return axisNames[tag] || tag;
}

// Clear axis sliders
function clearAxisSliders() {
  const existingSliders = controls.querySelectorAll('.variation-axis');
  existingSliders.forEach(slider => slider.remove());
}

// Handle randomize button
document.getElementById('randomize-button').addEventListener('click', () => {
  if (isRandomOrder) {
    currentGlyphs = [...sequentialGlyphs];
    document.getElementById('randomize-button').textContent = "Randomize glyph order";
  } else {
    sequentialGlyphs = [...currentGlyphs];
    currentGlyphs = shuffleArray(currentGlyphs);
    document.getElementById('randomize-button').textContent = "Sequential glyph order";
  }

  isRandomOrder = !isRandomOrder;
  isAnimating = false;
  if (animationInterval) clearTimeout(animationInterval);
  const initialInterval = parseInt(speedSlider.value);
  startAnimation(currentGlyphs, initialInterval);
});

// Helper function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize drop handlers
document.body.addEventListener('drop', handleDrop, false);

// Initialize the font info
document.getElementById('info-toggle').addEventListener('click', function() {
  const infoPanel = document.getElementById('font-info');
  const isVisible = infoPanel.style.display !== 'none';
  infoPanel.style.display = isVisible ? 'none' : 'block';
  this.textContent = isVisible ? 'Show font info' : 'Hide font info';
});

// Initialize the glyph info
document.getElementById('glyph-info-toggle').addEventListener('click', function() {
  const infoPanel = document.getElementById('glyph-info');
  const isVisible = infoPanel.style.display !== 'none';
  infoPanel.style.display = isVisible ? 'none' : 'block';
  this.textContent = isVisible ? 'Show glyph info' : 'Hide glyph info';
});

document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('font-metrics-overlay');
  const toggleButton = document.getElementById('metrics-toggle');

  if (overlay && toggleButton) {
    overlay.style.display = 'none';

    toggleButton.addEventListener('click', function() {
      if (!currentFont) {
        console.error('No font loaded.');
        return;
      }

      const isHidden = overlay.style.display === 'none';
      overlay.style.display = isHidden ? 'block' : 'none';

      if (isHidden) {
        renderFontMetricsOverlay(currentFont);
        this.innerText = 'Hide metrics';
      } else {
        this.innerText = 'Show metrics';
      }
    });
  }
});

// Initial state
document.getElementById('font-metrics-overlay').style.display = 'none';

// After document is ready, hide the font info panel and update button text
document.addEventListener('DOMContentLoaded', function() {
  const fontInfo = document.getElementById('font-info');
  const infoToggle = document.getElementById('info-toggle');

  // Hide the font info panel initially
  fontInfo.style.display = 'none';
  // Update the button text to reflect the hidden state
  infoToggle.textContent = 'Show font info';
});

// Event listeners for changes to update the metrics display
window.addEventListener('resize', () => {
  if (currentFont && document.getElementById('font-metrics-overlay').style.display !== 'none') {
    renderFontMetricsOverlay(currentFont);
  }
});

document.getElementById('font-size').addEventListener('input', () => {
  if (currentFont && document.getElementById('font-metrics-overlay').style.display !== 'none') {
    renderFontMetricsOverlay(currentFont);
  }
});

document.getElementById('vertical-position').addEventListener('input', () => {
  if (currentFont && document.getElementById('font-metrics-overlay').style.display !== 'none') {
    renderFontMetricsOverlay(currentFont);
  }
});

// Horizontal metrics event listeners
window.addEventListener('resize', updateMetricsAndSideBearings);
document.getElementById('font-size').addEventListener('input', updateMetricsAndSideBearings);
document.getElementById('vertical-position').addEventListener('input', updateMetricsAndSideBearings);

function updateMetricsAndSideBearings() {
  if (currentFont && document.getElementById('font-metrics-overlay').style.display !== 'none') {
    renderFontMetricsOverlay(currentFont);
  }
}

// Add variable axis update handler
document.addEventListener('variationchange', () => {
  if (currentFont && document.getElementById('font-metrics-overlay').style.display !== 'none') {
    renderFontMetricsOverlay(currentFont);
  }
});

// Dispatch event when axis values change
function updateVariationSettings(tag, value) {
  currentVariationSettings[tag] = parseFloat(value);
  const event = new Event('variationchange');
  document.dispatchEvent(event);
}