/**
 * Main Application Entry Point
 * Modern Watermark Application with Multi-Brand Support
 */

import { WatermarkApp } from './components/WatermarkApp.js';
import { getBrandList, DEFAULT_BRAND } from './config/brands.js';
import { checkBrowserSupport } from './utils/validators.js';

class App {
  constructor() {
    this.app = null;
    this.currentBrand = DEFAULT_BRAND;
    this.init();
  }

  async init() {
    try {
      // Check browser support
      const browserSupport = checkBrowserSupport();
      if (!browserSupport.isFullySupported) {
        this.showBrowserWarning(browserSupport.unsupportedFeatures);
      }

      // Get URL parameters for brand selection
      const urlParams = new URLSearchParams(window.location.search);
      const brandFromUrl = urlParams.get('brand');
      
      if (brandFromUrl) {
        const brands = getBrandList();
        const brand = brands.find(b => b.id === brandFromUrl.toUpperCase());
        if (brand) {
          this.currentBrand = brand.id;
        }
      }

      // Initialize main application
      this.app = new WatermarkApp(document.getElementById('app'), this.currentBrand);
      
      // Setup error handling
      this.setupErrorHandling();
      
      console.log('✅ Watermark App initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showFatalError(error);
    }
  }

  showBrowserWarning(unsupportedFeatures) {
    const warning = document.createElement('div');
    warning.className = 'browser-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <h3>⚠️ Trình duyệt chưa hỗ trợ đầy đủ</h3>
        <p>Một số tính năng có thể không hoạt động:</p>
        <ul>
          ${unsupportedFeatures.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        <p>Khuyến nghị sử dụng Chrome, Firefox, Edge hoặc Safari phiên bản mới nhất.</p>
      </div>
    `;
    
    document.body.insertBefore(warning, document.body.firstChild);
  }

  showFatalError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fatal-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h2>❌ Lỗi khởi tạo ứng dụng</h2>
        <p>Đã xảy ra lỗi khi khởi tạo ứng dụng. Vui lòng thử:</p>
        <ul>
          <li>Refresh trang (F5)</li>
          <li>Xóa cache trình duyệt</li>
          <li>Thử với trình duyệt khác</li>
        </ul>
        <details>
          <summary>Chi tiết lỗi (dành cho developer)</summary>
          <pre>${error.stack || error.message}</pre>
        </details>
        <button onclick="window.location.reload()">Thử lại</button>
      </div>
    `;
    
    document.getElementById('app').appendChild(errorDiv);
  }

  setupErrorHandling() {
    // Global error handler - only log, don't show toast for UI errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      // Only show toast for very critical errors (like network/loading issues)
      if (this.isCriticalError(event.error)) {
        this.handleError(event.error);
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Only show toast for very critical errors
      if (this.isCriticalError(event.reason)) {
        this.handleError(event.reason);
      }
    });
  }

  isCriticalError(error) {
    // Very conservative - only show for app-breaking errors
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    
    // Only show for truly critical issues
    const criticalPatterns = [
      'ChunkLoadError',
      'Loading chunk',
      'Failed to import',
      'Module not found'
    ];
    
    return criticalPatterns.some(pattern => errorMessage.includes(pattern));
  }

  handleError(error) {
    // Show user-friendly error message
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.textContent = '❌ Đã xảy ra lỗi. Vui lòng thử lại.';
    
    document.body.appendChild(errorToast);
    
    setTimeout(() => {
      if (errorToast.parentNode) {
        errorToast.parentNode.removeChild(errorToast);
      }
    }, 5000);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
