import { useState, useCallback } from 'react';
import type { UploadedFile } from '@/types/upload';

export const useFileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const generateFileId = () => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const addFiles = useCallback(async (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = [];

    for (const file of newFiles) {
      const preview = await createFilePreview(file);
      uploadFiles.push({
        id: generateFileId(),
        file,
        preview,
        progress: 0,
        status: 'uploading'
      });
    }

    setFiles(prev => [...prev, ...uploadFiles]);
    return uploadFiles;
  }, []);

  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, progress }
          : file
      )
    );
  }, []);

  const updateFileStatus = useCallback((fileId: string, status: UploadedFile['status'], error?: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, status, error }
          : file
      )
    );
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const simulateUpload = useCallback(async (file: UploadedFile) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      updateFileProgress(file.id, progress);
    }

    updateFileStatus(file.id, 'processing');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateFileStatus(file.id, 'completed');
  }, [updateFileProgress, updateFileStatus]);

  return {
    files,
    isDragging,
    setIsDragging,
    addFiles,
    updateFileProgress,
    updateFileStatus,
    removeFile,
    clearFiles,
    simulateUpload
  };
};