// Storage clients (client-safe only)
export {
  getStorageClient,
  getPublicUrl,
} from './client';

// Constants
export { STORAGE_BUCKETS, type StorageBucket } from './constants';

// Upload functions
export {
  uploadFile,
  uploadMultipleFiles,
  uploadImage,
  replaceFile,
  generateUniqueFileName,
  generateDatePath,
  validateFileType,
  validateFileSize,
  type UploadOptions,
  type UploadResult,
} from './upload';

// File management
export {
  listFiles,
  deleteFile,
  deleteMultipleFiles,
  moveFile,
  copyFile,
  downloadFile,
  getFileInfo,
  createFolder,
  emptyFolder,
  type FileObject,
  type ListFilesOptions,
} from './manage';

// Types
export type {
  StorageFile,
  UploadProgress,
  FileValidation,
  UploadConfig,
  StorageError,
  ImageUploadConfig,
  FileMetadata,
  BucketConfig,
} from './types';

export {
  FILE_SIZE_LIMITS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  BUCKET_CONFIGS,
} from './types';
