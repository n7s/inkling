// =============================================================================
// shared/DragAndDrop.js
// =============================================================================

export class DragAndDrop {
  constructor(options) {
    this.dropZone = options.dropZone;
    this.onDrop = options.onDrop;
    this.setupEventListeners();
  }

  setupEventListeners() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.highlight.bind(this), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.unhighlight.bind(this), false);
    });

    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight() {
    this.dropZone.classList.add('dragover');
  }

  unhighlight() {
    this.dropZone.classList.remove('dragover');
  }

  handleDrop(e) {
    const file = e.dataTransfer.files[0];
    if (!this.validateFontFile(file)) {
      alert('Please drop a valid font file (.ttf .otf .woff)');
      return;
    }

    // Remove drop text immediately when a valid file is dropped
    const dropText = document.getElementById('drop-text');
    if (dropText) {
      dropText.parentNode.removeChild(dropText);
    }

    this.readFile(file);
  }

  validateFontFile(file) {
    return file && file.name.match(/\.(ttf|otf|woff)$/i);
  }

  async readFile(file) {
    try {
      const buffer = await file.arrayBuffer();
      this.onDrop?.(buffer, file.name);
    } catch (error) {
      console.error('Error reading file:', error);
      alert(`Error reading file: ${error.message}`);
    }
  }
}
