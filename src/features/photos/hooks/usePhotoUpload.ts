import { useState } from 'react';
import { photoRepository } from '@/core/repositories/photoRepository';
import type { PhotoDoc } from '@/core/repositories/photoRepository';
import type { PickedPhoto } from '@/features/photos/types';

export interface UsePhotoUploadResult {
  isUploading: boolean;
  /** 全体進捗 0〜100 */
  uploadProgress: number;
  error: string | null;
  uploadedPhotos: PhotoDoc[];
  uploadPhotos: (params: {
    uid: string;
    noteId: string;
    photos: PickedPhoto[];
  }) => Promise<PhotoDoc[] | null>;
  resetUploadState: () => void;
}

export function usePhotoUpload(): UsePhotoUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoDoc[]>([]);

  async function uploadPhotos(params: {
    uid: string;
    noteId: string;
    photos: PickedPhoto[];
  }): Promise<PhotoDoc[] | null> {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadedPhotos([]);

    try {
      const result = await photoRepository.uploadPhotosForNote({
        uid: params.uid,
        noteId: params.noteId,
        photos: params.photos,
        onProgress: (total) => setUploadProgress(total),
      });
      setUploadedPhotos(result);
      setUploadProgress(100);
      return result;
    } catch {
      setError('写真の保存に失敗しました。ノートは作成済みです。');
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  function resetUploadState() {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setUploadedPhotos([]);
  }

  return { isUploading, uploadProgress, error, uploadedPhotos, uploadPhotos, resetUploadState };
}
