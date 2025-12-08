import type { StorageBucket } from './constants';

export interface StorageFile {
  name: string;
  path: string;
  publicUrl: string;
  size?: number;
  contentType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  file: File;
}

export interface FileValidation {
  maxSize?: number; // en MB
  allowedTypes?: string[]; // MIME types, ej: ['image/*', 'application/pdf']
  maxFiles?: number;
  minFiles?: number;
}

export interface UploadConfig {
  bucket: StorageBucket;
  path?: string;
  validation?: FileValidation;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (file: StorageFile) => void;
  onError?: (error: string) => void;
}

export interface StorageError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ImageUploadConfig extends UploadConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  path?: string;
  publicUrl?: string;
}

export interface BucketConfig {
  name: StorageBucket;
  public: boolean;
  fileSizeLimit?: number; // en bytes
  allowedMimeTypes?: string[];
}

export const FILE_SIZE_LIMITS = {
  IMAGE: 5, // 5 MB
  DOCUMENT: 10, // 10 MB
  VIDEO: 100, // 100 MB
  GENERAL: 50, // 50 MB
} as const;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
] as const;

// Configuraciones predefinidas para cada bucket
export const BUCKET_CONFIGS: Record<StorageBucket, BucketConfig> = {
  products: {
    name: 'products',
    public: true,
    fileSizeLimit: FILE_SIZE_LIMITS.IMAGE * 1024 * 1024,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  },
  avatars: {
    name: 'avatars',
    public: true,
    fileSizeLimit: FILE_SIZE_LIMITS.IMAGE * 1024 * 1024,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  },
  categories: {
    name: 'categories',
    public: true,
    fileSizeLimit: FILE_SIZE_LIMITS.IMAGE * 1024 * 1024,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  },
  banners: {
    name: 'banners',
    public: true,
    fileSizeLimit: FILE_SIZE_LIMITS.IMAGE * 1024 * 1024,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  },
  documents: {
    name: 'documents',
    public: false,
    fileSizeLimit: FILE_SIZE_LIMITS.DOCUMENT * 1024 * 1024,
    allowedMimeTypes: [...ALLOWED_DOCUMENT_TYPES],
  },
};
