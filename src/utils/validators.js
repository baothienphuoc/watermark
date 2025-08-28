/**
 * Validation utilities
 */

import { SUPPORTED_FORMATS, FILE_EXTENSIONS } from '../config/constants.js';

/**
 * Validate image file
 */
export function validateImageFile(file) {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file type: ${file.type}. Supported types: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!FILE_EXTENSIONS.includes(extension)) {
    errors.push(`Unsupported file extension: ${extension}. Supported extensions: ${FILE_EXTENSIONS.join(', ')}`);
  }

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push(`File size too large: ${formatFileSize(file.size)}. Maximum size: ${formatFileSize(maxSize)}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate brand configuration
 */
export function validateBrandConfig(config) {
  const errors = [];

  if (!config) {
    errors.push('Brand configuration is required');
    return { isValid: false, errors };
  }

  // Required fields
  const requiredFields = ['id', 'name', 'watermarkLogic', 'watermarkTypes'];
  requiredFields.forEach(field => {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate watermark types
  if (config.watermarkTypes && Array.isArray(config.watermarkTypes)) {
    config.watermarkTypes.forEach((type, index) => {
      if (!type.text || !type.value) {
        errors.push(`Watermark type at index ${index} missing required fields (text, value)`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate watermark options
 */
export function validateWatermarkOptions(options = {}) {
  const errors = [];

  // Validate opacity
  if (options.opacity !== undefined) {
    if (typeof options.opacity !== 'number' || options.opacity < 0 || options.opacity > 1) {
      errors.push('Opacity must be a number between 0 and 1');
    }
  }

  // Validate position
  if (options.position !== undefined) {
    const validPositions = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'];
    if (!validPositions.includes(options.position)) {
      errors.push(`Invalid position: ${options.position}. Valid positions: ${validPositions.join(', ')}`);
    }
  }

  // Validate size
  if (options.size !== undefined) {
    if (typeof options.size !== 'number' || options.size <= 0) {
      errors.push('Size must be a positive number');
    }
  }

  // Validate rotation
  if (options.rotation !== undefined) {
    if (typeof options.rotation !== 'number') {
      errors.push('Rotation must be a number (degrees)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize filename for download
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }

  // Remove invalid characters for file systems
  const sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid chars with underscore
    .replace(/\s+/g, '_')           // Replace spaces with underscore
    .replace(/_{2,}/g, '_')         // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '');       // Remove leading/trailing underscores

  // Ensure not empty
  return sanitized || 'untitled';
}

/**
 * Validate URL
 */
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Validate hex color
 */
export function isValidHexColor(color) {
  if (!color || typeof color !== 'string') {
    return false;
  }
  
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate RGB color
 */
export function isValidRgbColor(color) {
  if (!color || typeof color !== 'string') {
    return false;
  }
  
  return /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(color);
}

/**
 * Validate RGBA color
 */
export function isValidRgbaColor(color) {
  if (!color || typeof color !== 'string') {
    return false;
  }
  
  return /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(0|1|0?\.\d+)\)$/.test(color);
}

/**
 * Validate any CSS color format
 */
export function isValidColor(color) {
  return isValidHexColor(color) || isValidRgbColor(color) || isValidRgbaColor(color);
}

/**
 * Check if browser supports required features
 */
export function checkBrowserSupport() {
  const support = {
    canvas: !!document.createElement('canvas').getContext,
    fileApi: !!(window.File && window.FileReader && window.FileList && window.Blob),
    dragDrop: 'draggable' in document.createElement('div'),
    fileSystemAccess: 'showDirectoryPicker' in window,
    clipboardApi: !!navigator.clipboard
  };

  const unsupported = Object.entries(support)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  return {
    supported: support,
    isFullySupported: unsupported.length === 0,
    unsupportedFeatures: unsupported
  };
}
