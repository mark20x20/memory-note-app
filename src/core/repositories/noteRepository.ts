import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/firebase/client';

export type NoteType = 'personal' | 'shared';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface NoteInput {
  title: string;
  memo: string;
  noteType: NoteType;
}

// Phase 10: ノート編集入力
export interface NoteUpdateInput {
  title: string;
  memo: string;
  noteType: NoteType;
  /** undefined = AI日記を変更しない。string（空文字含む）= 値を更新してステータスを 'edited' にする */
  aiDiary?: string;
}

export interface NoteDoc {
  id: string;
  ownerId: string;
  title: string;
  memo: string;
  noteType: NoteType;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  members: Record<string, MemberRole>;
  /** Phase 7: 代表写真URL（先頭写真のdownloadURL）*/
  coverPhotoURL?: string | null;
  /** Phase 7: 保存済み写真枚数 */
  photoCount?: number;

  // Phase 9: AI Diary — すべて optional（既存ノートとの後方互換性を保つ）
  /** AI生成した短文日記テキスト */
  aiDiary?: string | null;
  /** AI生成ステータス。フィールドなし / null は 'idle' と同等 */
  aiDiaryStatus?: 'idle' | 'generating' | 'completed' | 'failed' | 'edited';
  /** 最後に生成成功した日時 */
  aiDiaryGeneratedAt?: Timestamp | null;
  /** ステータスが更新された日時 */
  aiDiaryUpdatedAt?: Timestamp | null;
  /** 生成失敗時のユーザー向けエラーメッセージ */
  aiDiaryError?: string | null;
}

export const noteRepository = {
  async createNote(uid: string, input: NoteInput): Promise<string> {
    if (!db) throw new Error('Firestore not configured');
    const ref = collection(db, 'memory_notes');
    const docRef = await addDoc(ref, {
      ownerId: uid,
      title: input.title.trim(),
      memo: input.memo.trim(),
      noteType: input.noteType,
      members: { [uid]: 'owner' as MemberRole },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getNotesByOwner(uid: string): Promise<NoteDoc[]> {
    if (!db) return [];
    const ref = collection(db, 'memory_notes');
    const q = query(ref, where('ownerId', '==', uid));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteDoc));
    docs.sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });
    return docs;
  },

  async getNoteById(noteId: string): Promise<NoteDoc | null> {
    if (!db) return null;
    const ref = doc(db, 'memory_notes', noteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as NoteDoc;
  },

  /**
   * Phase 10: ノートのタイトル・メモ・種別・AI日記を更新する。
   * ownerId / members / coverPhotoURL / photoCount は変更しない。
   */
  async updateNote(noteId: string, input: NoteUpdateInput): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const noteRef = doc(db, 'memory_notes', noteId);
    const updateData: Record<string, unknown> = {
      title: input.title.trim(),
      memo: input.memo.trim(),
      noteType: input.noteType,
      updatedAt: serverTimestamp(),
    };
    if (input.aiDiary !== undefined) {
      updateData.aiDiary = input.aiDiary;
      updateData.aiDiaryStatus = 'edited';
      updateData.aiDiaryUpdatedAt = serverTimestamp();
    }
    await updateDoc(noteRef, updateData);
  },

  /**
   * Phase 10: ノートドキュメントを Firestore から削除する。
   * Storage・photos サブコレクションは photoRepository.deletePhotosForNote で先に削除する。
   */
  async deleteNote(noteId: string): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const noteRef = doc(db, 'memory_notes', noteId);
    await deleteDoc(noteRef);
  },

  /**
   * Phase 7: 写真アップロード完了後に代表写真URLと枚数をノートへ書き込む。
   */
  async updateCoverPhoto(
    noteId: string,
    params: { coverPhotoURL: string; photoCount: number }
  ): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const noteRef = doc(db, 'memory_notes', noteId);
    await updateDoc(noteRef, {
      coverPhotoURL: params.coverPhotoURL,
      photoCount: params.photoCount,
      updatedAt: serverTimestamp(),
    });
  },
};
