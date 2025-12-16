/**
 * Brand Configuration for Watermark Application
 * Centralized configuration for all supported brands
 */

export const BRAND_CONFIGS = {
  AT247: {
    id: 'AT247',
    name: 'Aothun247.vn',
    displayName: 'Aothun247',
    description: 'Công cụ chèn logo Aothun247.vn',
    assets: {
      logoCenter: 'AT247/logogiua.png',
      logoCorner: 'AT247/logogoc.png'
    },
    watermarkTypes: [
      { text: "Mặc định", value: "default", src: "" },
      { text: "Cũ", value: "1", default: true, src: "AT247/watermark aothun247-o1.png" },
      { text: "0919604444", value: "0919604444", src: "AT247/wm0919604444.png" },
      { text: "0836344444", value: "0836344444", src: "AT247/wm0836344444.png" },
      { text: "0817801111", value: "0817801111", src: "AT247/wm0817801111.png" },
      { text: "0774194444", value: "0774194444", src: "AT247/wm0774194444.png" },
      { text: "0898168338", value: "0898168338", src: "AT247/wm0898168338.png" },
      { text: "0859784444", value: "0859784444", src: "AT247/wm0859784444.png" }
    ],
    watermarkLogic: 'AT247',
    theme: {
      primaryColor: '#2260ff',
      backgroundColor: '#f5f7fb'
    }
  },

  DPCS: {
    id: 'DPCS',
    name: 'DPCS',
    displayName: 'ĐPCS',
    description: 'Công cụ chèn logo ĐPCS',
    assets: {
      logoCenter: 'DPCS/centerbtp.png',
      logoCorner: 'DPCS/logobtp.png'
    },
    watermarkTypes: [
      { text: "0961887777", value: "0961887777", src: "DPCS/sdtbtp.png", default: true },
      { text: "0886112255", value: "0886112255", src: "DPCS/n0886112255.png" },
      { text: "0931987654", value: "0931987654", src: "DPCS/n0931987654.png" },
      { text: "0844371111", value: "0844371111", src: "DPCS/n0844371111.png" },
      { text: "0825484444", value: "0825484444", src: "DPCS/n0825484444.png" },
      { text: "0783868668", value: "0783868668", src: "DPCS/n0783868668.png" },
      { text: "0889821234", value: "0889821234", src: "DPCS/n0889821234.png" },
      { text: "0835061234", value: "0835061234", src: "DPCS/n0835061234.png" },
      { text: "0817867777", value: "0817867777", src: "DPCS/n0817867777.png" },
      { text: "Không SĐT", value: "nophone", src: "" }
    ],
    watermarkLogic: 'DPCS',
    features: {
      logoLeftToggle: true
    },
    theme: {
      primaryColor: '#c32032',
      backgroundColor: '#f5f7fb'
    }
  },

  TT: {
    id: 'TT',
    name: 'DPTT',
    displayName: 'ĐPTT',
    description: 'Công cụ chèn logo ĐPTT',
    assets: {
      logoCenter: 'TT/centern.png',
      logoCorner: 'TT/logo.png'
    },
    watermarkTypes: [
      { text: "Mặc định", value: "0", src: "", default: true },
      { text: "0927687777", value: "0927687777", src: "TT/n0927687777.png" },
      { text: "0961887777", value: "0961887777", src: "TT/n0961887777.png" },
      { text: "0838344444", value: "0838344444", src: "TT/n0838344444.png" },
      { text: "0931987654", value: "0931987654", src: "TT/n0931987654.png" },
      { text: "0822931234", value: "0822931234", src: "TT/n0822931234.png" },
      { text: "0825484444", value: "0825484444", src: "TT/n0825484444.png" },
      { text: "0859784444", value: "0859784444", src: "TT/n0859784444.png" },
      { text: "0889821234", value: "0889821234", src: "TT/n0889821234.png" },
      { text: "0813866868", value: "0813866868", src: "TT/n0813866868.png" },
      { text: "0842554444", value: "0842554444", src: "TT/n0842554444.png" },
      { text: "0837974444", value: "0837974444", src: "TT/n0837974444.png" },
      { text: "0898168338", value: "0898168338", src: "TT/n0898168338.png" },
      { text: "0774194444", value: "0774194444", src: "TT/n0774194444.png" },
      { text: "0836344444", value: "0836344444", src: "TT/n0836344444.png" },
      { text: "0817867777", value: "0817867777", src: "TT/n0817867777.png" }
    ],
    watermarkLogic: 'TT',
    theme: {
      primaryColor: '#2260ff',
      backgroundColor: '#f5f7fb'
    }
  },

  DPSG: {
    id: 'DPSG',
    name: 'DPSG',
    displayName: 'ĐPSG',
    description: 'Công cụ chèn logo ĐPSG',
    assets: {
      logoBottom: 'DPSG/logobottom.png',
      center: 'DPSG/center.png',
      number: 'DPSG/sdt.png'
    },
    watermarkTypes: [
      { text: "Mặc định", value: "0", default: true },
      { text: "K chèn", value: "200" }
    ],
    watermarkLogic: 'DPSG',
    downloadType: 'zip',
    theme: {
      primaryColor: '#2260ff',
      backgroundColor: '#f5f7fb'
    }
  }
};

export const DEFAULT_BRAND = 'AT247';

export const getBrandConfig = (brandId) => {
  return BRAND_CONFIGS[brandId] || BRAND_CONFIGS[DEFAULT_BRAND];
};

export const getBrandList = () => {
  return Object.values(BRAND_CONFIGS);
};
