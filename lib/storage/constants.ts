// Constantes de Storage que pueden ser usadas en cliente y servidor

export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  AVATARS: 'avatars',
  CATEGORIES: 'categories',
  BANNERS: 'banners',
  DOCUMENTS: 'documents',
  PAYMENT_PROOFS: 'payment-proofs',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

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
