/**
 * Application Constants
 */

export const APP_CONFIG = {
  name: 'Watermark Tools',
  version: '2.0.0',
  description: 'Multi-brand watermark application'
};

export const CANVAS_CONFIG = {
  minSize: 600,
  maxSize: 2000,
  defaultQuality: 0.9
};

export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

export const FILE_EXTENSIONS = [
  '.jpeg',
  '.jpg', 
  '.png',
  '.webp',
  '.gif'
];

export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP, GIF)',
  UPLOAD_FAILED: 'Không thể tải lên file. Vui lòng thử lại.',
  PROCESSING_FAILED: 'Không thể xử lý hình ảnh. Vui lòng thử lại.',
  NO_IMAGES_SELECTED: 'Không có ảnh nào được chọn!',
  DOWNLOAD_FAILED: 'Lỗi khi tải xuống. Vui lòng thử lại.',
  BROWSER_NOT_SUPPORTED: 'Trình duyệt không hỗ trợ tính năng này'
};

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Tải lên thành công!',
  PROCESSING_SUCCESS: 'Xử lý hình ảnh thành công!',
  DOWNLOAD_SUCCESS: 'Tải xuống thành công!'
};

export const UI_STRINGS = {
  UPLOAD_BUTTON: 'Upload a file',
  SELECT_ALL: 'Chọn tất cả',
  DESELECT_ALL: 'Bỏ chọn tất cả',
  DOWNLOAD: 'Tải xuống',
  DROP_ZONE_TEXT: 'Thả hình ảnh, paste hoặc upload file tại đây.',
  DROP_ZONE_HELP: 'Có thể up nhiều hình ảnh 1 lúc và chọn rồi bấm download ở dưới. Khi tải nhiều ảnh, hệ thống sẽ cho phép chọn thư mục để lưu file trực tiếp.',
  DROP_ANYWHERE: 'Thả ảnh bất kỳ đâu'
};
