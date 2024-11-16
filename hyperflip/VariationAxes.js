// =============================================================================
// hyperflip/VariationAxes.js
// =============================================================================

export class VariationAxes {
  /**
   * Creates a new VariationAxes instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container for axis controls
   * @param {Function} options.onChange - Callback when axes change
   */
  constructor(options) {
    this.container = options.container;
    this.onChange = options.onChange;
    this.currentSettings = {};
  }

  /**
   * Creates sliders for variable font axes
   * @param {Array<AxisDefinition>} axes - Array of axis definitions
   */
  createAxesControls(axes) {
    this.container.innerHTML = '';
    this.currentSettings = {};

    axes.forEach(axis => {
      const container = document.createElement('div');
      container.className = 'slider-container variation-axis';

      const label = document.createElement('label');
      label.textContent = `${axis.name} (${axis.tag})`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = axis.min;
      slider.max = axis.max;
      slider.value = axis.default;
      slider.step = (axis.max - axis.min) / 1000;

      const value = document.createElement('span');
      value.className = 'value';
      value.textContent = axis.default;

      slider.addEventListener('input', (e) => {
        this.updateAxisValue(axis.tag, e.target.value);
        value.textContent = parseFloat(e.target.value).toFixed(1);
      });

      container.appendChild(label);
      container.appendChild(slider);
      container.appendChild(value);
      this.container.appendChild(container);
    });
  }

  /**
   * Updates a single axis value
   * @private
   */
  updateAxisValue(tag, value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      delete this.currentSettings[tag];
    } else {
      this.currentSettings[tag] = numValue;
    }

    this.updateVariationSettings();
  }

  /**
   * Updates variation settings and triggers callback
   * @private
   */
  updateVariationSettings() {
    const settings = Object.entries(this.currentSettings)
      .filter(([_, val]) => !isNaN(val))
      .map(([tag, val]) => `"${tag}" ${val}`)
      .join(', ');

    this.onChange?.(settings || 'normal');
  }
}