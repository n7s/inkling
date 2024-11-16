// =============================================================================
// shared/DragAndDrop.js
// =============================================================================

export class DragAndDrop {
  /**
   * Creates a new DragAndDrop instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.dropZone - Drop zone element
   * @param {Function} options.onDrop - Callback when file is dropped
   */
  constructor(options) {
    this.dropZone = options.dropZone;
    this.onDrop = options.onDrop;
    this.setupEventListeners();
  }

  /**
   * Sets up drag and drop event listeners
   * @private
   */
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

  /**
   * Prevents default drag and drop behaviors
   * @private
   */
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Highlights drop zone
   * @private
   */
  highlight() {
    this.dropZone.classList.add('dragover');
  }

  /**
   * Removes drop zone highlight
   * @private
   */
  unhighlight() {
    this.dropZone.classList.remove('dragover');
  }

  /**
   * Handles file drop event
   * @private
   */
  handleDrop(e) {
    const file = e.dataTransfer.files[0];
    if (!this.validateFontFile(file)) {
      alert('Please drop a valid font file (.ttf or .otf)');
      return;
    }

    this.readFile(file);
  }

  /**
   * Validates font file type
   * @private
   */
  validateFontFile(file) {
    return file && file.name.match(/\.(ttf|otf)$/i);
  }

  /**
   * Reads dropped file
   * @private
   */
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