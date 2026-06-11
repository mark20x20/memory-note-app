import { useEffect, useState } from 'react';
import { photoRepository } from '@/core/repositories/photoRepository';
import type { PhotoDoc } from '@/core/repositories/photoRepository';

export interface UseNotePhotosResult {
  photos: PhotoDoc[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * ノートの写真一覧をリアルタイムで購読するフック。
 * noteId が null の場合は空配列を返す。
 */
export function useNotePhotos(noteId: string | null): UseNotePhotosResult {
  const [photos, setPhotos] = useState<PhotoDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!noteId) {
      setPhotos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = photoRepository.subscribePhotosByNoteId(
      noteId,
      (docs) => {
        setPhotos(docs);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [noteId]);

  return { photos, isLoading, error };
}
