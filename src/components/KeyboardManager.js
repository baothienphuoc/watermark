/**
 * KeyboardManager - Handles keyboard shortcuts and accessibility
 */

export class KeyboardManager {
  constructor(app) {
    this.app = app;
    this.shortcuts = new Map();
    this.isCtrlPressed = false;
    this.isShiftPressed = false;
    
    this.setupShortcuts();
    this.bindEvents();
  }

  setupShortcuts() {
    // File operations
    this.addShortcut('ctrl+o', () => this.app.triggerFileUpload(), 'Mở file');
    this.addShortcut('ctrl+v', () => this.handlePaste(), 'Dán từ clipboard');
    this.addShortcut('ctrl+s', (e) => { e.preventDefault(); this.app.downloadSelectedImages(); }, 'Lưu ảnh đã chọn');
    
    // Selection operations
    this.addShortcut('ctrl+a', (e) => { e.preventDefault(); this.app.selectAll(); }, 'Chọn tất cả');
    this.addShortcut('escape', () => this.app.deselectAll(), 'Bỏ chọn tất cả');
    this.addShortcut('delete', () => this.app.deleteSelectedImages(), 'Xóa ảnh đã chọn');
    
    // View operations
    this.addShortcut('f11', (e) => { e.preventDefault(); this.toggleFullscreen(); }, 'Toàn màn hình');
    this.addShortcut('f5', (e) => { e.preventDefault(); this.app.refreshGallery(); }, 'Làm mới');
    
    // Brand switching
    this.addShortcut('1', () => this.app.switchBrand('AT247'), 'Chuyển sang AT247');
    this.addShortcut('2', () => this.app.switchBrand('DPCS'), 'Chuyển sang DPCS');
    this.addShortcut('3', () => this.app.switchBrand('TT'), 'Chuyển sang DPTT');
    this.addShortcut('4', () => this.app.switchBrand('DPSG'), 'Chuyển sang DPSG');
    
    // Help
    this.addShortcut('f1', (e) => { e.preventDefault(); this.showKeyboardHelp(); }, 'Hiển thị trợ giúp');
  }

  addShortcut(key, handler, description) {
    this.shortcuts.set(key, { handler, description });
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Prevent browser shortcuts that might interfere
    document.addEventListener('keydown', (e) => {
      // Prevent Ctrl+S (save page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
      }
      
      // Prevent F5 (refresh) in some contexts
      if (e.key === 'F5' && this.app.isProcessing) {
        e.preventDefault();
      }
    });
  }

  handleKeyDown(e) {
    this.isCtrlPressed = e.ctrlKey;
    this.isShiftPressed = e.shiftKey;
    
    // Skip if user is typing in input
    if (this.isTypingInInput(e.target)) {
      return;
    }

    const key = this.getShortcutKey(e);
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut) {
      e.preventDefault();
      shortcut.handler(e);
      
      // Show visual feedback
      this.showShortcutFeedback(key, shortcut.description);
    }
  }

  handleKeyUp(e) {
    this.isCtrlPressed = e.ctrlKey;
    this.isShiftPressed = e.shiftKey;
  }

  getShortcutKey(e) {
    if (!e || !e.key) return '';
    
    const parts = [];
    
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    const key = e.key.toLowerCase();
    parts.push(key);
    
    return parts.join('+');
  }

  isTypingInInput(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           element.contentEditable === 'true';
  }

  async handlePaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
              this.app.handlePastedFile(file);
              return;
            }
          }
        }
      }
      
      // Fallback for older browsers - this will be handled by the paste event
      this.showHint('Sử dụng Ctrl+V trong vùng upload để dán ảnh');
    } catch (error) {
      console.log('Clipboard access not available:', error);
      this.showHint('Sử dụng Ctrl+V trong vùng upload để dán ảnh');
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  showKeyboardHelp() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .map(([key, { description }]) => `<kbd>${key}</kbd> - ${description}`)
      .join('<br>');
    
    const helpModal = document.createElement('div');
    helpModal.className = 'keyboard-help-modal';
    helpModal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>⌨️ Phím tắt</h3>
            <button class="close-btn" onclick="this.closest('.keyboard-help-modal').remove()">
              <i class="icon-close"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="shortcuts-list">
              ${shortcuts}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="this.closest('.keyboard-help-modal').remove()">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // Add modal styles if not exist
    if (!document.querySelector('#keyboard-help-styles')) {
      const styles = document.createElement('style');
      styles.id = 'keyboard-help-styles';
      styles.textContent = `
        .keyboard-help-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
        }
        
        .modal-overlay {
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
        
        .modal-content {
          background: var(--surface-color);
          border-radius: var(--border-radius-lg);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .modal-header h3 {
          margin: 0;
          color: var(--text-color);
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }
        
        .close-btn:hover {
          color: var(--text-color);
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .shortcuts-list {
          line-height: 2;
        }
        
        .shortcuts-list kbd {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
          min-width: 80px;
          text-align: center;
        }
        
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
          text-align: right;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  showShortcutFeedback(key, description) {
    // Remove existing feedback
    const existing = document.querySelector('.shortcut-feedback');
    if (existing) {
      existing.remove();
    }

    const feedback = document.createElement('div');
    feedback.className = 'shortcut-feedback';
    feedback.innerHTML = `
      <kbd>${key}</kbd>
      <span>${description}</span>
    `;

    document.body.appendChild(feedback);

    // Add styles if not exist
    if (!document.querySelector('#shortcut-feedback-styles')) {
      const styles = document.createElement('style');
      styles.id = 'shortcut-feedback-styles';
      styles.textContent = `
        .shortcut-feedback {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 10000;
          animation: shortcut-appear 0.3s ease;
        }
        
        .shortcut-feedback kbd {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
        }
        
        @keyframes shortcut-appear {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Auto remove after 2 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.style.animation = 'shortcut-appear 0.3s ease reverse';
        setTimeout(() => feedback.remove(), 300);
      }
    }, 2000);
  }

  showHint(message, duration = 3000) {
    // Remove existing hint
    const existing = document.querySelector('.keyboard-hint');
    if (existing) {
      existing.remove();
    }

    const hint = document.createElement('div');
    hint.className = 'keyboard-hint show';
    hint.textContent = message;

    document.body.appendChild(hint);

    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => {
        if (hint.parentNode) {
          hint.remove();
        }
      }, 300);
    }, duration);
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.shortcuts.clear();
  }
}
