/**
 * Image utility functions
 */

/**
 * Detect if image is portrait or landscape
 */
export function isPortrait(width, height) {
  return width < height;
}

/**
 * Calculate scale ratio to fit target size
 */
export function calculateScaleRatio(currentSize, minSize, maxSize) {
  if (currentSize < minSize) {
    return minSize / currentSize;
  }
  if (currentSize > maxSize) {
    return maxSize / currentSize;
  }
  return 1;
}

/**
 * Get optimal canvas dimensions
 */
export function getCanvasDimensions(originalWidth, originalHeight, minSize = 600, maxSize = 2000) {
  const isHeightOriented = isPortrait(originalWidth, originalHeight);
  const baseSize = isHeightOriented ? originalWidth : originalHeight;
  const scaleRatio = calculateScaleRatio(baseSize, minSize, maxSize);
  
  return {
    width: originalWidth * scaleRatio,
    height: originalHeight * scaleRatio,
    scaleRatio,
    isHeightOriented,
    baseSize: baseSize * scaleRatio
  };
}

/**
 * Calculate position for watermark element
 */
export function calculateWatermarkPosition(canvasWidth, canvasHeight, elementWidth, elementHeight, position = 'center') {
  const positions = {
    'center': {
      x: (canvasWidth - elementWidth) / 2,
      y: (canvasHeight - elementHeight) / 2
    },
    'top-left': {
      x: 0,
      y: 0
    },
    'top-right': {
      x: canvasWidth - elementWidth,
      y: 0
    },
    'bottom-left': {
      x: 0,
      y: canvasHeight - elementHeight
    },
    'bottom-right': {
      x: canvasWidth - elementWidth,
      y: canvasHeight - elementHeight
    },
    'top-center': {
      x: (canvasWidth - elementWidth) / 2,
      y: 0
    },
    'bottom-center': {
      x: (canvasWidth - elementWidth) / 2,
      y: canvasHeight - elementHeight
    }
  };
  
  return positions[position] || positions.center;
}

/**
 * Scale element size proportionally
 */
export function scaleElement(originalWidth, originalHeight, targetWidth, targetHeight = null) {
  if (targetHeight === null) {
    // Scale proportionally based on width
    const ratio = targetWidth / originalWidth;
    return {
      width: targetWidth,
      height: originalHeight * ratio,
      ratio
    };
  }
  
  // Scale to fit both dimensions
  const widthRatio = targetWidth / originalWidth;
  const heightRatio = targetHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);
  
  return {
    width: originalWidth * ratio,
    height: originalHeight * ratio,
    ratio
  };
}

/**
 * Apply opacity to canvas context
 */
export function setContextOpacity(context, opacity = 1) {
  context.globalAlpha = Math.max(0, Math.min(1, opacity));
}

/**
 * Create rounded rectangle path
 */
export function createRoundedRectPath(context, x, y, width, height, radius = 5) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

/**
 * Draw image with rounded corners
 */
export function drawRoundedImage(context, image, x, y, width, height, radius = 5) {
  context.save();
  createRoundedRectPath(context, x, y, width, height, radius);
  context.clip();
  context.drawImage(image, x, y, width, height);
  context.restore();
}

/**
 * Convert canvas to different formats
 */
export function canvasToBlob(canvas, format = 'image/jpeg', quality = 0.9) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, format, quality);
  });
}

/**
 * Get image data URL
 */
export function canvasToDataURL(canvas, format = 'image/jpeg', quality = 0.9) {
  return canvas.toDataURL(format, quality);
}

/**
 * Estimate file size from canvas
 */
export function estimateFileSize(canvas, format = 'image/jpeg', quality = 0.9) {
  const dataUrl = canvasToDataURL(canvas, format, quality);
  // Base64 overhead is ~33%, so actual size is roughly 75% of data URL length
  return Math.round(dataUrl.length * 0.75);
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
