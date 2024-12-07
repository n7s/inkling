// =============================================================================
// WordCloudLayout.js - Modern implementation of word cloud layout algorithm
// =============================================================================

export class WordCloudLayout {
  constructor(options = {}) {
    // Configuration with defaults
    this.size = options.size || [1, 1];
    this.words = [];
    this.padding = options.padding || 1;
    this.spiral = options.spiral || archimedeanSpiral;
    this.rotate = options.rotate || (() => 0);
    this.fontSize = options.fontSize || (() => 10);
    this.fontFamily = options.fontFamily || (() => "sans-serif");
    this.random = options.random || Math.random;
    this.onLayoutEnd = options.onLayoutEnd || (() => {});

    // Internal state
    this.board = null;
    this.bounds = null;
    this.boxWidth = 0;
    this.boxHeight = 0;
  }

  // Place words on the board
  async start() {
    const words = this.words;
    const size = this.size;

    // Initialize board with size scaled by √2 to ensure rotation space
    this.boxWidth = ~~(size[0] * (1 + 1/Math.sqrt(2)));
    this.boxHeight = ~~(size[1] * (1 + 1/Math.sqrt(2)));
    this.board = new Int32Array(this.boxWidth * this.boxHeight);
    this.bounds = [{x: size[0], y: size[1]}, {x: 0, y: 0}];

    // Sort words by fontSize for better packing
    words.sort((a, b) => this.fontSize(b) - this.fontSize(a));

    // Place each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      await this.placeWord(word);
    }

    // Normalize positions relative to bounds
    const dx = this.bounds[0].x;
    const dy = this.bounds[0].y;
    words.forEach(word => {
      if (word.hasPosition) {
        word.x -= dx;
        word.y -= dy;
      }
    });

    // Callback with placed words
    this.onLayoutEnd(words.filter(w => w.hasPosition));
  }

  async placeWord(word) {
    const fontSize = this.fontSize(word);
    const fontFamily = this.fontFamily(word);
    const rotation = this.rotate(word);
    const rad = rotation * Math.PI / 180;

    // Get word dimensions using existing measurement system
    const metrics = await this.measureText(word.text, fontSize, fontFamily);
    const width = metrics.width;
    const height = metrics.height;

    // Calculate rotated bounds
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const wcor = Math.abs(width * cos) + Math.abs(height * sin);
    const hcor = Math.abs(width * sin) + Math.abs(height * cos);

    // Try to place the word using spiral
    const spiral = this.spiral(this.boxWidth, this.boxHeight);
    let xy;
    let attempts = 0;

    while (!(xy = spiral(attempts)) || this.collides(xy, word, wcor, hcor)) {
      if (++attempts > 10000) {
        word.hasPosition = false;
        return;
      }
    }

    // Word placed successfully
    word.x = xy.x;
    word.y = xy.y;
    word.rotate = rotation;
    word.hasPosition = true;

    // Update bounds and board
    this.updateBounds(word, wcor, hcor);
    this.updateBoard(word, wcor, hcor);
  }

  // Check if word collides with any placed words
  collides(xy, word, wcor, hcor) {
    const padding = this.padding(word);
    const x = xy.x - wcor/2;
    const y = xy.y - hcor/2;

    // Check board positions
    const xMin = ~~(x - padding);
    const yMin = ~~(y - padding);
    const xMax = ~~(x + wcor + padding);
    const yMax = ~~(y + hcor + padding);

    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        if (x >= 0 && x < this.boxWidth &&
            y >= 0 && y < this.boxHeight &&
            this.board[y * this.boxWidth + x]) {
          return true;
        }
      }
    }
    return false;
  }

  // Update placement board
  updateBoard(word, wcor, hcor) {
    const padding = this.padding(word);
    const x = word.x - wcor/2;
    const y = word.y - hcor/2;

    const xMin = ~~(x - padding);
    const yMin = ~~(y - padding);
    const xMax = ~~(x + wcor + padding);
    const yMax = ~~(y + hcor + padding);

    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        if (x >= 0 && x < this.boxWidth && y >= 0 && y < this.boxHeight) {
          this.board[y * this.boxWidth + x] = 1;
        }
      }
    }
  }

  // Update bounding box
  updateBounds(word, wcor, hcor) {
    const padding = this.padding(word);
    const x = word.x - wcor/2;
    const y = word.y - hcor/2;

    this.bounds[0].x = Math.min(this.bounds[0].x, x - padding);
    this.bounds[0].y = Math.min(this.bounds[0].y, y - padding);
    this.bounds[1].x = Math.max(this.bounds[1].x, x + wcor + padding);
    this.bounds[1].y = Math.max(this.bounds[1].y, y + hcor + padding);
  }

  // Text measurement adapter using existing system
  async measureText(text, fontSize, fontFamily) {
    // This should be connected to the existing WordMeasurement class
    return {
      width: fontSize * text.length * 0.6, // Temporary approximation
      height: fontSize * 1.3
    };
  }
}

// Spiral generator functions
function archimedeanSpiral(width, height) {
  const e = width / height;
  return function(t) {
    const angle = 2 * t;
    const radius = angle / 5;
    return {
      x: (width / 2) + (radius * Math.cos(angle) * e),
      y: (height / 2) + (radius * Math.sin(angle))
    };
  };
}

function rectangularSpiral(width, height) {
  let dx = 0;
  let dy = 0;
  let x = 0;
  let y = 0;
  return function(t) {
    const sign = t < 0 ? -1 : 1;
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:  x += dx; break;
      case 1:  y += dy; break;
      case 2:  x += dx = -sign; dy = 0; break;
      default: y += dy = -sign; dx = 0; break;
    }
    return {x: x, y: y};
  };
}