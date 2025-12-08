'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { StorageBucket } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  bucket: StorageBucket;
  accept?: string;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  multiple?: boolean;
  onUploadSuccess?: (result: { path: string; publicUrl: string }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  bucket,
  accept = 'image/*',
  maxSize = 5,
  allowedTypes,
  multiple = false,
  onUploadSuccess,
  onUploadError,
  className,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { upload, uploadMultiple, isUploading, progress, error } = useFileUpload({
    bucket,
    maxSize,
    allowedTypes,
    onSuccess: result => {
      if (result.path && result.publicUrl) {
        onUploadSuccess?.({ path: result.path, publicUrl: result.publicUrl });
      }
      setSelectedFiles([]);
    },
    onError: onUploadError,
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);

      if (files.length === 0) return;

      if (multiple) {
        await uploadMultiple(files);
      } else {
        await upload(files[0]);
      }
    },
    [disabled, isUploading, multiple, upload, uploadMultiple]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setSelectedFiles(files);

      if (files.length === 0) return;

      if (multiple) {
        await uploadMultiple(files);
      } else {
        await upload(files[0]);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [multiple, upload, uploadMultiple]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled || isUploading
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer',
          error && 'border-red-500'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="w-10 h-10 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isUploading
                ? 'Subiendo...'
                : dragActive
                  ? 'Suelta los archivos aquí'
                  : 'Arrastra archivos o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept} (máx. {maxSize}MB)
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">
              {progress}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {selectedFiles.length > 0 && !isUploading && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded-lg"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <FileIcon className="w-5 h-5 text-gray-400" />
              )}
              <span className="flex-1 text-sm truncate">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
