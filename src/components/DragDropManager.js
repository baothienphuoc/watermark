/**
 * DragDropManager - Enhanced drag and drop functionality
 */

export class DragDropManager {
  constructor(app, dropZone) {
    this.app = app;
    this.dropZone = dropZone;
    this.isDragging = false;
    this.dragCounter = 0;
    this.supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    this.init();
  }

  init() {
    this.createDropIndicator();
    this.bindEvents();
    this.setupPasteHandler();
  }

  createDropIndicator() {
    this.dropIndicator = document.createElement('div');
    this.dropIndicator.className = 'drop-indicator';
    this.dropIndicator.innerHTML = `
      <div class="drop-content">
        <div class="drop-icon">
          <i class="icon-upload"></i>
        </div>
        <div class="drop-text">
          <h3>Thả ảnh vào đây</h3>
          <p>Hỗ trợ JPG, PNG, GIF, WebP</p>
          <div class="drop-hint">
            Hoặc <strong>Ctrl+V</strong> để dán từ clipboard
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    if (!document.querySelector('#dragdrop-styles')) {
      const styles = document.createElement('style');
      styles.id = 'dragdrop-styles';
      styles.textContent = `
        .drop-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(var(--primary-rgb), 0.1);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
          animation: drop-fade-in 0.2s ease;
        }
        
        .drop-indicator.active {
          display: flex;
        }
        
        .drop-content {
          background: var(--surface-color);
          border: 3px dashed var(--primary-color);
          border-radius: var(--border-radius-lg);
          padding: 3rem;
          text-align: center;
          max-width: 400px;
          box-shadow: var(--shadow-lg);
          animation: drop-bounce 0.3s ease;
        }
        
        .drop-icon {
          font-size: 4rem;
          color: var(--primary-color);
          margin-bottom: 1rem;
          animation: drop-pulse 1.5s ease-in-out infinite;
        }
        
        .drop-text h3 {
          color: var(--text-color);
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }
        
        .drop-text p {
          color: var(--text-muted);
          margin: 0 0 1rem 0;
        }
        
        .drop-hint {
          font-size: 0.9rem;
          color: var(--text-muted);
          opacity: 0.8;
        }
        
        .drop-hint strong {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
        }
        
        @keyframes drop-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes drop-bounce {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          50% { transform: scale(1.05) translateY(-5px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        
        @keyframes drop-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .drop-zone {
          position: relative;
          transition: var(--transition-normal);
        }
        
        .drop-zone.drag-over {
          transform: scale(1.02);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.3);
          border-radius: var(--border-radius);
        }
        
        .drop-zone.drag-active {
          background: rgba(var(--primary-rgb), 0.05);
        }
        
        .file-preview {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--surface-color);
          border-radius: var(--border-radius);
          padding: 1rem;
          box-shadow: var(--shadow-lg);
          z-index: 10000;
          max-width: 300px;
          display: none;
        }
        
        .file-preview.show {
          display: block;
          animation: preview-appear 0.3s ease;
        }
        
        .file-preview img {
          max-width: 100%;
          border-radius: var(--border-radius);
          margin-bottom: 0.5rem;
        }
        
        .file-preview .file-info {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        
        @keyframes preview-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .paste-hint {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 1rem;
          box-shadow: var(--shadow-md);
          z-index: 9999;
          opacity: 0;
          transform: translateY(20px);
          transition: var(--transition-normal);
          max-width: 280px;
        }
        
        .paste-hint.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .paste-hint-icon {
          font-size: 1.5rem;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }
        
        .paste-hint-text {
          color: var(--text-color);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        
        .paste-hint-shortcut {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary-color);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(this.dropIndicator);
  }

  bindEvents() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, this.preventDefaults.bind(this), false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      document.addEventListener(eventName, this.handleDragEnter.bind(this), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, this.handleDragLeave.bind(this), false);
    });

    // Handle dropped files
    document.addEventListener('drop', this.handleDrop.bind(this), false);
    
    // Handle drop zone specific events
    if (this.dropZone) {
      this.dropZone.addEventListener('dragenter', this.handleZoneDragEnter.bind(this));
      this.dropZone.addEventListener('dragleave', this.handleZoneDragLeave.bind(this));
      this.dropZone.addEventListener('dragover', this.handleZoneDragOver.bind(this));
      this.dropZone.addEventListener('drop', this.handleZoneDrop.bind(this));
    }
  }

  setupPasteHandler() {
    document.addEventListener('paste', (e) => {
      // Only handle paste when not in input fields
      if (this.isTypingInInput(e.target)) {
        return;
      }
      
      this.handlePaste(e);
    });
    
    // Show paste hint periodically
    this.showPasteHint();
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDragEnter(e) {
    this.dragCounter++;
    
    if (this.hasValidFiles(e.dataTransfer)) {
      this.showDropIndicator();
      this.isDragging = true;
    }
  }

  handleDragLeave(e) {
    this.dragCounter--;
    
    if (this.dragCounter === 0) {
      this.hideDropIndicator();
      this.isDragging = false;
    }
  }

  handleDrop(e) {
    this.dragCounter = 0;
    this.hideDropIndicator();
    this.isDragging = false;
    
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }

  handleZoneDragEnter(e) {
    this.dropZone.classList.add('drag-active');
  }

  handleZoneDragLeave(e) {
    // Only remove if we're really leaving the zone
    if (!this.dropZone.contains(e.relatedTarget)) {
      this.dropZone.classList.remove('drag-active', 'drag-over');
    }
  }

  handleZoneDragOver(e) {
    this.dropZone.classList.add('drag-over');
  }

  handleZoneDrop(e) {
    this.dropZone.classList.remove('drag-active', 'drag-over');
  }

  hasValidFiles(dataTransfer) {
    if (!dataTransfer.types) return false;
    
    return dataTransfer.types.includes('Files') || 
           dataTransfer.types.includes('application/x-moz-file');
  }

  showDropIndicator() {
    this.dropIndicator.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hideDropIndicator() {
    this.dropIndicator.classList.remove('active');
    document.body.style.overflow = '';
  }

  async processFiles(files) {
    const validFiles = files.filter(file => this.isValidImageFile(file));
    
    if (validFiles.length === 0) {
      this.showError('Không có file ảnh hợp lệ. Chỉ hỗ trợ JPG, PNG, GIF, WebP.');
      return;
    }

    if (validFiles.length !== files.length) {
      this.showWarning(`Chỉ xử lý ${validFiles.length}/${files.length} file hợp lệ.`);
    }

    // Show preview for first file
    if (validFiles.length > 0) {
      this.showFilePreview(validFiles[0]);
    }

    // Process files
    for (const file of validFiles) {
      try {
        await this.app.processUploadedFile(file);
      } catch (error) {
        console.error('Error processing file:', error);
        this.showError(`Lỗi xử lý file ${file.name}: ${error.message}`);
      }
    }
  }

  isValidImageFile(file) {
    return this.supportedTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
  }

  showFilePreview(file) {
    const preview = document.createElement('div');
    preview.className = 'file-preview show';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <div class="file-info">
          <strong>${file.name}</strong><br>
          ${this.formatFileSize(file.size)}
        </div>
      `;
    };
    reader.readAsDataURL(file);
    
    document.body.appendChild(preview);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      preview.classList.remove('show');
      setTimeout(() => {
        if (preview.parentNode) {
          preview.remove();
        }
      }, 300);
    }, 3000);
  }

  async handlePaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    
    if (!clipboardData) return;
    
    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length === 0) {
      this.showHint('Clipboard không chứa ảnh nào');
      return;
    }
    
    e.preventDefault();
    
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        const renamedFile = new File([file], `pasted-image-${Date.now()}.png`, {
          type: file.type
        });
        
        this.showFilePreview(renamedFile);
        
        try {
          await this.app.processUploadedFile(renamedFile);
          this.showSuccess('Đã dán ảnh từ clipboard');
        } catch (error) {
          console.error('Error processing pasted file:', error);
          this.showError(`Lỗi xử lý ảnh: ${error.message}`);
        }
      }
    }
  }

  showPasteHint() {
    // Show hint after 10 seconds if no images uploaded
    setTimeout(() => {
      if (this.app.images.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'paste-hint';
        hint.innerHTML = `
          <div class="paste-hint-icon">
            <i class="icon-clipboard"></i>
          </div>
          <div class="paste-hint-text">
            💡 Bạn có thể dán ảnh trực tiếp từ clipboard
          </div>
          <div class="paste-hint-shortcut">Ctrl + V</div>
        `;
        
        document.body.appendChild(hint);
        
        // Show hint
        setTimeout(() => hint.classList.add('show'), 100);
        
        // Hide after 5 seconds
        setTimeout(() => {
          hint.classList.remove('show');
          setTimeout(() => {
            if (hint.parentNode) {
              hint.remove();
            }
          }, 300);
        }, 5000);
      }
    }, 10000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  isTypingInInput(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           element.contentEditable === 'true';
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showWarning(message) {
    this.showNotification(message, 'warning');
  }

  showHint(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles if not exist
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          padding: 1rem 1.5rem;
          border-radius: var(--border-radius);
          color: white;
          z-index: 10000;
          max-width: 400px;
          box-shadow: var(--shadow-lg);
          animation: notification-slide-in 0.3s ease;
        }
        
        .notification-success {
          background: var(--success-color, #22c55e);
        }
        
        .notification-error {
          background: var(--error-color, #ef4444);
        }
        
        .notification-warning {
          background: var(--warning-color, #f59e0b);
        }
        
        .notification-info {
          background: var(--info-color, #3b82f6);
        }
        
        @keyframes notification-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'notification-slide-in 0.3s ease reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }

  destroy() {
    // Remove event listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.removeEventListener(eventName, this.preventDefaults.bind(this), false);
    });

    // Remove drop indicator
    if (this.dropIndicator && this.dropIndicator.parentNode) {
      this.dropIndicator.remove();
    }
    
    // Reset drag counter
    this.dragCounter = 0;
    this.isDragging = false;
  }
}
