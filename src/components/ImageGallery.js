/**
 * ImageGallery - Component for displaying and managing processed images
 */

import { formatFileSize } from '../utils/validators.js';

export class ImageGallery {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onImageSelect: options.onImageSelect || (() => {}),
      onImageDelete: options.onImageDelete || (() => {}),
      onImagePreview: options.onImagePreview || (() => {}),
      enableFancybox: options.enableFancybox !== false
    };
    
    this.images = new Map();
    this.selectedImages = new Set();
    
    this.render();
    this.setupEventListeners();
    this.initializeFancybox();
  }

  render() {
    this.container.innerHTML = `
      <div class="image-gallery-container">
        <div class="gallery-grid" id="gallery-grid">
          <!-- Images will be dynamically added here -->
        </div>
        
        <div class="gallery-empty" id="gallery-empty">
          <div class="empty-content">
            <i class="icon-image-placeholder"></i>
            <h3>Chưa có ảnh nào</h3>
            <p>Upload hoặc thả ảnh vào đây để bắt đầu</p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const galleryGrid = this.container.querySelector('#gallery-grid');
    
    // Event delegation for image interactions
    galleryGrid.addEventListener('click', (e) => {
      const imageBlock = e.target.closest('.image-block');
      if (!imageBlock) return;
      
      const imageId = imageBlock.dataset.imageId;
      
      if (e.target.closest('.delete-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.deleteImage(imageId);
      } else if (e.target.closest('.zoom-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Always try to preview, fallback if fancybox fails
        if (this.options.enableFancybox && typeof $ !== 'undefined' && $.fancybox) {
          // Let fancybox handle it (don't prevent default for <a> tags)
          const zoomBtn = e.target.closest('.zoom-btn');
          if (zoomBtn.tagName === 'A') {
            return; // Let the link work naturally
          }
        }
        
        // Fallback to custom preview
        this.previewImage(imageId);
      } else {
        // Toggle selection when clicking on image
        this.toggleImageSelection(imageId);
      }
    });

    // Double click to preview
    galleryGrid.addEventListener('dblclick', (e) => {
      const imageBlock = e.target.closest('.image-block');
      if (imageBlock) {
        const imageId = imageBlock.dataset.imageId;
        this.previewImage(imageId);
      }
    });
  }

  addImage(imageData) {
    this.images.set(imageData.id, imageData);
    
    const galleryGrid = this.container.querySelector('#gallery-grid');
    const imageElement = this.createImageElement(imageData);
    
    galleryGrid.appendChild(imageElement);
    
    // Hide empty state
    this.updateEmptyState();
    
    // Reinitialize fancybox for new images
    this.initializeFancybox();
    
    // Add animation
    setTimeout(() => {
      imageElement.classList.add('image-loaded');
    }, 50);
  }

  createImageElement(imageData) {
    const imageBlock = document.createElement('div');
    imageBlock.className = 'image-block';
    imageBlock.dataset.imageId = imageData.id;
    
    if (imageData.selected) {
      imageBlock.classList.add('selected');
    }

    // Get file size info
    const originalSize = imageData.original.file ? imageData.original.file.size : 0;
    const processedSize = imageData.processed.blob ? imageData.processed.blob.size : 0;

    imageBlock.innerHTML = `
      <div class="image-container">
        <img 
          class="image-item" 
          src="${imageData.processed.url}" 
          alt="${imageData.original.filename}"
          loading="lazy"
        />
        
        <div class="image-overlay">
          <div class="image-actions">
            ${this.options.enableFancybox ? `
            <a 
              class="action-btn zoom-btn" 
              href="${imageData.processed.url}" 
              data-fancybox="gallery"
              data-caption="${imageData.original.filename}"
              title="Phóng to"
            >
              <i class="icon-zoom-in"></i>
            </a>
            ` : `
            <button class="action-btn zoom-btn" title="Phóng to">
              <i class="icon-zoom-in"></i>
            </button>
            `}
            <button class="action-btn delete-btn" title="Xóa">
              <i class="icon-trash"></i>
            </button>
          </div>
          
          <div class="selection-indicator">
            <i class="icon-check"></i>
          </div>
        </div>
        
        ${this.options.enableFancybox ? '' : ''}
      </div>
      
      <div class="image-info">
        <div class="image-filename" title="${imageData.original.filename}">
          ${this.truncateFilename(imageData.original.filename)}
        </div>
        <div class="image-meta">
          <span class="file-size">${formatFileSize(processedSize)}</span>
          <span class="mark-type">${this.getMarkTypeLabel(imageData.markType)}</span>
        </div>
      </div>
    `;

    return imageBlock;
  }

  updateImage(imageData) {
    const existingElement = this.container.querySelector(`[data-image-id="${imageData.id}"]`);
    if (existingElement) {
      // Update the image source
      const img = existingElement.querySelector('.image-item');
      const zoomLink = existingElement.querySelector('.zoom-btn');
      
      if (img) {
        img.src = imageData.processed.url;
      }
      
      if (zoomLink && zoomLink.tagName === 'A') {
        zoomLink.href = imageData.processed.url;
      }

      // Update file size
      const sizeElement = existingElement.querySelector('.file-size');
      if (sizeElement && imageData.processed.blob) {
        sizeElement.textContent = formatFileSize(imageData.processed.blob.size);
      }

      // Update mark type
      const markTypeElement = existingElement.querySelector('.mark-type');
      if (markTypeElement) {
        markTypeElement.textContent = this.getMarkTypeLabel(imageData.markType);
      }

      // Update stored data
      this.images.set(imageData.id, imageData);
    }
  }

  removeImage(imageId) {
    const imageElement = this.container.querySelector(`[data-image-id="${imageId}"]`);
    if (imageElement) {
      imageElement.classList.add('image-removing');
      
      setTimeout(() => {
        if (imageElement.parentNode) {
          imageElement.parentNode.removeChild(imageElement);
        }
        
        this.images.delete(imageId);
        this.selectedImages.delete(imageId);
        this.updateEmptyState();
      }, 300);
    }
  }

  toggleImageSelection(imageId) {
    const imageData = this.images.get(imageId);
    if (!imageData) return;

    const isSelected = this.selectedImages.has(imageId);
    const newSelected = !isSelected;

    if (newSelected) {
      this.selectedImages.add(imageId);
    } else {
      this.selectedImages.delete(imageId);
    }

    // Update visual state
    const imageElement = this.container.querySelector(`[data-image-id="${imageId}"]`);
    if (imageElement) {
      imageElement.classList.toggle('selected', newSelected);
    }

    // Update data
    imageData.selected = newSelected;

    // Notify parent
    this.options.onImageSelect(imageId, newSelected);
  }

  updateSelections(selectedImageIds) {
    this.selectedImages = new Set(selectedImageIds);
    
    // Update visual state for all images
    this.images.forEach((imageData, imageId) => {
      const isSelected = this.selectedImages.has(imageId);
      const imageElement = this.container.querySelector(`[data-image-id="${imageId}"]`);
      
      if (imageElement) {
        imageElement.classList.toggle('selected', isSelected);
      }
      
      imageData.selected = isSelected;
    });
  }

  deleteImage(imageId) {
    if (confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      this.removeImage(imageId);
      this.options.onImageDelete(imageId);
    }
  }

  previewImage(imageId) {
    const imageData = this.images.get(imageId);
    if (imageData) {
      this.options.onImagePreview(imageData);
    }
  }

  updateEmptyState() {
    const galleryEmpty = this.container.querySelector('#gallery-empty');
    const galleryGrid = this.container.querySelector('#gallery-grid');
    
    const hasImages = this.images.size > 0;
    
    galleryEmpty.style.display = hasImages ? 'none' : 'flex';
    galleryGrid.style.display = hasImages ? 'grid' : 'none';
  }

  truncateFilename(filename, maxLength = 30) {
    if (filename.length <= maxLength) {
      return filename;
    }
    
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.slice(0, -(extension.length + 1));
    const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4) + '...';
    
    return `${truncatedName}.${extension}`;
  }

  getMarkTypeLabel(markType) {
    // This could be enhanced to show more descriptive labels
    if (!markType || markType === 'default' || markType === '0') {
      return 'Mặc định';
    }
    
    if (markType.match(/^\d+$/)) {
      return markType; // Phone number
    }
    
    return markType;
  }

  initializeFancybox() {
    if (this.options.enableFancybox && typeof $ !== 'undefined' && $.fancybox) {
      // Reinitialize fancybox for dynamically added content
      $(document).off('click.fb-start', '[data-fancybox="gallery"]');
      
      $('[data-fancybox="gallery"]').fancybox({
        thumbs: {
          autoStart: true
        },
        buttons: [
          'zoom',
          'fullScreen',
          'thumbs',
          'close'
        ],
        animationEffect: 'zoom-in-out',
        transitionEffect: 'slide',
        toolbar: true,
        infobar: true
      });
    }
  }

  clear() {
    this.images.clear();
    this.selectedImages.clear();
    
    const galleryGrid = this.container.querySelector('#gallery-grid');
    galleryGrid.innerHTML = '';
    
    this.updateEmptyState();
  }

  updateSelection(selectedIds) {
    this.selectedImages.clear();
    selectedIds.forEach(id => this.selectedImages.add(id));
    
    // Update UI
    const galleryGrid = this.container.querySelector('#gallery-grid');
    galleryGrid.querySelectorAll('.image-item').forEach(item => {
      const imageId = item.dataset.imageId;
      const checkbox = item.querySelector('.image-checkbox');
      const isSelected = this.selectedImages.has(imageId);
      
      item.classList.toggle('selected', isSelected);
      if (checkbox) {
        checkbox.checked = isSelected;
      }
    });
  }

  refresh() {
    // Re-render all images
    const galleryGrid = this.container.querySelector('#gallery-grid');
    const currentImages = Array.from(this.images.values());
    
    galleryGrid.innerHTML = '';
    
    currentImages.forEach(image => {
      const imageElement = this.createImageElement(image);
      galleryGrid.appendChild(imageElement);
    });
    
    this.updateEmptyState();
  }

  getSelectedImages() {
    return Array.from(this.selectedImages).map(id => this.images.get(id)).filter(Boolean);
  }

  getImageCount() {
    return this.images.size;
  }

  getSelectedCount() {
    return this.selectedImages.size;
  }
}
