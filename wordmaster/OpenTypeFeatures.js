// =============================================================================
// wordmaster/OpenTypeFeatures.js
// =============================================================================

class OpenTypeFeatures {
  constructor(onFeaturesChanged) {
    this.activeFeatures = new Set();
    this.availableFeatures = new Set();
    this.buttonsContainer = document.querySelector('.buttons-container');
    this.onFeaturesChanged = onFeaturesChanged;
  }

  extractFeatures(fontInfo) {
    const features = new Set();

    try {
      if (fontInfo.features) {
        this.processFeatures(fontInfo.features, features);
      }

      if (fontInfo.tables && fontInfo.tables.GSUB) {
        this.processGsubTable(fontInfo.tables.GSUB, features);
      }

      if (fontInfo.GSUB) {
        this.processGsubTable(fontInfo.GSUB, features);
      }

      if (fontInfo.opentype && fontInfo.opentype.tables) {
        const gsub = fontInfo.opentype.tables.GSUB;
        if (gsub) {
          this.processGsubTable(gsub, features);
        }
      }

      let opentype = null;
      Object.keys(fontInfo).forEach(key => {
        if (typeof fontInfo[key] === 'object' && fontInfo[key] !== null) {
          if (fontInfo[key].features || fontInfo[key].GSUB) {
            opentype = fontInfo[key];
          }
        }
      });

      if (opentype) {
        if (opentype.features) {
          this.processFeatures(opentype.features, features);
        }
        if (opentype.GSUB) {
          this.processGsubTable(opentype.GSUB, features);
        }
      }

    } catch (error) {
      console.error('Error extracting OpenType features:', error);
    }

    this.availableFeatures = features;
    return features;
  }

  processFeatures(features, featureSet) {
    if (Array.isArray(features)) {
      features.forEach(feature => {
        if (typeof feature === 'string') {
          if (feature === 'smcp' || feature.startsWith('ss')) {
            featureSet.add(feature);
          }
        } else if (feature.tag) {
          if (feature.tag === 'smcp' || feature.tag.startsWith('ss')) {
            featureSet.add(feature.tag);
          }
        }
      });
    } else if (typeof features === 'object') {
      Object.keys(features).forEach(feature => {
        if (feature === 'smcp' || feature.startsWith('ss')) {
          featureSet.add(feature);
        }
      });
    }
  }

  processGsubTable(gsub, featureSet) {
    if (gsub.features) {
      this.processFeatures(gsub.features, featureSet);
    }

    if (gsub.lookups) {
      gsub.lookups.forEach(lookup => {
        if (lookup.features) {
          this.processFeatures(lookup.features, featureSet);
        }
      });
    }
  }

  createButtons() {
    if (!this.buttonsContainer) return;

    const existingButtons = this.buttonsContainer.querySelectorAll('.feature-button');
    existingButtons.forEach(button => button.remove());

    const backgroundToggle = this.buttonsContainer.querySelector('#background-toggle');
    if (!backgroundToggle) return;

    this.availableFeatures.forEach(feature => {
      const button = document.createElement('button');
      button.className = 'feature-button';
      this.updateButtonText(button, feature);

      button.addEventListener('click', () => {
        this.toggleFeature(feature, button);
      });

      backgroundToggle.insertAdjacentElement('afterend', button);
    });
  }

  updateButtonText(button, feature) {
    const isEnabled = this.activeFeatures.has(feature);
    const displayName = feature.toUpperCase();
    button.textContent = isEnabled ? `Disable ${displayName}` : `Enable ${displayName}`;
  }

  toggleFeature(feature, button) {
    if (this.activeFeatures.has(feature)) {
      this.activeFeatures.delete(feature);
    } else {
      this.activeFeatures.add(feature);
    }

    this.updateButtonText(button, feature);
    const featureString = this.getFeatureString();

    // Call the callback with the new feature string
    if (this.onFeaturesChanged) {
      this.onFeaturesChanged(featureString);
    }

    return featureString;
  }

  getFeatureString() {
    if (this.activeFeatures.size === 0) {
      return 'normal';
    }
    return Array.from(this.activeFeatures)
      .map(feature => `"${feature}" 1`)
      .join(', ');
  }

  clear() {
    this.activeFeatures.clear();
    this.availableFeatures.clear();
  }
}

export { OpenTypeFeatures };