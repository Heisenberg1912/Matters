import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  url?: string;
  error?: string;
}

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  autoUpload?: boolean;
}

export default function FileUpload({
  onFilesChange,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
  },
  autoUpload = false,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const totalFiles = uploadedFiles.length + acceptedFiles.length;

      if (totalFiles > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploading: false,
        uploaded: false,
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      if (onFilesChange) {
        onFilesChange([...uploadedFiles.map(f => f.file), ...acceptedFiles]);
      }

      if (autoUpload) {
        // Auto upload functionality would go here
        toast.info('Auto-upload not implemented yet. Files ready for manual upload.');
      }
    },
    [uploadedFiles, maxFiles, onFilesChange, autoUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: maxFiles > 1,
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    if (onFilesChange) {
      onFilesChange(newFiles.map(f => f.file));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-[#cfe0ad] bg-[#cfe0ad]/10'
            : 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-[#cfe0ad]' : 'text-neutral-500'}`} />
        {isDragActive ? (
          <p className="text-white">Drop files here...</p>
        ) : (
          <div>
            <p className="text-white mb-1">Drag & drop files here, or click to select</p>
            <p className="text-sm text-neutral-400">
              Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-400">
            {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} selected
          </p>
          <div className="grid grid-cols-1 gap-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-neutral-800 flex items-center justify-center">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : uploadedFile.file.type === 'application/pdf' ? (
                    <FileIcon className="w-6 h-6 text-red-400" />
                  ) : (
                    <FileIcon className="w-6 h-6 text-neutral-400" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {uploadedFile.uploading && (
                    <Loader2 className="w-5 h-5 animate-spin text-[#cfe0ad]" />
                  )}
                  {uploadedFile.uploaded && (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  )}
                  {!uploadedFile.uploading && !uploadedFile.uploaded && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-neutral-800 rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
