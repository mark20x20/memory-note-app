import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { PickedPhoto } from '../types';

const MAX_PHOTOS = 10;

export interface UsePhotoPickerResult {
  photos: PickedPhoto[];
  isPicking: boolean;
  error: string | null;
  pickPhotos: () => Promise<void>;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
}

let _idCounter = 0;
function generateId(): string {
  return `photo_${Date.now()}_${++_idCounter}`;
}

/**
 * Parse EXIF date string "YYYY:MM:DD HH:MM:SS" → ISO-8601 "YYYY-MM-DD HH:MM:SS"
 * Returns null when the value is absent or not parseable.
 */
function extractTakenAt(exif: Record<string, unknown> | null | undefined): string | null {
  if (!exif) return null;
  const raw = exif['DateTimeOriginal'] ?? exif['DateTime'];
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
}

/**
 * Extract GPS decimal-degree coordinates from EXIF.
 * expo-image-picker v17 returns decimal degrees directly.
 */
function extractGPS(
  exif: Record<string, unknown> | null | undefined
): { lat: number | null; lng: number | null } {
  if (!exif) return { lat: null, lng: null };
  const lat = typeof exif['GPSLatitude'] === 'number' ? exif['GPSLatitude'] : null;
  const lng = typeof exif['GPSLongitude'] === 'number' ? exif['GPSLongitude'] : null;
  return { lat, lng };
}

export function usePhotoPicker(): UsePhotoPickerResult {
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickPhotos(): Promise<void> {
    setIsPicking(true);
    setError(null);

    try {
      // ── 1. 権限確認 ──────────────────────────────────────────
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        setError('写真ライブラリへのアクセスが許可されていません。設定からアクセスを許可してください。');
        return;
      }

      // ── 2. ピッカーを起動 ────────────────────────────────────
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // MediaTypeOptions は v17 で非推奨のため新 API を使用
        allowsMultipleSelection: true,
        quality: 1,
        exif: true,
      });

      // ── 3. キャンセル確認 ────────────────────────────────────
      if (result.canceled) {
        return; // キャンセル時はエラーにしない
      }

      // ── 4. アセット検証 ──────────────────────────────────────
      const newAssets = result.assets;
      if (!newAssets || newAssets.length === 0) {
        return;
      }

      // ── 5. 上限チェック ──────────────────────────────────────
      const currentCount = photos.length;
      const remaining = MAX_PHOTOS - currentCount;
      if (newAssets.length > remaining) {
        setError(
          `写真は最大${MAX_PHOTOS}枚まで選択できます（あと${remaining}枚追加可能）`
        );
        return;
      }

      // ── 6. PickedPhoto に変換 ────────────────────────────────
      const picked: PickedPhoto[] = newAssets.map((asset) => {
        const exifRaw = asset.exif as Record<string, unknown> | null | undefined;
        const { lat, lng } = extractGPS(exifRaw);
        const photo: PickedPhoto = {
          id: generateId(),
          uri: asset.uri,
          fileName: asset.fileName ?? null,
          width: asset.width,
          height: asset.height,
          mimeType: asset.mimeType ?? null,
          fileSize: asset.fileSize,
          takenAt: extractTakenAt(exifRaw),
          latitude: lat,
          longitude: lng,
          exif: exifRaw ?? null,
        };
        return photo;
      });

      // ── 7. state 更新 ────────────────────────────────────────
      setPhotos((prev) => [...prev, ...picked]);
    } catch {
      setError('写真の選択中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsPicking(false);
    }
  }

  function removePhoto(id: string): void {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setError(null);
  }

  function clearPhotos(): void {
    setPhotos([]);
    setError(null);
  }

  return { photos, isPicking, error, pickPhotos, removePhoto, clearPhotos };
}
