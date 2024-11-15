// Predefined word list for display
const words = [
  'Hello', 'World', 'OpenType', 'Features', 'Typography',
  'Design', 'Creative', 'Awesome', 'Beautiful', 'Elegant',
  'Explore', 'Wonder', 'Magic', 'Journey', 'Dream'
];

let fontFeatures = [];
let wordInterval;
let loadedFont = null;

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function fitTextToWindow(element) {
  const containerWidth = window.innerWidth - 40;
  const measureDiv = document.createElement('div');
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.position = 'absolute';
  measureDiv.style.fontFamily = element.style.fontFamily;
  measureDiv.style.fontFeatureSettings = element.style.fontFeatureSettings;
  measureDiv.style.fontVariationSettings = element.style.fontVariationSettings;
  measureDiv.style.whiteSpace = 'nowrap';
  measureDiv.textContent = element.textContent;
  document.body.appendChild(measureDiv);

  const fontSize = 100;
  measureDiv.style.fontSize = `${fontSize}px`;
  const scale = containerWidth / measureDiv.offsetWidth;
  const targetSize = Math.floor(fontSize * scale);

  element.style.fontSize = `${targetSize}px`;
  document.body.removeChild(measureDiv);
}

function updateWord() {
  const wordContainer = document.getElementById('word');
  wordContainer.classList.add('fade-out');

  setTimeout(() => {
    const word = getRandomWord();
    const wordElement = document.createElement('div');
    wordElement.textContent = word;
    wordElement.style.fontFamily = 'LoadedFont';

    // Apply random OpenType feature if available
    if (fontFeatures.length > 0) {
      const currentFeature = fontFeatures[Math.floor(Math.random() * fontFeatures.length)];
      wordElement.style.fontFeatureSettings = `"${currentFeature}" 1`;
    } else {
      wordElement.style.fontFeatureSettings = 'normal';
    }

    // Clear and update word container
    wordContainer.innerHTML = '';
    wordContainer.appendChild(wordElement);
    fitTextToWindow(wordElement);
    wordContainer.classList.remove('fade-out');
  }, 300);
}

function startWordAnimation() {
  updateWord();
  wordInterval = setInterval(updateWord, 3000);
}

function handleFiles(files) {
  const file = files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    try {
      loadedFont = opentype.parse(arrayBuffer);

      // Extract OpenType features
      fontFeatures = [];
      if (loadedFont.tables.gsub) {
        const features = loadedFont.tables.gsub.features;
        features.forEach(feature => {
          fontFeatures.push(feature.tag);
        });
      }

      // Update feature info display
      const featureInfo = document.getElementById('feature-info');
      featureInfo.innerHTML = `<strong>${loadedFont.names.fullName?.en || 'Unknown Font'}</strong>`;
      if (fontFeatures.length > 0) {
        featureInfo.innerHTML += `<br>Features: ${fontFeatures.join(', ')}`;
      }

      // Load and start using the font
      const fontFace = new FontFace('LoadedFont', arrayBuffer);
      fontFace.load().then(function(loadedFace) {
        document.fonts.add(loadedFace);
        document.getElementById('dropZone').classList.add('hidden');
        startWordAnimation();
      });
    } catch (err) {
      console.error('Error loading font:', err);
    }
  };

  reader.readAsArrayBuffer(file);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const wordContainer = document.getElementById('word');
  const featureInfo = document.getElementById('feature-info');
  const featureToggle = document.getElementById('features-toggle');
  const colorToggle = document.getElementById('color-toggle');

  // Initialize drop zone
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  // Feature toggle
  featureToggle.addEventListener('click', () => {
    const isVisible = featureInfo.style.display !== 'none';
    featureInfo.style.display = isVisible ? 'none' : 'block';
    featureToggle.textContent = isVisible ? 'Show features' : 'Hide features';
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    if (wordContainer.firstChild) {
      fitTextToWindow(wordContainer.firstChild);
    }
  });
});

// Export functions that need to be accessible
window.handleFiles = handleFiles;