/**
 * BrandSelector - Component for switching between brands
 */

import { getBrandList } from '../config/brands.js';

export class BrandSelector {
  constructor(container, onBrandChange, currentBrand = 'AT247') {
    this.container = container;
    this.onBrandChange = onBrandChange;
    this.currentBrand = currentBrand;
    this.brands = getBrandList();
    
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="brand-selector">
        <label for="brand-select" class="brand-label">Chọn thương hiệu:</label>
        <select id="brand-select" class="brand-select">
          ${this.renderBrandOptions()}
        </select>
      </div>
    `;
  }

  renderBrandOptions() {
    return this.brands
      .map(brand => 
        `<option value="${brand.id}" ${brand.id === this.currentBrand ? 'selected' : ''}>
          ${brand.displayName}
        </option>`
      ).join('');
  }

  setupEventListeners() {
    const select = this.container.querySelector('#brand-select');
    select.addEventListener('change', (e) => {
      const newBrand = e.target.value;
      if (newBrand !== this.currentBrand) {
        this.currentBrand = newBrand;
        this.updateBrandInfo();
        this.onBrandChange(newBrand);
      }
    });
  }

  getCurrentBrandName() {
    const brand = this.brands.find(b => b.id === this.currentBrand);
    return brand ? brand.displayName : this.currentBrand;
  }

  updateBrandInfo() {
    const brandInfo = this.container.querySelector('.current-brand');
    if (brandInfo) {
      brandInfo.textContent = this.getCurrentBrandName();
    }
  }

  setBrand(brandId) {
    if (this.brands.find(b => b.id === brandId)) {
      this.currentBrand = brandId;
      
      const select = this.container.querySelector('#brand-select');
      if (select) {
        select.value = brandId;
      }
      
      this.updateBrandInfo();
    }
  }
}
