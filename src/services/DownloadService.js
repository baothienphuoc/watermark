/**
 * DownloadService - Handles different download methods
 */

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';

export class DownloadService {
  constructor() {
    this.supportsFileSystemAccess = 'showDirectoryPicker' in window;
    this.supportsDownload = 'download' in document.createElement('a');
  }

  /**
   * Download single image
   */
  async downloadImage(blob, filename) {
    if (this.supportsDownload) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
    
    throw new Error(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
  }

  /**
   * Download multiple images using File System Access API (modern browsers)
   */
  async downloadImagesModern(images) {
    if (!this.supportsFileSystemAccess) {
      throw new Error('File System Access API không được hỗ trợ trong trình duyệt này');
    }

    try {
      // Show directory picker
      const directoryHandle = await window.showDirectoryPicker({
        id: 'watermark-download',
        mode: 'readwrite'
      });
      
      let successCount = 0;
      const totalImages = images.length;
      
      for (const image of images) {
        if (image.error) continue;
        
        const { blob, filename } = image.processed;
        
        try {
          // Create file in selected directory
          const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          successCount++;
        } catch (fileError) {
          console.warn(`Failed to save ${filename}:`, fileError);
          // Continue with other files
        }
      }
      
      if (successCount === 0) {
        throw new Error('Không thể lưu file nào');
      }
      
      return { 
        success: true, 
        message: `Đã lưu ${successCount}/${totalImages} ảnh vào thư mục đã chọn` 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Hủy chọn thư mục' };
      }
      throw new Error(`Lỗi khi lưu file: ${error.message}`);
    }
  }

  /**
   * Download multiple images as ZIP (fallback for older browsers)
   */
  async downloadImagesAsZip(images, zipFilename = 'watermarked-images.zip') {
    // Dynamic import for JSZip (assuming it's available globally)
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();
    const processedImages = images.filter(img => !img.error);
    
    if (processedImages.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_IMAGES_SELECTED);
    }

    // Add images to ZIP
    for (const image of processedImages) {
      const { blob, filename } = image.processed;
      zip.file(filename, blob);
    }

    try {
      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP
      await this.downloadImage(zipBlob, zipFilename);
      
      return { success: true, message: SUCCESS_MESSAGES.DOWNLOAD_SUCCESS };
    } catch (error) {
      throw new Error(ERROR_MESSAGES.DOWNLOAD_FAILED);
    }
  }

  /**
   * Smart download - chooses best method based on browser support and number of files
   */
  async downloadImages(images, options = {}) {
    const { forceZip = false, zipFilename = 'watermarked-images.zip' } = options;
    
    const validImages = images.filter(img => !img.error);
    
    if (validImages.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_IMAGES_SELECTED);
    }

    // Single image - direct download (unless forced ZIP)
    if (validImages.length === 1 && !forceZip) {
      const { blob, filename } = validImages[0].processed;
      await this.downloadImage(blob, filename);
      return { success: true, message: 'Đã tải xuống ảnh' };
    }

    // Multiple images - prefer File System Access API
    if (this.supportsFileSystemAccess && !forceZip) {
      try {
        return await this.downloadImagesModern(validImages);
      } catch (error) {
        // If user cancelled or there's an error, don't fallback automatically
        if (error.message.includes('Hủy chọn thư mục')) {
          return { success: false, message: error.message };
        }
        
        console.warn('File System Access API failed:', error);
        
        // Ask user if they want to fallback to ZIP
        const useZip = confirm(
          'Không thể lưu trực tiếp vào thư mục. Bạn có muốn tải xuống dưới dạng file ZIP không?'
        );
        
        if (useZip) {
          return await this.downloadImagesAsZip(validImages, zipFilename);
        } else {
          return { success: false, message: 'Đã hủy tải xuống' };
        }
      }
    } else {
      // Fallback to ZIP for older browsers or when forced
      return await this.downloadImagesAsZip(validImages, zipFilename);
    }
  }

  /**
   * Download with progress tracking
   */
  async downloadWithProgress(images, options = {}, onProgress = null) {
    const { forceZip = false } = options;
    
    if (forceZip || images.length > 1) {
      // For ZIP downloads, progress is handled differently
      return await this.downloadImages(images, options);
    }

    // For individual downloads, we can track each file
    const results = [];
    for (let i = 0; i < images.length; i++) {
      try {
        const { blob, filename } = images[i].processed;
        await this.downloadImage(blob, filename);
        results.push({ success: true, filename });
        
        if (onProgress) {
          onProgress((i + 1) / images.length, i + 1, images.length);
        }
      } catch (error) {
        results.push({ success: false, filename: images[i].processed.filename, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get download capabilities info
   */
  getCapabilities() {
    return {
      fileSystemAccess: this.supportsFileSystemAccess,
      download: this.supportsDownload,
      zip: typeof JSZip !== 'undefined'
    };
  }
}
