// Phase 12.5B: Place Intelligence — PlaceGroup / PlaceCandidate Repository
// Firestore: memory_notes/{noteId}/place_groups/{placeGroupId}
//            memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId}

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { PlaceGroupDoc, PlaceCandidateDoc } from '@/features/map/types';

// ── 型エイリアス ─────────────────────────────────────────────────────────────

type PlaceGroupInput = Omit<PlaceGroupDoc, 'id' | 'createdAt' | 'updatedAt'>;
type PlaceGroupUpdate = Partial<Omit<PlaceGroupDoc, 'id' | 'noteId' | 'createdAt' | 'updatedAt'>>;

// ── Repository ────────────────────────────────────────────────────────────────

export const placeGroupRepository = {
  /**
   * ノートの PlaceGroup 一覧をリアルタイムで監視する。
   * 作成日昇順で返す（Phase 8 の写真順序と対応しやすいため）。
   */
  subscribePlaceGroupsByNoteId(
    noteId: string,
    onNext: (groups: PlaceGroupDoc[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onNext([]);
      return () => {};
    }
    const colRef = collection(db, 'memory_notes', noteId, 'place_groups');
    const q = query(colRef, orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlaceGroupDoc)));
      },
      (err) => {
        onError?.(err);
      }
    );
  },

  /**
   * PlaceGroup を1件取得する。
   */
  async getPlaceGroupById(
    noteId: string,
    placeGroupId: string
  ): Promise<PlaceGroupDoc | null> {
    if (!db) return null;
    const ref = doc(db, 'memory_notes', noteId, 'place_groups', placeGroupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PlaceGroupDoc;
  },

  /**
   * PlaceGroup に紐づく候補一覧を取得する（confidence 降順）。
   * Cloud Functions が candidates サブコレクションに書き込んだ後にクライアントが参照する。
   */
  async getPlaceCandidatesByGroupId(
    noteId: string,
    placeGroupId: string
  ): Promise<PlaceCandidateDoc[]> {
    if (!db) return [];
    const colRef = collection(
      db,
      'memory_notes',
      noteId,
      'place_groups',
      placeGroupId,
      'candidates'
    );
    const q = query(colRef, orderBy('confidence', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlaceCandidateDoc));
  },

  /**
   * PlaceGroup を新規作成する。
   * ID は Firestore が自動採番する。
   * 返り値は作成されたドキュメントの ID。
   */
  async createPlaceGroup(
    noteId: string,
    data: PlaceGroupInput
  ): Promise<string> {
    if (!db) throw new Error('Firestore not configured');
    const colRef = collection(db, 'memory_notes', noteId, 'place_groups');
    const docRef = await addDoc(colRef, {
      ...data,
      noteId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * PlaceGroup を部分更新する。
   * userConfirmed / selectedCandidateId / label / category 等の更新に使用する。
   */
  async updatePlaceGroup(
    noteId: string,
    placeGroupId: string,
    updates: PlaceGroupUpdate
  ): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const ref = doc(db, 'memory_notes', noteId, 'place_groups', placeGroupId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * PlaceGroup を1件削除する（candidates サブコレクションは含まない）。
   * candidates の削除は deletePlaceGroupsForNote または Cloud Functions で行う。
   */
  async deletePlaceGroup(noteId: string, placeGroupId: string): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const ref = doc(db, 'memory_notes', noteId, 'place_groups', placeGroupId);
    await deleteDoc(ref);
  },

  /**
   * ノートに紐づく PlaceGroup を全件削除する。
   * Phase 10 のノート削除連鎖（deleteNote）や Cloud Functions から呼び出す想定。
   *
   * 注意: candidates サブコレクションは Firestore クライアント SDK では
   * 再帰削除できない。candidates の削除は Cloud Functions Admin SDK で行うこと。
   * クライアントからは PlaceGroup ドキュメントのみ削除し、
   * 孤立した candidates は Cloud Functions のクリーンアップジョブで対処する。
   */
  async deletePlaceGroupsForNote(noteId: string): Promise<void> {
    if (!db) throw new Error('Firestore not configured');
    const colRef = collection(db, 'memory_notes', noteId, 'place_groups');
    const snap = await getDocs(colRef);
    if (snap.empty) return;
    await Promise.all(
      snap.docs.map((d) =>
        deleteDoc(doc(db!, 'memory_notes', noteId, 'place_groups', d.id))
      )
    );
  },
};
