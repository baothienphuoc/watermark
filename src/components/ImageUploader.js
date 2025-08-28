/**
 * ImageUploader - Component for handling file uploads
 */

import { UI_STRINGS } from '../config/constants.js';

export class ImageUploader {
  constructor(container, onFilesSelected, app = null) {
    this.container = container;
    this.onFilesSelected = onFilesSelected;
    this.app = app;
    
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="image-uploader">
        <div class="upload-button-wrapper">
          <button class="upload-button btn btn-primary" type="button">
            <i class="icon-upload"></i>
            ${UI_STRINGS.UPLOAD_BUTTON}
          </button>
          <input 
            type="file" 
            id="file-input" 
            class="file-input" 
            accept=".jpeg,.jpg,.png,.webp,.gif" 
            multiple 
            style="display: none"
          />
        </div>
        
        <div class="upload-methods">
          <div class="method-item">
            <i class="icon-upload"></i>
            <span>Click để chọn file</span>
          </div>
          <div class="method-item">
            <i class="icon-drag-drop"></i>
            <span>Kéo thả file vào đây</span>
          </div>
          <div class="method-item">
            <i class="icon-paste"></i>
            <span>Paste từ clipboard (Ctrl+V)</span>
          </div>
        </div>
        
        <div class="supported-formats">
          <small>Hỗ trợ: JPG, PNG, WebP, GIF</small>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const uploadButton = this.container.querySelector('.upload-button');
    const fileInput = this.container.querySelector('#file-input');

    // Upload button click
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFiles(Array.from(e.target.files));
        // Reset input to allow same file selection
        e.target.value = '';
      }
    });

    // Drag and drop on the uploader area
    this.setupDragDrop();

    // Clipboard paste
    this.setupClipboardPaste();
  }

  setupDragDrop() {
    const uploaderArea = this.container;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploaderArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    uploaderArea.addEventListener('dragenter', () => {
      uploaderArea.classList.add('drag-over');
    });

    uploaderArea.addEventListener('dragover', () => {
      uploaderArea.classList.add('drag-over');
    });

    uploaderArea.addEventListener('dragleave', (e) => {
      // Only remove highlight if we're leaving the uploader area completely
      if (!uploaderArea.contains(e.relatedTarget)) {
        uploaderArea.classList.remove('drag-over');
      }
    });

    uploaderArea.addEventListener('drop', (e) => {
      uploaderArea.classList.remove('drag-over');
      
      const files = [];
      
      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].type.indexOf('image') !== -1) {
            files.push(e.dataTransfer.items[i].getAsFile());
          }
        }
      } else {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }

      if (files.length > 0) {
        this.handleFiles(files);
      }
    });
  }

  setupClipboardPaste() {
    // Listen for paste events on the document
    document.addEventListener('paste', (e) => {
      // Only handle paste if the uploader is visible and no input is focused
      if (!this.isVisible() || this.isInputFocused()) {
        return;
      }

      const clipboardData = e.clipboardData || e.originalEvent.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            // Create a File object with a generated name
            const timestamp = Date.now();
            const randomId = Math.floor(Math.random() * 1000);
            const filename = `pasted-image-${timestamp}-${randomId}.png`;
            const file = new File([blob], filename, { type: blob.type });
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        this.handleFiles(files);
        this.showPasteIndicator();
      }
    });
  }

  handleFiles(files) {
    if (files.length === 0) return;

    // Filter for image files only
    const imageFiles = files.filter(file => {
      return file.type.startsWith('image/');
    });

    if (imageFiles.length === 0) {
      this.showError('Không có file hình ảnh hợp lệ được chọn');
      return;
    }

    if (imageFiles.length !== files.length) {
      this.showWarning(`${files.length - imageFiles.length} file không phải hình ảnh đã bị bỏ qua`);
    }

    // Call the callback with valid image files
    this.onFilesSelected(imageFiles);
    
    this.showUploadSuccess(imageFiles.length);
  }

  isVisible() {
    return this.container.offsetParent !== null;
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.contentEditable === 'true'
    );
  }

  showPasteIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'paste-indicator';
    indicator.innerHTML = `
      <i class="icon-paste"></i>
      <span>Đã paste từ clipboard</span>
    `;
    
    this.container.appendChild(indicator);
    
    setTimeout(() => {
      indicator.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      indicator.classList.remove('show');
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 2000);
  }

  showUploadSuccess(count) {
    const success = document.createElement('div');
    success.className = 'upload-success';
    success.innerHTML = `
      <i class="icon-check"></i>
      <span>Đã upload ${count} ảnh</span>
    `;
    
    this.container.appendChild(success);
    
    setTimeout(() => {
      success.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      success.classList.remove('show');
      setTimeout(() => {
        if (success.parentNode) {
          success.parentNode.removeChild(success);
        }
      }, 300);
    }, 2000);
  }

  showError(message) {
    // Use app's toast system if available, otherwise fallback to local error
    if (this.app && this.app.showError) {
      this.app.showError(message);
      return;
    }
    
    const error = document.createElement('div');
    error.className = 'upload-error';
    error.innerHTML = `
      <i class="icon-error"></i>
      <span>${message}</span>
    `;
    
    this.container.appendChild(error);
    
    setTimeout(() => {
      error.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      error.classList.remove('show');
      setTimeout(() => {
        if (error.parentNode) {
          error.parentNode.removeChild(error);
        }
      }, 300);
    }, 3000);
  }

  showWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'upload-warning';
    warning.innerHTML = `
      <i class="icon-warning"></i>
      <span>${message}</span>
    `;
    
    this.container.appendChild(warning);
    
    setTimeout(() => {
      warning.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      warning.classList.remove('show');
      setTimeout(() => {
        if (warning.parentNode) {
          warning.parentNode.removeChild(warning);
        }
      }, 300);
    }, 3000);
  }

  reset() {
    const fileInput = this.container.querySelector('#file-input');
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.container.classList.remove('drag-over');
  }

  triggerUpload() {
    const fileInput = this.container.querySelector('#file-input');
    if (fileInput) {
      fileInput.click();
    }
  }
}
