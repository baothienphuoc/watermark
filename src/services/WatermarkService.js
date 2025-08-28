/**
 * WatermarkService - Core service for applying watermarks to images
 * Handles different brand-specific watermark logic
 */

import { CANVAS_CONFIG } from '../config/constants.js';
import { getBrandConfig } from '../config/brands.js';

export class WatermarkService {
  constructor(brandId) {
    this.brandConfig = getBrandConfig(brandId);
    this.preloadedImages = new Map();
    this.isResourcesLoaded = false;
  }

  /**
   * Preload all watermark images for the current brand
   */
  async preloadResources() {
    if (this.isResourcesLoaded) return;

    const promises = [];
    
    // Load brand assets
    Object.entries(this.brandConfig.assets || {}).forEach(([key, src]) => {
      promises.push(this.loadImage(src, key));
    });

    // Load watermark type images
    this.brandConfig.watermarkTypes
      .filter(type => type.src)
      .forEach(type => {
        promises.push(this.loadImage(type.src, type.value));
      });

    try {
      await Promise.all(promises);
      this.isResourcesLoaded = true;
      console.log(`✅ Loaded ${promises.length} assets for ${this.brandConfig.name}`);
    } catch (error) {
      console.error('❌ Failed to preload resources:', error);
      throw new Error('Không thể tải assets. Vui lòng thử lại.');
    }
  }

  /**
   * Load a single image and store in cache
   */
  async loadImage(src, key) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }

  /**
   * Apply watermark to an image
   */
  async applyWatermark(imageUrl, markType = null, options = {}) {
    if (!this.isResourcesLoaded) {
      await this.preloadResources();
    }

    const image = await this.loadImageFromUrl(imageUrl);
    const canvas = this.createCanvas(image, options);
    
    // Apply brand-specific watermark logic
    switch (this.brandConfig.watermarkLogic) {
      case 'AT247':
        this.applyAT247Watermark(canvas, image, markType);
        break;
      case 'DPCS':
        this.applyDPCSWatermark(canvas, image, markType, options);
        break;
      case 'TT':
        this.applyTTWatermark(canvas, image, markType);
        break;
      case 'DPSG':
        this.applyDPSGWatermark(canvas, image, markType);
        break;
      default:
        throw new Error(`Unsupported brand: ${this.brandConfig.watermarkLogic}`);
    }

    return canvas;
  }

  /**
   * Load image from URL
   */
  async loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Create canvas with proper dimensions and scaling
   */
  createCanvas(image, options = {}) {
    const isHeightOriented = image.width < image.height;
    const baseSize = isHeightOriented ? image.width : image.height;
    const scaleRatio = baseSize < CANVAS_CONFIG.minSize 
      ? CANVAS_CONFIG.minSize / baseSize 
      : baseSize > CANVAS_CONFIG.maxSize 
        ? CANVAS_CONFIG.maxSize / baseSize 
        : 1;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = image.width * scaleRatio;
    canvas.height = image.height * scaleRatio;
    
    // Draw original image
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Store metadata for watermark positioning
    canvas.metadata = {
      isHeightOriented,
      baseSize,
      scaleRatio,
      fixSize: scaleRatio * baseSize,
      frameRatio: isHeightOriented ? image.height / image.width : 1,
      originalWidth: image.width,
      originalHeight: image.height
    };

    return canvas;
  }

  /**
   * AT247 specific watermark logic
   */
  applyAT247Watermark(canvas, image, markType) {
    const ctx = canvas.getContext('2d');
    const { fixSize } = canvas.metadata;
    
    const watermarkConfig = this.brandConfig.watermarkTypes.find(t => t.value === markType);
    
    if (!watermarkConfig?.src) {
      // Default watermark - center and corner logos
      const logoCenter = this.preloadedImages.get('logoCenter');
      const logoCorner = this.preloadedImages.get('logoCorner');
      
      if (logoCenter) {
        ctx.drawImage(
          logoCenter,
          canvas.width * 0.37 - fixSize * 0.20,
          canvas.height * 0.4 - logoCenter.height / logoCenter.width * fixSize * 0.19,
          fixSize * 0.38,
          logoCenter.height / logoCenter.width * fixSize * 0.38
        );
      }
      
      if (logoCorner) {
        const wmscaleRatio = canvas.metadata.frameRatio;
        ctx.drawImage(
          logoCorner,
          canvas.width - fixSize * wmscaleRatio * 0.13,
          canvas.height - fixSize * wmscaleRatio * 0.13 * logoCorner.height / logoCorner.width,
          fixSize * wmscaleRatio * 0.13,
          fixSize * wmscaleRatio * 0.13 * logoCorner.height / logoCorner.width
        );
      }
    } else {
      // Specific phone number watermark
      const watermarkImg = this.preloadedImages.get(markType);
      if (watermarkImg) {
        ctx.drawImage(
          watermarkImg,
          (canvas.width - fixSize) / 2,
          (canvas.height - fixSize) / 2,
          fixSize,
          fixSize
        );
      }
    }
  }

  /**
   * DPCS specific watermark logic
   */
  applyDPCSWatermark(canvas, image, markType, options = {}) {
    const ctx = canvas.getContext('2d');
    const { isHeightOriented, fixSize, frameRatio } = canvas.metadata;
    const { insertLogoLeft = true } = options;

    // Logo corner (optional)
    if (insertLogoLeft) {
      const logoCorner = this.preloadedImages.get('logoCorner');
      if (logoCorner) {
        const ratio = isHeightOriented ? 1 : canvas.height / canvas.width;
        ctx.drawImage(
          logoCorner,
          0.11 * canvas.width * 0.19 * ratio,
          canvas.width * 0.19 * logoCorner.height / logoCorner.width * ratio * 0.1,
          canvas.width * 0.19 * ratio,
          canvas.width * 0.19 * logoCorner.height / logoCorner.width * ratio
        );
      }
    }

    // Center logo
    const logoCenter = this.preloadedImages.get('logoCenter');
    if (logoCenter) {
      ctx.drawImage(
        logoCenter,
        canvas.width - canvas.width / 2 - fixSize / 2,
        canvas.height - canvas.height / 2.27,
        fixSize,
        logoCenter.height / logoCenter.width * fixSize
      );
    }

    // Phone number watermark
    if (markType && markType !== 'nophone') {
      const watermarkImg = this.preloadedImages.get(markType);
      if (watermarkImg) {
        if (isHeightOriented) {
          ctx.drawImage(
            watermarkImg,
            canvas.width - canvas.width * 0.35,
            canvas.height - canvas.width * 0.37 * watermarkImg.height / watermarkImg.width,
            canvas.width * 0.33,
            canvas.width * 0.33 * watermarkImg.height / watermarkImg.width
          );
        } else {
          const ratiohw = canvas.height / canvas.width;
          ctx.drawImage(
            watermarkImg,
            canvas.width - canvas.width * 0.36 * ratiohw,
            canvas.height - canvas.width * 0.38 * watermarkImg.height / watermarkImg.width * ratiohw,
            canvas.width * 0.35 * ratiohw,
            canvas.width * 0.35 * watermarkImg.height / watermarkImg.width * ratiohw
          );
        }
      }
    }
  }

  /**
   * TT specific watermark logic
   */
  applyTTWatermark(canvas, image, markType) {
    const ctx = canvas.getContext('2d');
    const { isHeightOriented, fixSize } = canvas.metadata;
    const ratioHeightWidth = isHeightOriented ? 1 : canvas.height / canvas.width;

    // Phone number watermark
    if (markType && markType !== '0') {
      const watermarkImg = this.preloadedImages.get(markType);
      if (watermarkImg) {
        if (isHeightOriented) {
          ctx.drawImage(
            watermarkImg,
            canvas.width - canvas.width * 0.42 * ratioHeightWidth,
            canvas.height - canvas.height * 0.01 * ratioHeightWidth - canvas.width * 0.38 * watermarkImg.height / watermarkImg.width * ratioHeightWidth,
            canvas.width * 0.38 * ratioHeightWidth,
            canvas.width * 0.38 * watermarkImg.height / watermarkImg.width * ratioHeightWidth
          );
        } else {
          ctx.drawImage(
            watermarkImg,
            canvas.width - canvas.width * 0.39 * ratioHeightWidth,
            canvas.height - canvas.height * 0.02 - canvas.width * 0.35 * watermarkImg.height / watermarkImg.width * ratioHeightWidth,
            canvas.width * 0.35 * ratioHeightWidth,
            canvas.width * 0.35 * watermarkImg.height / watermarkImg.width * ratioHeightWidth
          );
        }
      }
    }

    // Corner logo
    const logoCorner = this.preloadedImages.get('logoCorner');
    if (logoCorner) {
      ctx.drawImage(
        logoCorner,
        0.11 * canvas.width * 0.20 * ratioHeightWidth,
        canvas.width * 0.20 * logoCorner.height / logoCorner.width * ratioHeightWidth * 0.1,
        canvas.width * 0.20 * ratioHeightWidth,
        canvas.width * 0.20 * logoCorner.height / logoCorner.width * ratioHeightWidth
      );
    }

    // Center logo
    const logoCenter = this.preloadedImages.get('logoCenter');
    if (logoCenter) {
      ctx.drawImage(
        logoCenter,
        canvas.width - canvas.width / 2 - fixSize / 2,
        canvas.height - canvas.height / 2.8,
        fixSize,
        logoCenter.height / logoCenter.width * fixSize
      );
    }
  }

  /**
   * DPSG specific watermark logic
   */
  applyDPSGWatermark(canvas, image, markType) {
    if (markType === '200') return; // No watermark

    const ctx = canvas.getContext('2d');
    const { fixSize, frameRatio } = canvas.metadata;

    const logoBottom = this.preloadedImages.get('logoBottom');
    const center = this.preloadedImages.get('center');
    const number = this.preloadedImages.get('number');

    if (markType === '0') {
      // Center watermark
      if (center) {
        if (canvas.width / canvas.height >= 2) {
          ctx.drawImage(
            center,
            canvas.width / 2 - fixSize * 2 / 2,
            canvas.height / 2,
            fixSize * 2,
            center.height * fixSize * 2 / center.width
          );
        } else {
          ctx.drawImage(
            center,
            0,
            canvas.height / 2,
            canvas.width,
            center.height * canvas.width / center.width
          );
        }
      }

      // Bottom logo
      if (logoBottom) {
        ctx.drawImage(
          logoBottom,
          0,
          canvas.height - fixSize * 0.33 * frameRatio * logoBottom.height / logoBottom.width,
          fixSize * 0.33 * frameRatio,
          logoBottom.height / logoBottom.width * fixSize * 0.33 * frameRatio
        );
      }

      // Number
      if (number) {
        ctx.drawImage(
          number,
          canvas.width - fixSize * 0.33 * frameRatio,
          canvas.height - (number.height / number.width * fixSize * 0.33 * frameRatio) * 1.5,
          fixSize * 0.33 * frameRatio,
          number.height / number.width * fixSize * 0.33 * frameRatio
        );
      }
    }
  }

  /**
   * Convert canvas to blob
   */
  async canvasToBlob(canvas, quality = CANVAS_CONFIG.defaultQuality) {
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }

  /**
   * Batch process multiple images
   */
  async batchProcess(images, markType, options = {}, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const canvas = await this.applyWatermark(images[i].url, markType, options);
        const blob = await this.canvasToBlob(canvas);
        const url = URL.createObjectURL(blob);
        
        results.push({
          original: images[i],
          processed: {
            canvas,
            blob,
            url,
            filename: `marked-${images[i].filename}`
          }
        });

        // Cleanup canvas
        canvas.remove();
        
        // Progress callback
        if (onProgress) {
          onProgress((i + 1) / images.length, i + 1, images.length);
        }
      } catch (error) {
        console.error(`Failed to process ${images[i].filename}:`, error);
        results.push({
          original: images[i],
          error: error.message
        });
      }
    }

    return results;
  }
}
