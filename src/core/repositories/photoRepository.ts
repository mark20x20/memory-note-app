import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/core/firebase/client';
import type { PickedPhoto } from '@/features/photos/types';

// ── 型定義 ───────────────────────────────────────────────────────────────────

export type PhotoDoc = {
  id: string;
  noteId: string;
  ownerId: string;
  storagePath: string;
  downloadURL: string;
  fileName: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  takenAt: string | null;
  latitude: number | null;
  longitude: number | null;
  sortOrder: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

// ── ヘルパー ─────────────────────────────────────────────────────────────────

/** MIMEタイプまたはファイル名から拡張子を取得 */
function getExtension(photo: PickedPhoto): string {
  if (photo.mimeType) {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = map[photo.mimeType.toLowerCase()];
    if (ext) return ext;
  }
  if (photo.fileName) {
    const parts = photo.fileName.split('.');
    if (parts.length > 1) return parts[parts.length - 1].toLowerCase();
  }
  return 'jpg';
}

/** ローカルURI → Blob 変換（React Native の fetch は file:// / content:// URI に対応） */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read photo: ${response.status}`);
  }
  return response.blob();
}

// ── Repository ────────────────────────────────────────────────────────────────

export const photoRepository = {
  /**
   * 1枚の写真を Storage にアップロードし、Firestore にメタデータを保存する。
   */
  async uploadPhotoForNote(params: {
    uid: string;
    noteId: string;
    photo: PickedPhoto;
    sortOrder: number;
    onProgress?: (progress: number) => void;
  }): Promise<PhotoDoc> {
    if (!db || !storage) throw new Error('Firebase not configured');

    const { uid, noteId, photo, sortOrder, onProgress } = params;

    // Storage path: users/{uid}/memory_notes/{noteId}/photos/{timestamp}_{index}.{ext}
    const ext = getExtension(photo);
    const storageFileName = `${Date.now()}_${sortOrder}.${ext}`;
    const storagePath = `users/${uid}/memory_notes/${noteId}/photos/${storageFileName}`;

    // URI → Blob
    const blob = await uriToBlob(photo.uri);

    // Firebase Storage アップロード（進捗コールバック付き）
    const storageRef = ref(storage, storagePath);
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);
      task.on(
        'state_changed',
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(pct);
        },
        (err) => reject(err),
        () => resolve()
      );
    });

    const downloadURL = await getDownloadURL(storageRef);

    // Firestore にメタデータ保存
    const photosCol = collection(db, 'memory_notes', noteId, 'photos');
    const docRef = await addDoc(photosCol, {
      noteId,
      ownerId: uid,
      storagePath,
      downloadURL,
      fileName: photo.fileName ?? null,
      mimeType: photo.mimeType ?? null,
      width: photo.width ?? null,
      height: photo.height ?? null,
      fileSize: photo.fileSize ?? null,
      takenAt: photo.takenAt ?? null,
      latitude: photo.latitude ?? null,
      longitude: photo.longitude ?? null,
      sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      noteId,
      ownerId: uid,
      storagePath,
      downloadURL,
      fileName: photo.fileName ?? null,
      mimeType: photo.mimeType ?? null,
      width: photo.width ?? null,
      height: photo.height ?? null,
      fileSize: photo.fileSize ?? null,
      takenAt: photo.takenAt ?? null,
      latitude: photo.latitude ?? null,
      longitude: photo.longitude ?? null,
      sortOrder,
      createdAt: null, // serverTimestamp() はローカルでは即時取得不可
      updatedAt: null,
    };
  },

  /**
   * 複数枚の写真を並列アップロードし、全体進捗を通知する。
   */
  async uploadPhotosForNote(params: {
    uid: string;
    noteId: string;
    photos: PickedPhoto[];
    onProgress?: (totalProgress: number) => void;
  }): Promise<PhotoDoc[]> {
    const { uid, noteId, photos, onProgress } = params;
    if (photos.length === 0) return [];

    // 各写真の進捗を配列で管理 → 合算して全体進捗を計算
    const progresses = new Array<number>(photos.length).fill(0);

    const results = await Promise.all(
      photos.map((photo, index) =>
        photoRepository.uploadPhotoForNote({
          uid,
          noteId,
          photo,
          sortOrder: index,
          onProgress: (pct) => {
            progresses[index] = pct;
            const total = progresses.reduce((s, v) => s + v, 0) / photos.length;
            onProgress?.(total);
          },
        })
      )
    );

    return results;
  },

  /**
   * ノートの写真一覧を1回取得する。
   */
  async getPhotosByNoteId(noteId: string): Promise<PhotoDoc[]> {
    if (!db) return [];
    const colRef = collection(db, 'memory_notes', noteId, 'photos');
    const q = query(colRef, orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PhotoDoc));
  },

  /**
   * Phase 10: ノートに紐づく写真を Storage と Firestore から全件削除する。
   * Storage 削除が部分的に失敗した場合もエラーをまとめてスローする。
   * Firestore の photos サブコレクションは Storage 削除後に削除する。
   */
  async deletePhotosForNote(noteId: string): Promise<void> {
    if (!db || !storage) throw new Error('Firebase not configured');

    const colRef = collection(db, 'memory_notes', noteId, 'photos');
    const snap = await getDocs(colRef);
    if (snap.empty) return;

    const storageErrors: string[] = [];

    // 1. Storage ファイルを削除
    await Promise.all(
      snap.docs.map(async (d) => {
        const storagePath = (d.data() as PhotoDoc).storagePath;
        if (!storagePath) return;
        try {
          await deleteObject(ref(storage!, storagePath));
        } catch (e) {
          // Storage に存在しないファイルは無視（already deleted など）
          const code = (e as { code?: string }).code;
          if (code !== 'storage/object-not-found') {
            storageErrors.push(storagePath);
          }
        }
      })
    );

    // 2. Firestore の photo ドキュメントを削除
    await Promise.all(
      snap.docs.map((d) => deleteDoc(doc(db!, 'memory_notes', noteId, 'photos', d.id)))
    );

    if (storageErrors.length > 0) {
      throw new Error(
        `Storage から削除できなかったファイルがあります: ${storageErrors.join(', ')}`
      );
    }
  },

  /**
   * ノートの写真一覧をリアルタイムで監視する。
   * 戻り値は unsubscribe 関数。
   */
  subscribePhotosByNoteId(
    noteId: string,
    onUpdate: (photos: PhotoDoc[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!db) {
      onUpdate([]);
      return () => {};
    }
    const colRef = collection(db, 'memory_notes', noteId, 'photos');
    const q = query(colRef, orderBy('sortOrder', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PhotoDoc)));
      },
      (err) => {
        onError?.(err);
      }
    );
  },
};
