/**
 * WatermarkApp - Main application component
 */

import { BrandSelector } from './BrandSelector.js';
import { ImageUploader } from './ImageUploader.js';
import { ImageGallery } from './ImageGallery.js';
import { KeyboardManager } from './KeyboardManager.js';
import { DragDropManager } from './DragDropManager.js';
import { WatermarkService } from '../services/WatermarkService.js';
import { ImageProcessor } from '../services/ImageProcessor.js';
import { DownloadService } from '../services/DownloadService.js';
import { getBrandConfig } from '../config/brands.js';
import { UI_STRINGS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';

export class WatermarkApp {
  constructor(container, initialBrand = 'AT247') {
    this.container = container;
    this.currentBrand = initialBrand;
    this.brandConfig = getBrandConfig(initialBrand);
    
    // Services
    this.watermarkService = new WatermarkService(initialBrand);
    this.imageProcessor = new ImageProcessor();
    this.downloadService = new DownloadService();
    
    // State
    this.images = [];
    this.selectedImages = new Set();
    this.currentMarkType = this.getDefaultMarkType();
    this.isProcessing = false;
    
    // Components
    this.components = {};
    
    this.init();
  }

  async init() {
    try {
      this.render();
      this.setupComponents();
      this.setupEventListeners();
      
      // Preload watermark resources
      await this.watermarkService.preloadResources();
      
      console.log(`✅ ${this.brandConfig.name} initialized`);
    } catch (error) {
      console.error('Failed to initialize WatermarkApp:', error);
      this.showError(ERROR_MESSAGES.PROCESSING_FAILED);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="watermark-app">
        <header class="app-header">
          <h1 class="app-title">Watermark Tools - Multi Brand</h1>
        </header>
        
        <main class="app-main">
          <div class="upload-section">
            <div class="upload-controls">
              <div class="upload-area" aria-label="Vùng tải ảnh lên"></div>
              <div class="watermark-options">
                <div class="brand-selector-container"></div>
                <div class="mark-type-selector">
                  <label for="mark-type-select">Chọn loại watermark:</label>
                  <select id="mark-type-select" class="form-select" 
                          data-tooltip="Chọn loại watermark phù hợp với ảnh của bạn"
                          aria-describedby="mark-type-help">
                    ${this.renderMarkTypeOptions()}
                  </select>
                </div>
                ${this.renderBrandSpecificOptions()}
              </div>
            </div>
            
            <div class="upload-help" role="region" aria-labelledby="help-title">
              <h3 id="help-title" class="visually-hidden">Hướng dẫn sử dụng</h3>
              <p>${UI_STRINGS.DROP_ZONE_TEXT}</p>
              <p class="help-text">${UI_STRINGS.DROP_ZONE_HELP}</p>
              ${this.renderBrandSpecificHelp()}
            </div>
          </div>
          
          <div class="gallery-section">
            <div class="gallery-controls" role="toolbar" aria-label="Điều khiển thư viện ảnh">
              <button id="select-all-btn" class="btn btn-secondary"
                      data-tooltip="Chọn tất cả ảnh (Ctrl+A)"
                      aria-keyshortcuts="Ctrl+A">
                <i class="bi bi-check-square"></i>
                ${UI_STRINGS.SELECT_ALL}
              </button>
              <button id="download-btn" class="btn btn-primary" style="display: none"
                      data-tooltip="Tải xuống ảnh đã chọn (Ctrl+S)"
                      aria-keyshortcuts="Ctrl+S">
                <i class="bi bi-download"></i>
                ${UI_STRINGS.DOWNLOAD}
              </button>
              <div class="selection-info" aria-live="polite">
                <span id="selection-count">0 ảnh được chọn</span>
              </div>
            </div>
            
            <div class="image-gallery" role="grid" aria-label="Thư viện ảnh đã xử lý"></div>
          </div>
        </main>
        
        <div class="loading-overlay" style="display: none">
          <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-text">Đang xử lý...</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        </div>
        
        <div class="drop-zone-overlay" style="display: none">
          <div class="drop-zone-content">
            <h2>${UI_STRINGS.DROP_ANYWHERE}</h2>
            <p>Thả file vào đây để upload</p>
          </div>
        </div>
      </div>
    `;
    
    // Store reference for button onclick
    this.container.querySelector('.watermark-app').__watermarkApp = this;
  }

  setupComponents() {
    // Brand Selector
    this.components.brandSelector = new BrandSelector(
      this.container.querySelector('.brand-selector-container'),
      (brandId) => this.switchBrand(brandId),
      this.currentBrand
    );

    // Image Uploader
    this.components.imageUploader = new ImageUploader(
      this.container.querySelector('.upload-area'),
      (files) => this.handleFilesSelected(files),
      this  // Pass app reference for toast errors
    );

    // Image Gallery
    this.components.imageGallery = new ImageGallery(
      this.container.querySelector('.image-gallery'),
      {
        onImageSelect: (imageId, selected) => this.handleImageSelection(imageId, selected),
        onImageDelete: (imageId) => this.handleImageDelete(imageId),
        onImagePreview: (imageData) => this.handleImagePreview(imageData)
      }
    );

    // Keyboard Manager
    this.components.keyboardManager = new KeyboardManager(this);

    // Drag Drop Manager
    this.components.dragDropManager = new DragDropManager(
      this,
      this.container.querySelector('.upload-area')
    );
  }

  setupEventListeners() {
    // Mark type selector
    const markTypeSelect = this.container.querySelector('#mark-type-select');
    markTypeSelect.addEventListener('change', (e) => {
      this.currentMarkType = e.target.value;
      this.reprocessSelectedImages();
    });

    // Select all button
    const selectAllBtn = this.container.querySelector('#select-all-btn');
    selectAllBtn.addEventListener('click', () => this.toggleSelectAll());

    // Download button
    const downloadBtn = this.container.querySelector('#download-btn');
    downloadBtn.addEventListener('click', () => this.downloadSelectedImages());


    // Brand-specific event listeners
    this.setupBrandSpecificListeners();

    // Global drag and drop
    this.setupGlobalDragDrop();
  }

  renderMarkTypeOptions() {
    return this.brandConfig.watermarkTypes
      .map(type => 
        `<option value="${type.value}" ${type.default ? 'selected' : ''}>${type.text}</option>`
      ).join('');
  }

  renderBrandSpecificOptions() {
    if (this.brandConfig.features?.logoLeftToggle) {
      return `
        <div class="logo-toggle">
          <label>
            <input type="checkbox" id="logo-left-toggle" checked>
            Chèn logo góc trái
          </label>
        </div>
      `;
    }
    return '';
  }

  renderBrandSpecificHelp() {
    if (this.currentBrand === 'DPCS') {
      return `
      `;
    }
    return '';
  }

  setupBrandSpecificListeners() {
    if (this.brandConfig.features?.logoLeftToggle) {
      const logoToggle = this.container.querySelector('#logo-left-toggle');
      if (logoToggle) {
        logoToggle.addEventListener('change', () => {
          this.reprocessSelectedImages();
        });
      }
    }
  }

  setupGlobalDragDrop() {
    const dropOverlay = this.container.querySelector('.drop-zone-overlay');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Show/hide drop overlay
    document.addEventListener('dragenter', () => {
      dropOverlay.style.display = 'flex';
    });

    document.addEventListener('dragleave', (e) => {
      if (e.pageX === 0 && e.pageY === 0) {
        dropOverlay.style.display = 'none';
      }
    });

    document.addEventListener('drop', (e) => {
      dropOverlay.style.display = 'none';
      this.handleDrop(e);
    });
  }

  async switchBrand(brandId) {
    if (brandId === this.currentBrand) return;

    try {
      this.showLoading('Đang chuyển thương hiệu...');
      
      // Cleanup current state
      this.cleanup();
      
      // Update brand
      this.currentBrand = brandId;
      this.brandConfig = getBrandConfig(brandId);
      this.watermarkService = new WatermarkService(brandId);
      this.currentMarkType = this.getDefaultMarkType();
      
      // Re-render and reinitialize
      this.render();
      this.setupComponents();
      this.setupEventListeners();
      
      // Preload new resources
      await this.watermarkService.preloadResources();
      
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('brand', brandId.toLowerCase());
      window.history.pushState({}, '', url);
      
      this.hideLoading();
      this.showSuccess(`Đã chuyển sang ${this.brandConfig.displayName}`);
      
    } catch (error) {
      console.error('Failed to switch brand:', error);
      this.hideLoading();
      this.showError('Không thể chuyển thương hiệu. Vui lòng thử lại.');
    }
  }

  async handleFilesSelected(files) {
    if (this.isProcessing) return;

    try {
      // Remove loading overlay to prevent flicker
      // this.showLoading('Đang xử lý ảnh...');
      
      const { images, errors } = await this.imageProcessor.processFiles(files);
      
      if (errors.length > 0) {
        console.warn('Some files failed to process:', errors);
        this.showWarning(`${errors.length} file không thể xử lý`);
      }

      if (images.length > 0) {
        await this.processAndAddImages(images);
        this.showSuccess(`Đã thêm ${images.length} ảnh`);
      }

    } catch (error) {
      console.error('Failed to handle files:', error);
      this.showError(ERROR_MESSAGES.PROCESSING_FAILED);
    } finally {
      // this.hideLoading();
    }
  }

  async handleDrop(event) {
    const { images, errors } = await this.imageProcessor.processDragDropFiles(event.dataTransfer);
    
    if (images.length > 0) {
      await this.handleFilesSelected(images.map(img => img.file));
    }
  }

  async processAndAddImages(images) {
    const options = this.getBrandSpecificOptions();
    
    const results = await this.watermarkService.batchProcess(
      images,
      this.currentMarkType,
      options,
      (progress, current, total) => {
        this.updateProgress(progress, `Xử lý ảnh ${current}/${total}`);
      }
    );

    // Add processed images to gallery
    results.forEach((result, index) => {
      if (!result.error) {
        const imageData = {
          id: this.generateImageId(),
          original: result.original,
          processed: result.processed,
          selected: false,
          markType: this.currentMarkType
        };
        
        this.images.push(imageData);
        this.components.imageGallery.addImage(imageData);
      }
    });

    this.updateSelectionUI();
  }

  async reprocessSelectedImages() {
    if (this.selectedImages.size === 0 || this.isProcessing) return;

    try {
      this.showLoading('Đang áp dụng watermark mới...');
      
      const selectedImageData = this.images.filter(img => this.selectedImages.has(img.id));
      const options = this.getBrandSpecificOptions();
      
      for (const imageData of selectedImageData) {
        const canvas = await this.watermarkService.applyWatermark(
          imageData.original.url,
          this.currentMarkType,
          options
        );
        
        const blob = await this.watermarkService.canvasToBlob(canvas);
        const url = URL.createObjectURL(blob);
        
        // Cleanup old processed image
        if (imageData.processed.url) {
          URL.revokeObjectURL(imageData.processed.url);
        }
        
        // Update processed image
        imageData.processed = {
          canvas,
          blob,
          url,
          filename: imageData.processed.filename
        };
        imageData.markType = this.currentMarkType;
        
        // Update gallery
        this.components.imageGallery.updateImage(imageData);
        
        canvas.remove();
      }
      
      this.showSuccess('Đã cập nhật watermark');
    } catch (error) {
      console.error('Failed to reprocess images:', error);
      this.showError('Không thể cập nhật watermark');
    } finally {
      this.hideLoading();
    }
  }

  handleImageSelection(imageId, selected) {
    if (selected) {
      this.selectedImages.add(imageId);
    } else {
      this.selectedImages.delete(imageId);
    }
    
    // Update image data
    const image = this.images.find(img => img.id === imageId);
    if (image) {
      image.selected = selected;
    }
    
    this.updateSelectionUI();
  }

  handleImageDelete(imageId) {
    const imageIndex = this.images.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      const image = this.images[imageIndex];
      
      // Cleanup URLs
      if (image.original.url) URL.revokeObjectURL(image.original.url);
      if (image.processed.url) URL.revokeObjectURL(image.processed.url);
      
      // Remove from arrays
      this.images.splice(imageIndex, 1);
      this.selectedImages.delete(imageId);
      
      this.updateSelectionUI();
    }
  }

  handleImagePreview(imageData) {
    // Create a simple preview modal
    this.showImagePreviewModal(imageData);
  }

  showImagePreviewModal(imageData) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.image-preview-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>${imageData.original.filename}</h3>
            <button class="close-btn" onclick="this.closest('.image-preview-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <img src="${imageData.processed.url}" alt="${imageData.original.filename}" />
          </div>
          <div class="modal-footer">
            <span class="image-info">Size: ${this.formatFileSize(imageData.processed.blob?.size || 0)} | Type: ${this.getMarkTypeLabel(imageData.markType)}</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add styles if not exist
    if (!document.querySelector('#image-preview-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'image-preview-modal-styles';
      styles.textContent = `
        .image-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
        }
        
        .image-preview-modal .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .image-preview-modal .modal-content {
          background: var(--surface-color, white);
          border-radius: 8px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
        }
        
        .image-preview-modal .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color, #e5e5e5);
          background: var(--background-color, #f8f9fa);
        }
        
        .image-preview-modal .modal-header h3 {
          margin: 0;
          color: var(--text-color, #333);
          font-size: 1.1rem;
          word-break: break-word;
        }
        
        .image-preview-modal .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted, #666);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .image-preview-modal .close-btn:hover {
          background: var(--hover-color, #f5f5f5);
        }
        
        .image-preview-modal .modal-body {
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          overflow: hidden;
        }
        
        .image-preview-modal .modal-body img {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          display: block;
        }
        
        .image-preview-modal .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color, #e5e5e5);
          background: var(--background-color, #f8f9fa);
          text-align: center;
        }
        
        .image-preview-modal .image-info {
          color: var(--text-muted, #666);
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .image-preview-modal .modal-overlay {
            padding: 1rem;
          }
          
          .image-preview-modal .modal-body img {
            max-height: 60vh;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMarkTypeLabel(markType) {
    if (!markType || markType === 'default' || markType === '0') {
      return 'Mặc định';
    }
    
    if (markType.match(/^\d+$/)) {
      return markType; // Phone number
    }
    
    return markType;
  }

  toggleSelectAll() {
    const selectAllBtn = this.container.querySelector('#select-all-btn');
    const isSelectAll = selectAllBtn.textContent === UI_STRINGS.SELECT_ALL;
    
    if (isSelectAll) {
      // Select all
      this.images.forEach(image => {
        image.selected = true;
        this.selectedImages.add(image.id);
      });
      selectAllBtn.textContent = UI_STRINGS.DESELECT_ALL;
    } else {
      // Deselect all
      this.images.forEach(image => {
        image.selected = false;
      });
      this.selectedImages.clear();
      selectAllBtn.textContent = UI_STRINGS.SELECT_ALL;
    }
    
    this.components.imageGallery.updateSelections(this.selectedImages);
    this.updateSelectionUI();
  }

  async downloadSelectedImages() {
    if (this.selectedImages.size === 0) {
      this.showError(ERROR_MESSAGES.NO_IMAGES_SELECTED);
      return;
    }

    try {
      // Only show loading for very long operations
      const selectedImageData = this.images.filter(img => this.selectedImages.has(img.id));
      
      // Prefer File System Access API for multiple images
      const options = {
        forceZip: false, // Let the service decide the best method
        zipFilename: `${this.brandConfig.displayName}-watermarked-images.zip`
      };
      
      const result = await this.downloadService.downloadImages(selectedImageData, options);
      
      if (result.success) {
        this.showSuccess(result.message);
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      this.showError(error.message || ERROR_MESSAGES.DOWNLOAD_FAILED);
    }
  }

  getBrandSpecificOptions() {
    const options = {};
    
    if (this.brandConfig.features?.logoLeftToggle) {
      const logoToggle = this.container.querySelector('#logo-left-toggle');
      options.insertLogoLeft = logoToggle ? logoToggle.checked : true;
    }
    
    return options;
  }

  getDefaultMarkType() {
    const defaultType = this.brandConfig.watermarkTypes.find(type => type.default);
    return defaultType ? defaultType.value : this.brandConfig.watermarkTypes[0].value;
  }

  updateSelectionUI() {
    const count = this.selectedImages.size;
    const selectionCount = this.container.querySelector('#selection-count');
    const downloadBtn = this.container.querySelector('#download-btn');
    const selectAllBtn = this.container.querySelector('#select-all-btn');
    
    selectionCount.textContent = `${count} ảnh được chọn`;
    downloadBtn.style.display = count > 0 ? 'inline-block' : 'none';
    
    if (count === 0) {
      selectAllBtn.textContent = UI_STRINGS.SELECT_ALL;
    } else if (count === this.images.length) {
      selectAllBtn.textContent = UI_STRINGS.DESELECT_ALL;
    } else {
      selectAllBtn.textContent = UI_STRINGS.SELECT_ALL;
    }
  }

  generateImageId() {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showLoading(text = 'Đang xử lý...') {
    this.isProcessing = true;
    // Show as toast instead of overlay to not block user interaction
    this.showLoadingToast(text);
  }

  hideLoading() {
    this.isProcessing = false;
    this.hideLoadingToast();
  }

  showLoadingToast(text) {
    // Remove existing loading toast
    const existingToast = document.querySelector('.loading-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'loading-toast';
    toast.innerHTML = `
      <div class="loading-content">
        <div class="spinner-mini"></div>
        <span class="loading-text">${text}</span>
      </div>
    `;

    // Add styles if not exist
    if (!document.querySelector('#loading-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'loading-toast-styles';
      styles.textContent = `
        .loading-toast {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 1rem 1.5rem;
          box-shadow: var(--shadow-lg);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 200px;
          animation: toast-slide-in 0.3s ease;
        }
        
        .loading-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .spinner-mini {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-color);
          border-top: 2px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-text {
          color: var(--text-color);
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        @keyframes toast-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(toast);
    this.currentLoadingToast = toast;
  }

  hideLoadingToast() {
    if (this.currentLoadingToast) {
      this.currentLoadingToast.style.animation = 'toast-slide-in 0.3s ease reverse';
      setTimeout(() => {
        if (this.currentLoadingToast && this.currentLoadingToast.parentNode) {
          this.currentLoadingToast.remove();
        }
        this.currentLoadingToast = null;
      }, 300);
    }
  }

  updateProgress(progress, text = null) {
    // Update progress in loading toast if exists
    if (this.currentLoadingToast) {
      const loadingText = this.currentLoadingToast.querySelector('.loading-text');
      if (loadingText && text) {
        loadingText.textContent = text;
      }
      
      // Add progress bar to toast if progress > 0
      if (progress > 0) {
        let progressBar = this.currentLoadingToast.querySelector('.toast-progress');
        if (!progressBar) {
          progressBar = document.createElement('div');
          progressBar.className = 'toast-progress';
          progressBar.innerHTML = '<div class="toast-progress-fill"></div>';
          
          // Add progress bar styles
          if (!document.querySelector('#toast-progress-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-progress-styles';
            styles.textContent = `
              .toast-progress {
                width: 100%;
                height: 3px;
                background: var(--border-color);
                border-radius: 2px;
                overflow: hidden;
                margin-top: 0.5rem;
              }
              
              .toast-progress-fill {
                height: 100%;
                background: var(--primary-color);
                transition: width 0.3s ease;
                width: 0%;
              }
            `;
            document.head.appendChild(styles);
          }
          
          this.currentLoadingToast.querySelector('.loading-content').appendChild(progressBar);
        }
        
        const progressFill = progressBar.querySelector('.toast-progress-fill');
        progressFill.style.width = `${progress * 100}%`;
      }
    }
    
    // Fallback: update legacy progress bar if exists
    const progressFill = this.container.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progress * 100}%`;
    }
    
    const loadingText = this.container.querySelector('.loading-text');
    if (loadingText && text) {
      loadingText.textContent = text;
    }
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showWarning(message) {
    this.showToast(message, 'warning');
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Handle multiline messages
    if (message.includes('\n')) {
      const lines = message.split('\n');
      toast.innerHTML = lines.map(line => 
        line.startsWith('⌨️') ? `<strong>${line}</strong>` : line
      ).join('<br>');
    } else {
      toast.textContent = message;
    }
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  cleanup() {
    // Cleanup object URLs
    this.images.forEach(image => {
      if (image.original.url) URL.revokeObjectURL(image.original.url);
      if (image.processed.url) URL.revokeObjectURL(image.processed.url);
    });
    
    // Cleanup components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    // Cleanup loading toast
    this.hideLoadingToast();
    
    // Reset state
    this.images = [];
    this.selectedImages.clear();
  }

  // Keyboard shortcut helper methods
  triggerFileUpload() {
    if (this.components.imageUploader) {
      this.components.imageUploader.triggerUpload();
    }
  }

  selectAll() {
    this.images.forEach(image => {
      this.selectedImages.add(image.id);
    });
    this.updateSelectionUI();
    this.components.imageGallery.updateSelection(Array.from(this.selectedImages));
  }

  deselectAll() {
    this.selectedImages.clear();
    this.updateSelectionUI();
    this.components.imageGallery.updateSelection([]);
  }

  deleteSelectedImages() {
    if (this.selectedImages.size === 0) {
      this.showInfo('Không có ảnh nào được chọn để xóa');
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa ${this.selectedImages.size} ảnh đã chọn?`)) {
      Array.from(this.selectedImages).forEach(imageId => {
        this.handleImageDelete(imageId);
      });
    }
  }



  refreshGallery() {
    if (this.components.imageGallery) {
      this.components.imageGallery.refresh();
    }
  }

  // Drag drop helper methods
  async processUploadedFile(file) {
    return this.handleFilesSelected([file]);
  }

  async handlePastedFile(file) {
    return this.processUploadedFile(file);
  }

  // Utility methods
  showInfo(message) {
    this.showToast(message, 'info');
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showWarning(message) {
    this.showToast(message, 'warning');
  }

  showSimpleKeyboardModal() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.simple-keyboard-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const shortcuts = [
      'Ctrl+O - Mở file',
      'Ctrl+V - Dán từ clipboard', 
      'Ctrl+S - Lưu ảnh đã chọn',
      'Ctrl+A - Chọn tất cả',
      'Escape - Bỏ chọn tất cả',
      'Delete - Xóa ảnh đã chọn',
      'F1 - Hiển thị trợ giúp',
      'F5 - Làm mới',
      'F11 - Toàn màn hình',
      '1-4 - Chuyển thương hiệu'
    ];

    const modal = document.createElement('div');
    modal.className = 'simple-keyboard-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>⌨️ Phím tắt</h3>
            <button class="close-btn" onclick="this.closest('.simple-keyboard-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="shortcuts-list">
              ${shortcuts.map(shortcut => `<div class="shortcut-item">${shortcut}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add styles if not exist
    if (!document.querySelector('#simple-keyboard-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'simple-keyboard-modal-styles';
      styles.textContent = `
        .simple-keyboard-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
        }
        
        .simple-keyboard-modal .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .simple-keyboard-modal .modal-content {
          background: var(--surface-color, white);
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .simple-keyboard-modal .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color, #e5e5e5);
        }
        
        .simple-keyboard-modal .modal-header h3 {
          margin: 0;
          color: var(--text-color, #333);
        }
        
        .simple-keyboard-modal .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted, #666);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .simple-keyboard-modal .close-btn:hover {
          background: var(--hover-color, #f5f5f5);
        }
        
        .simple-keyboard-modal .modal-body {
          padding: 1.5rem;
        }
        
        .simple-keyboard-modal .shortcut-item {
          padding: 0.5rem 0;
          color: var(--text-color, #333);
          font-family: monospace;
        }
      `;
      document.head.appendChild(styles);
    }
  }
}
