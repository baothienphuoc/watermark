/**
 * ImageProcessor - Handles image upload, validation and processing
 */

import { SUPPORTED_FORMATS, FILE_EXTENSIONS, ERROR_MESSAGES } from '../config/constants.js';

export class ImageProcessor {
  constructor() {
    this.supportedTypes = new Set(SUPPORTED_FORMATS);
  }

  /**
   * Validate if file is a supported image type
   */
  validateImageFile(file) {
    if (!file) {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    // Check MIME type
    if (!this.supportedTypes.has(file.type)) {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    // Check file extension as fallback
    const extension = this.getFileExtension(file.name);
    if (!FILE_EXTENSIONS.includes(extension)) {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    return true;
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename) {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
  }

  /**
   * Create object URL for file
   */
  createImageUrl(file) {
    this.validateImageFile(file);
    return URL.createObjectURL(file);
  }

  /**
   * Process multiple files and create image objects
   */
  async processFiles(files) {
    const images = [];
    const errors = [];

    for (const file of files) {
      try {
        this.validateImageFile(file);
        const url = this.createImageUrl(file);
        
        images.push({
          file,
          filename: file.name,
          url,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
      } catch (error) {
        errors.push({
          filename: file.name,
          error: error.message
        });
      }
    }

    return { images, errors };
  }

  /**
   * Handle drag and drop files
   */
  processDragDropFiles(dataTransfer) {
    const files = [];

    if (dataTransfer.items) {
      // Use DataTransferItemList interface
      for (let i = 0; i < dataTransfer.items.length; i++) {
        if (dataTransfer.items[i].type.indexOf('image') !== -1) {
          files.push(dataTransfer.items[i].getAsFile());
        }
      }
    } else {
      // Use DataTransfer interface
      for (let i = 0; i < dataTransfer.files.length; i++) {
        files.push(dataTransfer.files[i]);
      }
    }

    return this.processFiles(files);
  }

  /**
   * Handle clipboard paste
   */
  async processClipboardData(clipboardData) {
    if (!clipboardData) {
      return { images: [], errors: [] };
    }

    const items = clipboardData.items;
    if (!items) {
      return { images: [], errors: [] };
    }

    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          // Generate filename for pasted image
          const timestamp = Date.now();
          const randomId = Math.floor(Math.random() * 1000);
          const filename = `pasted-image-${timestamp}-${randomId}.jpg`;
          
          // Create File object from blob
          const file = new File([blob], filename, { type: blob.type });
          files.push(file);
        }
      }
    }

    return this.processFiles(files);
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Calculate image brightness (for adaptive watermarking)
   */
  async calculateImageBrightness(imageUrl, startX = 0, startY = 0, width = null, height = null) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const sampleWidth = width || img.width;
        const sampleHeight = height || img.height;
        
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        
        ctx.drawImage(img, -startX, -startY);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let colorSum = 0;
          for (let x = 0; x < data.length; x += 4) {
            const r = data[x];
            const g = data[x + 1];
            const b = data[x + 2];
            const avg = Math.floor((r + g + b) / 3);
            colorSum += avg;
          }
          
          const brightness = Math.floor(colorSum / (canvas.width * canvas.height));
          canvas.remove();
          resolve(brightness);
        } catch (error) {
          canvas.remove();
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for brightness calculation'));
      img.src = imageUrl;
    });
  }

  /**
   * Cleanup object URLs to prevent memory leaks
   */
  cleanup(images) {
    images.forEach(image => {
      if (image.url) {
        URL.revokeObjectURL(image.url);
      }
    });
  }
}
